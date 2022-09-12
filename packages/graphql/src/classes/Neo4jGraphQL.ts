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
import type { GraphQLSchema } from "graphql";
import type { IExecutableSchemaDefinition } from "@graphql-tools/schema";
import { addResolversToSchema, makeExecutableSchema } from "@graphql-tools/schema";
import { composeResolvers } from "@graphql-tools/resolvers-composition";
import type { IResolvers } from "@graphql-tools/utils";
import { forEachField } from "@graphql-tools/utils";
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

export interface Neo4jGraphQLJWT {
    jwksEndpoint?: string;
    secret?: string | Buffer | { key: string | Buffer; passphrase: string };
    noVerify?: boolean;
    rolesPath?: string;
}

export interface Neo4jGraphQLConfig {
    driverConfig?: DriverConfig;
    enableRegex?: boolean;
    enableDebug?: boolean;
    skipValidateTypeDefs?: boolean;
    queryOptions?: CypherQueryOptions;
    callbacks?: Neo4jGraphQLCallbacks;
}

export interface Neo4jGraphQLConstructor extends IExecutableSchemaDefinition {
    features?: Neo4jFeaturesSettings;
    config?: Neo4jGraphQLConfig;
    driver?: Driver;
    plugins?: Neo4jGraphQLPlugins;
}

class Neo4jGraphQL {
    private config: Neo4jGraphQLConfig;
    private driver?: Driver;
    private features?: Neo4jFeaturesSettings;
    private schemaDefinition: IExecutableSchemaDefinition;

    private _nodes?: Node[];
    private _relationships?: Relationship[];
    private plugins?: Neo4jGraphQLPlugins;
    private schema?: Promise<GraphQLSchema>;

    private dbInfo?: Neo4jDatabaseInfo;

    constructor(input: Neo4jGraphQLConstructor) {
        const { config = {}, driver, plugins, features, ...schemaDefinition } = input;

        this.driver = driver;
        this.config = config;
        this.plugins = plugins;
        this.features = features;
        this.schemaDefinition = schemaDefinition;

        this.checkEnableDebug();
    }

    public get nodes(): Node[] {
        if (!this._nodes) {
            throw new Error("You must await `.getSchema()` before accessing `nodes`");
        }

        return this._nodes;
    }

    public get relationships(): Relationship[] {
        if (!this._relationships) {
            throw new Error("You must await `.getSchema()` before accessing `relationships`");
        }

        return this._relationships;
    }

    public async getSchema(): Promise<GraphQLSchema> {
        if (!this.schema) {
            this.schema = this.generateSchema();
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
        if (!this.schema) {
            throw new Error("You must call `.getSchema()` before `.assertIndexesAndConstraints()`");
        }

        await this.schema;

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

    private wrapResolvers(resolvers: IResolvers, { schema }: { schema: GraphQLSchema }) {
        const wrapResolverArgs = {
            driver: this.driver,
            config: this.config,
            nodes: this.nodes,
            relationships: this.relationships,
            schema,
            plugins: this.plugins,
        };

        const resolversComposition = {
            "Query.*": [wrapResolver(wrapResolverArgs)],
            "Mutation.*": [wrapResolver(wrapResolverArgs)],
            "Subscription.*": [wrapSubscription(wrapResolverArgs)],
        };

        // Merge generated and custom resolvers
        const mergedResolvers = mergeResolvers([resolvers, ...asArray(this.schemaDefinition.resolvers)]);
        return composeResolvers(mergedResolvers, resolversComposition);
    }

    private addWrappedResolversToSchema(resolverlessSchema: GraphQLSchema, resolvers: IResolvers): GraphQLSchema {
        const schema = addResolversToSchema({ schema: resolverlessSchema, resolvers });
        return this.addDefaultFieldResolvers(schema);
    }

    private generateSchema(): Promise<GraphQLSchema> {
        return new Promise((resolve) => {
            const { nodes, relationships, typeDefs, resolvers } = makeAugmentedSchema(this.schemaDefinition.typeDefs, {
                features: this.features,
                enableRegex: this.config?.enableRegex,
                skipValidateTypeDefs: this.config?.skipValidateTypeDefs,
                generateSubscriptions: Boolean(this.plugins?.subscriptions),
                callbacks: this.config.callbacks,
            });

            this._nodes = nodes;
            this._relationships = relationships;

            const resolverlessSchema = makeExecutableSchema({
                ...this.schemaDefinition,
                typeDefs,
            });

            // Wrap the generated resolvers, which adds a context including the schema to every request
            const wrappedResolvers = this.wrapResolvers(resolvers, { schema: resolverlessSchema });

            const schema = this.addWrappedResolversToSchema(resolverlessSchema, wrappedResolvers);

            resolve(schema);
        });
    }

    private async pluginsSetup(): Promise<void> {
        const subscriptionsPlugin = this.plugins?.subscriptions;
        if (subscriptionsPlugin) {
            subscriptionsPlugin.events.setMaxListeners(0); // Removes warning regarding leak. >10 listeners are expected
            if (subscriptionsPlugin.init) {
                await subscriptionsPlugin.init();
            }
        }
    }
}

export default Neo4jGraphQL;
