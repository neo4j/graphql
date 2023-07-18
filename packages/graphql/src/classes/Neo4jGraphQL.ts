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
import Debug from "debug";
import type {
    DriverConfig,
    CypherQueryOptions,
    Neo4jGraphQLPlugins,
    Neo4jGraphQLCallbacks,
    Neo4jFeaturesSettings,
    StartupValidationConfig,
} from "../types";
import { makeAugmentedSchema } from "../schema";
import type Node from "./Node";
import type Relationship from "./Relationship";
import checkNeo4jCompat from "./utils/verify-database";
import type { AssertIndexesAndConstraintsOptions } from "./utils/asserts-indexes-and-constraints";
import assertIndexesAndConstraints from "./utils/asserts-indexes-and-constraints";
import { wrapResolver, wrapSubscription } from "../schema/resolvers/wrapper";
import type { WrapResolverArguments } from "../schema/resolvers/wrapper";
import { defaultFieldResolver } from "../schema/resolvers/field/defaultField";
import { asArray } from "../utils/utils";
import { DEBUG_ALL } from "../constants";
import type { Neo4jDatabaseInfo } from "./Neo4jDatabaseInfo";
import { getNeo4jDatabaseInfo } from "./Neo4jDatabaseInfo";
import type { ExecutorConstructorParam, Neo4jGraphQLSessionConfig } from "./Executor";
import { Executor } from "./Executor";
import { generateModel } from "../schema-model/generate-model";
import type { Neo4jGraphQLSchemaModel } from "../schema-model/Neo4jGraphQLSchemaModel";
import { composeResolvers } from "@graphql-tools/resolvers-composition";
import type { IExecutableSchemaDefinition } from "@graphql-tools/schema";
import { addResolversToSchema, makeExecutableSchema } from "@graphql-tools/schema";
import type { TypeSource } from "@graphql-tools/utils";
import { forEachField, getResolversFromSchema } from "@graphql-tools/utils";
import type { DocumentNode, GraphQLSchema } from "graphql";
import type { Driver, SessionConfig } from "neo4j-driver";
import { validateDocument } from "../schema/validation";
import { validateUserDefinition } from "../schema/validation/schema-validation";
import { makeDocumentToAugment } from "../schema/make-document-to-augment";
import { Neo4jGraphQLAuthorization } from "./authorization/Neo4jGraphQLAuthorization";

export interface Neo4jGraphQLConfig {
    /**
     * @deprecated This argument has been deprecated and will be removed in v4.0.0.
     * Use the `sessionConfig` context property instead.
     */
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

    private jwtFieldsMap?: Map<string, string>;

    private schemaModel?: Neo4jGraphQLSchemaModel;

    private executableSchema?: Promise<GraphQLSchema>;
    private subgraphSchema?: Promise<GraphQLSchema>;

    private pluginsInit?: Promise<void>;

    private dbInfo?: Neo4jDatabaseInfo;

    private authorization?: Neo4jGraphQLAuthorization;

    constructor(input: Neo4jGraphQLConstructor) {
        const { config = {}, driver, plugins, features, ...schemaDefinition } = input;

        this.driver = driver;
        this.config = config;
        this.plugins = plugins;
        this.features = features;
        this.schemaDefinition = schemaDefinition;

        this.checkEnableDebug();

        if (this.features?.authorization) {
            const authorizationSettings = this.features?.authorization;

            this.authorization = new Neo4jGraphQLAuthorization(authorizationSettings);
        }
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

    public async checkNeo4jCompat({
        driver,
        driverConfig,
        sessionConfig,
    }: {
        driver?: Driver;
        driverConfig?: DriverConfig;
        sessionConfig?: Neo4jGraphQLSessionConfig;
    } = {}): Promise<void> {
        const neo4jDriver = driver || this.driver;

        if (!neo4jDriver) {
            throw new Error("neo4j-driver Driver missing");
        }

        if (!this.dbInfo) {
            this.dbInfo = await this.getNeo4jDatabaseInfo(
                neo4jDriver,
                sessionConfig || driverConfig || this.config?.driverConfig
            );
        }

        return checkNeo4jCompat({
            driver: neo4jDriver,
            sessionConfig: sessionConfig || driverConfig || this.config?.driverConfig,
            dbInfo: this.dbInfo,
        });
    }

    public async assertIndexesAndConstraints({
        driver,
        driverConfig,
        sessionConfig,
        options,
    }: {
        driver?: Driver;
        /**
         * @deprecated
         */
        driverConfig?: DriverConfig;
        sessionConfig?: Neo4jGraphQLSessionConfig;
        options?: AssertIndexesAndConstraintsOptions;
    } = {}): Promise<void> {
        if (!(this.executableSchema || this.subgraphSchema)) {
            throw new Error("You must await `.getSchema()` before `.assertIndexesAndConstraints()`");
        }

        await (this.executableSchema || this.subgraphSchema);

        const neo4jDriver = driver || this.driver;

        if (!neo4jDriver) {
            throw new Error("neo4j-driver Driver missing");
        }

        if (!this.dbInfo) {
            this.dbInfo = await this.getNeo4jDatabaseInfo(
                neo4jDriver,
                sessionConfig || driverConfig || this.config?.driverConfig
            );
        }

        await assertIndexesAndConstraints({
            driver: neo4jDriver,
            sessionConfig: sessionConfig || driverConfig || this.config?.driverConfig,
            nodes: this.nodes,
            options: options,
            dbInfo: this.dbInfo,
        });
    }

    public neo4jValidateGraphQLDocument(): { isValid: boolean; validationErrors: string[] } {
        try {
            const initialDocument = this.getDocument(this.schemaDefinition.typeDefs);

            validateDocument({ document: initialDocument, features: this.features });

            const { document, typesExcludedFromGeneration } = makeDocumentToAugment(initialDocument);
            const { jwt } = typesExcludedFromGeneration;

            const { typeDefs } = makeAugmentedSchema(document, {
                features: this.features,
                enableRegex: false,
                validateResolvers: true,
                generateSubscriptions: true,
                userCustomResolvers: undefined,
            });

            validateUserDefinition({
                userDocument: document,
                augmentedDocument: typeDefs,
                jwt: jwt?.type,
            });
        } catch (error) {
            // TODO: include path here
            if (error instanceof Error) {
                const validationErrors = error.message.split("\n\n");
                return { isValid: false, validationErrors };
            }
            return { isValid: false, validationErrors: [] };
        }
        return { isValid: true, validationErrors: [] };
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

    private async getNeo4jDatabaseInfo(driver: Driver, sessionConfig?: SessionConfig): Promise<Neo4jDatabaseInfo> {
        const executorConstructorParam: ExecutorConstructorParam = {
            executionContext: driver,
            sessionConfig,
        };

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

        const wrapResolverArgs: WrapResolverArguments = {
            driver: this.driver,
            config,
            nodes: this.nodes,
            relationships: this.relationships,
            schemaModel: this.schemaModel,
            plugins: this.plugins,
            authorization: this.authorization,
            jwtPayloadFieldsMap: this.jwtFieldsMap,
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

    private composeSchema(schema: GraphQLSchema): GraphQLSchema {
        // TODO: Keeping this in our back pocket - if we want to add native support for middleware to the library
        // if (this.middlewares) {
        //     schema = applyMiddleware(schema, ...this.middlewares);
        // }

        // Get resolvers from schema - this will include generated _entities and _service for Federation
        const resolvers = getResolversFromSchema(schema);

        // Wrap the resolvers using resolvers composition
        const wrappedResolvers = this.wrapResolvers(resolvers);

        // Add the wrapped resolvers back to the schema, context will now be populated
        addResolversToSchema({ schema, resolvers: wrappedResolvers, updateResolversInPlace: true });

        return this.addDefaultFieldResolvers(schema);
    }

    private generateExecutableSchema(): Promise<GraphQLSchema> {
        return new Promise((resolve) => {
            const initialDocument = this.getDocument(this.schemaDefinition.typeDefs);

            const { validateTypeDefs, validateResolvers } = this.parseStartupValidationConfig();

            if (validateTypeDefs) {
                validateDocument({ document: initialDocument, features: this.features });
            }

            const { document, typesExcludedFromGeneration } = makeDocumentToAugment(initialDocument);
            const { jwt } = typesExcludedFromGeneration;
            if (jwt) {
                this.jwtFieldsMap = jwt.jwtFieldsMap;
            }

            if (!this.schemaModel) {
                this.schemaModel = generateModel(document);
            }

            const { nodes, relationships, typeDefs, resolvers } = makeAugmentedSchema(document, {
                features: this.features,
                enableRegex: this.config?.enableRegex,
                validateResolvers,
                generateSubscriptions: Boolean(this.plugins?.subscriptions),
                callbacks: this.features?.populatedBy?.callbacks ?? this.config.callbacks,
                userCustomResolvers: this.schemaDefinition.resolvers,
            });

            if (validateTypeDefs) {
                validateUserDefinition({
                    userDocument: document,
                    augmentedDocument: typeDefs,
                    jwt: jwt?.type,
                });
            }

            this._nodes = nodes;
            this._relationships = relationships;

            const schema = makeExecutableSchema({
                ...this.schemaDefinition,
                typeDefs,
                resolvers,
            });

            resolve(this.composeSchema(schema));
        });
    }

    private async generateSubgraphSchema(): Promise<GraphQLSchema> {
        // Import only when needed to avoid issues if GraphQL 15 being used
        const { Subgraph } = await import("./Subgraph");

        const initialDocument = this.getDocument(this.schemaDefinition.typeDefs);
        const subgraph = new Subgraph(this.schemaDefinition.typeDefs);

        const { directives, types } = subgraph.getValidationDefinitions();

        const { validateTypeDefs, validateResolvers } = this.parseStartupValidationConfig();

        if (validateTypeDefs) {
            validateDocument({
                document: initialDocument,
                features: this.features,
                additionalDirectives: directives,
                additionalTypes: types,
            });
        }

        const { document, typesExcludedFromGeneration } = makeDocumentToAugment(initialDocument);
        const { jwt } = typesExcludedFromGeneration;
        if (jwt) {
            this.jwtFieldsMap = jwt.jwtFieldsMap;
        }

        if (!this.schemaModel) {
            this.schemaModel = generateModel(document);
        }

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
                jwt: jwt?.type,
            });
        }

        this._nodes = nodes;
        this._relationships = relationships;

        // TODO: Move into makeAugmentedSchema, add resolvers alongside other resolvers
        const referenceResolvers = subgraph.getReferenceResolvers(this._nodes, this.schemaModel);

        const schema = subgraph.buildSchema({
            typeDefs,
            resolvers: mergeResolvers([resolvers, referenceResolvers]),
        });

        return this.composeSchema(schema);
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
