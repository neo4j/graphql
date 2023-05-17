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

import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import { composeResolvers } from "@graphql-tools/resolvers-composition";
import type { IExecutableSchemaDefinition } from "@graphql-tools/schema";
import { addResolversToSchema, makeExecutableSchema } from "@graphql-tools/schema";
import type { TypeSource } from "@graphql-tools/utils";
import { forEachField, getResolversFromSchema } from "@graphql-tools/utils";
import Debug from "debug";
import type { DocumentNode, GraphQLSchema } from "graphql";
import type { Driver } from "neo4j-driver";
import { DEBUG_ALL } from "../constants";
import { makeAugmentedSchema } from "../schema";
import type { Neo4jGraphQLSchemaModel } from "../schema-model/Neo4jGraphQLSchemaModel";
import { generateModel } from "../schema-model/generate-model";
import { makeSchemaToAugment } from "../schema/make-schema-to-augment";
import { defaultFieldResolver } from "../schema/resolvers/field/defaultField";
import { wrapResolver, wrapSubscription } from "../schema/resolvers/wrapper";
import { validateDocument } from "../schema/validation";
import { validateUserDefinition } from "../schema/validation/schema-validation";
import type {
    CypherQueryOptions,
    DriverConfig,
    Neo4jFeaturesSettings,
    Neo4jGraphQLCallbacks,
    Neo4jGraphQLPlugins,
    StartupValidationConfig,
} from "../types";
import { asArray } from "../utils/utils";
import type { ExecutorConstructorParam } from "./Executor";
import { Executor } from "./Executor";
import type { Neo4jDatabaseInfo } from "./Neo4jDatabaseInfo";
import { getNeo4jDatabaseInfo } from "./Neo4jDatabaseInfo";
import type Node from "./Node";
import type Relationship from "./Relationship";
import type { AssertIndexesAndConstraintsOptions } from "./utils/asserts-indexes-and-constraints";
import assertIndexesAndConstraints from "./utils/asserts-indexes-and-constraints";
import checkNeo4jCompat from "./utils/verify-database";

export interface Neo4jGraphQLConfig {
    driverConfig?: DriverConfig;
    /**
     * @deprecated This argument has been deprecated and will be removed in v4.0.0.
     * Please use features.filters instead. More information can be found at
     * https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#features
     */
    enableRegex?: boolean;
    enableDebug?: boolean;
    /**
     * @deprecated This argument has been deprecated and will be removed in v4.0.0.
     * Please use startupValidation instead. More information can be found at
     * https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#startup-validation
     */
    skipValidateTypeDefs?: boolean;
    startupValidation?: StartupValidationConfig;
    queryOptions?: CypherQueryOptions;
    /**
     * @deprecated This argument has been deprecated and will be removed in v4.0.0.
     * Please use features.populatedBy instead. More information can be found at
     * https://neo4j.com/docs/graphql-manual/current/guides/v4-migration/#_callback_renamed_to_populatedby
     */
    callbacks?: Neo4jGraphQLCallbacks;

    /** Attach metrics to context extension field */
    addMeasurementsToExtension?: boolean;
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

    private schemaModel?: Neo4jGraphQLSchemaModel;

    private executableSchema?: Promise<GraphQLSchema>;
    private subgraphSchema?: Promise<GraphQLSchema>;

    private pluginsInit?: Promise<void>;

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
        return this.getExecutableSchema();
    }

    public async getExecutableSchema(): Promise<GraphQLSchema> {
        if (!this.executableSchema) {
            this.executableSchema = this.generateExecutableSchema();

            await this.pluginsSetup();
        }

        return this.executableSchema;
    }

    public async getSubgraphSchema(): Promise<GraphQLSchema> {
        console.warn(
            "Apollo Federation support is currently experimental. There will be missing functionality, and breaking changes may occur in patch and minor releases. It is not recommended to use it in a production environment."
        );

        if (!this.subgraphSchema) {
            this.subgraphSchema = this.generateSubgraphSchema();

            await this.pluginsSetup();
        }

        return this.subgraphSchema;
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
        if (!(this.executableSchema || this.subgraphSchema)) {
            throw new Error("You must await `.getSchema()` before `.assertIndexesAndConstraints()`");
        }

        await (this.executableSchema || this.subgraphSchema);

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

    public neo4jValidateGraphQLDocument(): void {
        const initialDocument = this.getDocument(this.schemaDefinition.typeDefs);

        //
        // TODO: write tests for this method here!
        //
        validateDocument(initialDocument);

        const { document, typesExcludedFromGeneration } = makeSchemaToAugment(initialDocument);
        const { jwtPayload } = typesExcludedFromGeneration;

        const { typeDefs } = makeAugmentedSchema(document, {
            features: this.features,
            enableRegex: false,
            validateResolvers: true,
            generateSubscriptions: false,
            userCustomResolvers: undefined,
        });

        validateUserDefinition({ userDocument: document, augmentedDocument: typeDefs, jwtPayload });
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

    private getDocument(typeDefs: TypeSource): DocumentNode {
        return mergeTypeDefs(typeDefs);
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

    private wrapResolvers(resolvers: NonNullable<IExecutableSchemaDefinition["resolvers"]>) {
        if (!this.schemaModel) {
            throw new Error("Schema Model is not defined");
        }

        const config = {
            ...this.config,
            callbacks: this.features?.populatedBy?.callbacks ?? this.config.callbacks,
        };

        const wrapResolverArgs = {
            driver: this.driver,
            config,
            nodes: this.nodes,
            relationships: this.relationships,
            schemaModel: this.schemaModel,
            plugins: this.plugins,
            authorization: this.features?.authorization,
        };

        const resolversComposition = {
            "Query.*": [wrapResolver(wrapResolverArgs)],
            "Mutation.*": [wrapResolver(wrapResolverArgs)],
            "Subscription.*": [wrapSubscription(wrapResolverArgs)],
        };

        // Merge generated and custom resolvers
        const mergedResolvers = mergeResolvers([...asArray(resolvers), ...asArray(this.schemaDefinition.resolvers)]);
        return composeResolvers(mergedResolvers, resolversComposition);
    }

    private wrapFederationResolvers(resolvers: NonNullable<IExecutableSchemaDefinition["resolvers"]>) {
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
            authorization: this.features?.authorization,
        };

        const resolversComposition = {
            "Query.{_entities, _service}": [wrapResolver(wrapResolverArgs)],
        };

        // Merge generated and custom resolvers
        const mergedResolvers = mergeResolvers([...asArray(resolvers)]);
        return composeResolvers(mergedResolvers, resolversComposition);
    }

    private generateExecutableSchema(): Promise<GraphQLSchema> {
        return new Promise((resolve) => {
            const initialDocument = this.getDocument(this.schemaDefinition.typeDefs);

            const { validateTypeDefs, validateResolvers } = this.parseStartupValidationConfig();

            if (validateTypeDefs) {
                validateDocument(initialDocument);
            }

            const { document, typesExcludedFromGeneration } = makeSchemaToAugment(initialDocument);
            const { jwtPayload } = typesExcludedFromGeneration;

            const { nodes, relationships, typeDefs, resolvers } = makeAugmentedSchema(document, {
                features: this.features,
                enableRegex: this.config?.enableRegex,
                validateResolvers,
                generateSubscriptions: Boolean(this.plugins?.subscriptions),
                callbacks: this.features?.populatedBy?.callbacks ?? this.config.callbacks,
                userCustomResolvers: this.schemaDefinition.resolvers,
            });

            if (validateTypeDefs) {
                validateUserDefinition({ userDocument: document, augmentedDocument: typeDefs, jwtPayload });
            }

            this._nodes = nodes;
            this._relationships = relationships;

            if (!this.schemaModel) {
                this.schemaModel = generateModel(document);
            }

            // Wrap the generated and custom resolvers, which adds a context including the schema to every request
            const wrappedResolvers = this.wrapResolvers(resolvers);

            const schema = makeExecutableSchema({
                ...this.schemaDefinition,
                typeDefs,
                resolvers: wrappedResolvers,
            });

            resolve(this.addDefaultFieldResolvers(schema));
        });
    }

    private async generateSubgraphSchema(): Promise<GraphQLSchema> {
        const { Subgraph } = await import("./Subgraph");

        const initialDocument = this.getDocument(this.schemaDefinition.typeDefs);
        const subgraph = new Subgraph(this.schemaDefinition.typeDefs);

        const { directives, types } = subgraph.getValidationDefinitions();

        const { validateTypeDefs, validateResolvers } = this.parseStartupValidationConfig();

        if (validateTypeDefs) {
            validateDocument(initialDocument, directives, types);
        }

        const { document, typesExcludedFromGeneration } = makeSchemaToAugment(initialDocument);
        const { jwtPayload } = typesExcludedFromGeneration;

        const { nodes, relationships, typeDefs, resolvers } = makeAugmentedSchema(document, {
            features: this.features,
            enableRegex: this.config?.enableRegex,
            validateResolvers,
            generateSubscriptions: Boolean(this.plugins?.subscriptions),
            callbacks: this.features?.populatedBy?.callbacks ?? this.config.callbacks,
            userCustomResolvers: this.schemaDefinition.resolvers,
            subgraph,
        });

        if (validateTypeDefs) {
            validateUserDefinition({
                userDocument: document,
                augmentedDocument: typeDefs,
                additionalDirectives: directives,
                additionalTypes: types,
                jwtPayload,
            });
        }

        this._nodes = nodes;
        this._relationships = relationships;

        if (!this.schemaModel) {
            this.schemaModel = generateModel(document);
        }

        // TODO: Move into makeAugmentedSchema, add resolvers alongside other resolvers
        const referenceResolvers = subgraph.getReferenceResolvers(this._nodes, this.schemaModel);

        const wrappedResolvers = this.wrapResolvers([resolvers, referenceResolvers]);

        const schema = subgraph.buildSchema({
            typeDefs,
            resolvers: wrappedResolvers as Record<string, any>,
        });

        // Get resolvers from subgraph schema - this will include generated _entities and _service
        const subgraphResolvers = getResolversFromSchema(schema);

        // Wrap the _entities and _service Query resolvers
        const wrappedSubgraphResolvers = this.wrapFederationResolvers(subgraphResolvers);

        // Add the wrapped resolvers back to the schema, context will now be populated
        addResolversToSchema({ schema, resolvers: wrappedSubgraphResolvers, updateResolversInPlace: true });

        return this.addDefaultFieldResolvers(schema);
    }

    private parseStartupValidationConfig(): {
        validateTypeDefs: boolean;
        validateResolvers: boolean;
    } {
        let validateTypeDefs = true;
        let validateResolvers = true;

        if (this.config?.startupValidation === false) {
            return {
                validateTypeDefs: false,
                validateResolvers: false,
            };
        }

        // TODO - remove in 4.0.0 when skipValidateTypeDefs is removed
        if (this.config?.skipValidateTypeDefs === true) validateTypeDefs = false;

        if (typeof this.config?.startupValidation === "object") {
            if (this.config?.startupValidation.typeDefs === false) validateTypeDefs = false;
            if (this.config?.startupValidation.resolvers === false) validateResolvers = false;
        }

        return {
            validateTypeDefs,
            validateResolvers,
        };
    }

    private pluginsSetup(): Promise<void> {
        if (this.pluginsInit) {
            return this.pluginsInit;
        }

        const setup = async () => {
            const subscriptionsPlugin = this.plugins?.subscriptions;
            if (subscriptionsPlugin) {
                subscriptionsPlugin.events.setMaxListeners(0); // Removes warning regarding leak. >10 listeners are expected
                if (subscriptionsPlugin.init) {
                    await subscriptionsPlugin.init();
                }
            }
        };

        this.pluginsInit = setup();

        return this.pluginsInit;
    }
}

export default Neo4jGraphQL;
