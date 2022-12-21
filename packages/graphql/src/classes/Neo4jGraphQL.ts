/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Driver } from "neo4j-driver";
import { DocumentNode, GraphQLSchema, Kind } from "graphql";
import type { IExecutableSchemaDefinition } from "@graphql-tools/schema";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { composeResolvers } from "@graphql-tools/resolvers-composition";
import { mergeResolvers } from "@graphql-tools/merge";
import Debug from "debug";
import type {
    DriverConfig,
    CypherQueryOptions,
    Neo4jGraphQLPlugins,
    Neo4jGraphQLCallbacks,
    Neo4jFeaturesSettings,
} from "../types";
import { makeAugmentedSchema } from "../schema";
import type Node from "./Node";
import type Relationship from "./Relationship";
import checkNeo4jCompat from "./utils/verify-database";
import type { AssertIndexesAndConstraintsOptions } from "./utils/asserts-indexes-and-constraints";
import assertIndexesAndConstraints from "./utils/asserts-indexes-and-constraints";
import { wrapResolver, wrapSubscription } from "../schema/resolvers/wrapper";
import { defaultFieldResolver } from "../schema/resolvers/field/defaultField";
import { asArray } from "../utils/utils";
import { DEBUG_ALL } from "../constants";
import { getNeo4jDatabaseInfo, Neo4jDatabaseInfo } from "./Neo4jDatabaseInfo";
import { Executor, ExecutorConstructorParam } from "./Executor";
import { getDocument } from "../schema/get-document";
import { generateModel } from "../schema-model/generate-model";
import type { Neo4jGraphQLSchemaModel } from "../schema-model/Neo4jGraphQLSchemaModel";
import { forEachField, TypeSource } from "@graphql-tools/utils";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { Subgraph } from "./Subgraph";
import { validateDocument } from "../schema/validation";

export type SchemaType = "executableSchema" | "subgraphSchema";

export interface Neo4jGraphQLConfig {
    driverConfig?: DriverConfig;
    enableRegex?: boolean;
    enableDebug?: boolean;
    skipValidateTypeDefs?: boolean;
    queryOptions?: CypherQueryOptions;
    callbacks?: Neo4jGraphQLCallbacks;
}

export interface Neo4jGraphQLConstructor {
    typeDefs: TypeSource;
    resolvers?: IExecutableSchemaDefinition["resolvers"];
    features?: Neo4jFeaturesSettings;
    config?: Neo4jGraphQLConfig;
    driver?: Driver;
    plugins?: Omit<Neo4jGraphQLPlugins, "federation">;
    schemaType?: SchemaType;
}

export type SchemaDefinition = {
    typeDefs: DocumentNode;
    resolvers: IExecutableSchemaDefinition["resolvers"];
};

class Neo4jGraphQL {
    private typeDefs: TypeSource;
    private resolvers?: IExecutableSchemaDefinition["resolvers"];

    private schemaType: SchemaType;

    private config: Neo4jGraphQLConfig;
    private driver?: Driver;
    private features?: Neo4jFeaturesSettings;

    private _nodes?: Node[];
    private _relationships?: Relationship[];
    private plugins?: Neo4jGraphQLPlugins;

    private schemaModel?: Neo4jGraphQLSchemaModel;

    private schema?: Promise<GraphQLSchema>;
    private outputSchemaDefinition?: Promise<SchemaDefinition>;

    private dbInfo?: Neo4jDatabaseInfo;

    constructor(input: Neo4jGraphQLConstructor) {
        const { config = {}, driver, plugins, features, typeDefs, resolvers, schemaType = "executableSchema" } = input;

        this.typeDefs = typeDefs;
        this.resolvers = resolvers;

        this.schemaType = schemaType;

        if (schemaType === "subgraphSchema" && !driver) {
            throw new Error("Driver must be provided when running in subgraph mode");
        }

        this.driver = driver;
        this.config = config;
        this.plugins = plugins;
        this.features = features;

        this.checkEnableDebug();
    }

    public get nodes(): Node[] {
        if (!this._nodes) {
            throw new Error("You must await `.getSchema()` or `.getSchemaDefinition()` before accessing `nodes`");
        }

        return this._nodes;
    }

    public get relationships(): Relationship[] {
        if (!this._relationships) {
            throw new Error(
                "You must await `.getSchema()` or `.getSchemaDefinition()` before accessing `relationships`"
            );
        }

        return this._relationships;
    }

    // public async getSchemaDefinition(): Promise<SchemaDefinition> {
    //     if (!this.outputSchemaDefinition) {
    //         this.outputSchemaDefinition = this.generateSchemaDefinition();
    //         await this.pluginsSetup();
    //     }

    //     return this.outputSchemaDefinition;
    // }

    public async getSchema(): Promise<GraphQLSchema> {
        if (!this.schema) {
            switch (this.schemaType) {
                case "executableSchema":
                    this.schema = this.generateExecutableSchema();
                    break;
                case "subgraphSchema":
                    this.schema = this.generateSubgraphSchema();
                    break;
            }

            await this.pluginsSetup();
        }

        return this.schema;
    }

    public async checkNeo4jCompat(input: { driver?: Driver; driverConfig?: DriverConfig } = {}): Promise<void> {
        const driver = input.driver || this.driver;
        const driverConfig = input.driverConfig || this.config?.driverConfig;

        if (!driver) {
            throw new Error("neo4j-driver Driver missing");
        }

        if (!this.dbInfo) {
            this.dbInfo = await this.getNeo4jDatabaseInfo(driver, driverConfig);
        }

        return checkNeo4jCompat({ driver, driverConfig, dbInfo: this.dbInfo });
    }

    public async assertIndexesAndConstraints(
        input: { driver?: Driver; driverConfig?: DriverConfig; options?: AssertIndexesAndConstraintsOptions } = {}
    ): Promise<void> {
        // if (!(this.schema || this.schemaDefinition)) {
        if (!this.schema) {
            throw new Error(
                "You must await `.getSchema()` or `.getSchemaDefinition()` before `.assertIndexesAndConstraints()`"
            );
        }

        await this.getSchema();

        const driver = input.driver || this.driver;
        const driverConfig = input.driverConfig || this.config?.driverConfig;

        if (!driver) {
            throw new Error("neo4j-driver Driver missing");
        }

        if (!this.dbInfo) {
            this.dbInfo = await this.getNeo4jDatabaseInfo(driver, driverConfig);
        }

        await assertIndexesAndConstraints({
            driver,
            driverConfig,
            nodes: this.nodes,
            options: input.options,
            dbInfo: this.dbInfo,
        });
    }

    /**
     * Based on the same logic as forEachField from graphql-tools which operates on schema objects
     * @link https://github.com/ardatan/graphql-tools/blob/master/packages/utils/src/forEachField.ts
     */

    private addDefaultFieldResolversToResolvers(
        typeDefs: DocumentNode,
        resolvers: IExecutableSchemaDefinition["resolvers"]
    ): IExecutableSchemaDefinition["resolvers"] {
        if (!resolvers) {
            return resolvers;
        }

        for (const definition of typeDefs.definitions) {
            if (definition.kind === Kind.OBJECT_TYPE_DEFINITION && !definition.name.value.startsWith("__")) {
                if (definition.fields) {
                    if (!resolvers[definition.name.value]) {
                        resolvers[definition.name.value] = {};
                    }

                    for (const field of definition.fields) {
                        if (!resolvers[definition.name.value][field.name.value]) {
                            resolvers[definition.name.value][field.name.value] = defaultFieldResolver;
                        }
                    }
                }
            }
        }

        return resolvers;
    }

    private addDefaultFieldResolvers(schema: GraphQLSchema): GraphQLSchema {
        forEachField(schema, (field) => {
            if (!field.resolve) {
                field.resolve = defaultFieldResolver;
            }
        });

        return schema;
    }

    private checkEnableDebug(): void {
        if (this.config.enableDebug === true || this.config.enableDebug === false) {
            if (this.config.enableDebug) {
                Debug.enable(DEBUG_ALL);
            } else {
                Debug.disable();
            }
        }
    }

    private async getNeo4jDatabaseInfo(driver: Driver, driverConfig?: DriverConfig): Promise<Neo4jDatabaseInfo> {
        const executorConstructorParam: ExecutorConstructorParam = {
            executionContext: driver,
        };

        if (driverConfig?.database) {
            executorConstructorParam.database = driverConfig?.database;
        }

        if (driverConfig?.bookmarks) {
            executorConstructorParam.bookmarks = driverConfig?.bookmarks;
        }

        return getNeo4jDatabaseInfo(new Executor(executorConstructorParam));
    }

    private wrapResolvers(resolvers: IExecutableSchemaDefinition["resolvers"]) {
        if (!resolvers) {
            throw new Error("No resolvers to wrap");
        }

        if (!this.schemaModel) {
            throw new Error("Schema Model is not defined");
        }

        const wrapResolverArgs = {
            driver: this.driver,
            config: this.config,
            nodes: this.nodes,
            relationships: this.relationships,
            schemaModel: this.schemaModel,
            plugins: this.plugins,
        };

        const resolversComposition = {
            "Query.*": [wrapResolver(wrapResolverArgs)],
            "Mutation.*": [wrapResolver(wrapResolverArgs)],
            "Subscription.*": [wrapSubscription(wrapResolverArgs)],
            "*.__resolveReference": [wrapResolver(wrapResolverArgs)],
        };

        // Merge generated and custom resolvers
        const mergedResolvers = mergeResolvers([...asArray(resolvers), ...asArray(this.resolvers)]);
        return composeResolvers(mergedResolvers, resolversComposition);
    }

    // private generateSchemaDefinition(): Promise<SchemaDefinition> {
    //     return new Promise((resolve) => {
    //         const pluginResolvers: IExecutableSchemaDefinition["resolvers"] = [];

    //         if (this.plugins?.federation) {
    //             const { resolvers: federationResolvers } = this.plugins.federation.augmentSchemaDefinition(
    //                 this.schemaDefinition.typeDefs
    //             );

    //             if (federationResolvers) {
    //                 if (Array.isArray(federationResolvers)) {
    //                     for (const r of federationResolvers) {
    //                         pluginResolvers.push(r);
    //                     }
    //                 } else {
    //                     pluginResolvers.push(federationResolvers);
    //                 }
    //             }
    //         }

    //         const document = getDocument(this.typeDefs);

    //         const { nodes, relationships, typeDefs, resolvers } = makeAugmentedSchema(document, {
    //             features: this.features,
    //             enableRegex: this.config?.enableRegex,
    //             skipValidateTypeDefs: this.config?.skipValidateTypeDefs,
    //             generateSubscriptions: Boolean(this.plugins?.subscriptions),
    //             callbacks: this.config.callbacks,
    //             userCustomResolvers: this.resolvers,
    //         });

    //         const schemaModel = generateModel(document);

    //         let pluginTypeDefs = typeDefs;

    //         if (this.plugins?.federation) {
    //             pluginTypeDefs = this.plugins.federation.augmentGeneratedSchemaDefinition(typeDefs);
    //         }

    //         this._nodes = nodes;
    //         this._relationships = relationships;

    //         this.schemaModel = schemaModel;

    //         // Wrap the generated and custom resolvers, which adds a context including the schema to every request
    //         const wrappedResolvers = this.wrapResolvers([resolvers, ...pluginResolvers]);

    //         const resolversWithDefaults = this.addDefaultFieldResolversToResolvers(pluginTypeDefs, wrappedResolvers);

    //         resolve({ typeDefs: pluginTypeDefs, resolvers: resolversWithDefaults });
    //     });
    // }

    private generateSubgraphSchema(): Promise<GraphQLSchema> {
        return new Promise((resolve) => {
            const document = getDocument(this.typeDefs);
            const subgraph = new Subgraph(this.typeDefs);

            const { directives, types } = subgraph.getValidationDefinitions();

            if (!this.config?.skipValidateTypeDefs) {
                validateDocument(document, directives, types);
            }

            const { nodes, relationships, typeDefs, resolvers } = makeAugmentedSchema(document, {
                features: this.features,
                enableRegex: this.config?.enableRegex,
                generateSubscriptions: Boolean(this.plugins?.subscriptions),
                callbacks: this.config.callbacks,
                userCustomResolvers: this.resolvers,
                subgraph,
            });

            const schemaModel = generateModel(document);

            this._nodes = nodes;
            this._relationships = relationships;

            this.schemaModel = schemaModel;

            const referenceResolvers = subgraph.getReferenceResolvers(this._nodes, this.driver as Driver);
            const subgraphTypeDefs = subgraph.augmentGeneratedSchemaDefinition(typeDefs);
            const wrappedResolvers = this.wrapResolvers([resolvers, referenceResolvers]);

            const schema = buildSubgraphSchema({
                typeDefs: subgraphTypeDefs,
                resolvers: wrappedResolvers as Record<string, any>,
            });

            resolve(this.addDefaultFieldResolvers(schema));
        });
    }

    private generateExecutableSchema(): Promise<GraphQLSchema> {
        return new Promise((resolve) => {
            const document = getDocument(this.typeDefs);

            if (!this.config?.skipValidateTypeDefs) {
                validateDocument(document);
            }

            const { nodes, relationships, typeDefs, resolvers } = makeAugmentedSchema(document, {
                features: this.features,
                enableRegex: this.config?.enableRegex,
                generateSubscriptions: Boolean(this.plugins?.subscriptions),
                callbacks: this.config.callbacks,
                userCustomResolvers: this.resolvers,
            });

            const schemaModel = generateModel(document);

            this._nodes = nodes;
            this._relationships = relationships;

            this.schemaModel = schemaModel;

            // Wrap the generated and custom resolvers, which adds a context including the schema to every request
            const wrappedResolvers = this.wrapResolvers(resolvers);

            const schema = makeExecutableSchema({
                typeDefs,
                resolvers: wrappedResolvers,
            });

            resolve(this.addDefaultFieldResolvers(schema));
        });
    }

    private async pluginsSetup(): Promise<void[]> {
        const initializers: Promise<void>[] = [];

        const subscriptionsPlugin = this.plugins?.subscriptions;
        if (subscriptionsPlugin) {
            subscriptionsPlugin.events.setMaxListeners(0); // Removes warning regarding leak. >10 listeners are expected
            if (subscriptionsPlugin.init) {
                initializers.push(subscriptionsPlugin.init());
            }
        }

        const federationPlugin = this.plugins?.federation;
        if (federationPlugin) {
            initializers.push(federationPlugin.init());
        }

        return Promise.all(initializers);
    }
}

export default Neo4jGraphQL;
