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
    Neo4jFeaturesSettings,
    StartupValidationConfig,
    ContextFeatures,
    Neo4jGraphQLSubscriptionsMechanism,
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
import { Neo4jGraphQLSubscriptionsDefaultMechanism } from "./Neo4jGraphQLSubscriptionsDefaultMechanism";

export interface Neo4jGraphQLConfig {
    startupValidation?: StartupValidationConfig;
}

export type ValidationConfig = {
    validateTypeDefs: boolean;
    validateResolvers: boolean;
    validateDuplicateRelationshipFields: boolean;
};

export interface Neo4jGraphQLConstructor {
    typeDefs: TypeSource;
    resolvers?: IExecutableSchemaDefinition["resolvers"];
    features?: Neo4jFeaturesSettings;
    config?: Neo4jGraphQLConfig;
    driver?: Driver;
    debug?: boolean;
}

export const defaultValidationConfig: ValidationConfig = {
    validateTypeDefs: true,
    validateResolvers: true,
    validateDuplicateRelationshipFields: true,
};

class Neo4jGraphQL {
    private typeDefs: TypeSource;
    private resolvers?: IExecutableSchemaDefinition["resolvers"];

    private config: Neo4jGraphQLConfig;
    private driver?: Driver;
    private features: ContextFeatures;

    private _nodes?: Node[];
    private _relationships?: Relationship[];

    private jwtFieldsMap?: Map<string, string>;

    private schemaModel?: Neo4jGraphQLSchemaModel;

    private executableSchema?: Promise<GraphQLSchema>;
    private subgraphSchema?: Promise<GraphQLSchema>;

    // This promise ensures that subscription init only happens once
    private subscriptionInit?: Promise<void>;

    private dbInfo?: Neo4jDatabaseInfo;

    private authorization?: Neo4jGraphQLAuthorization;

    private debug?: boolean;

    constructor(input: Neo4jGraphQLConstructor) {
        const { config = {}, driver, features, typeDefs, resolvers, debug } = input;

        this.driver = driver;
        this.config = config;
        this.features = this.parseNeo4jFeatures(features);

        this.typeDefs = typeDefs;
        this.resolvers = resolvers;

        this.debug = debug;

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

            await this.subscriptionMechanismSetup();
        }

        return this.executableSchema;
    }

    public async getSubgraphSchema(): Promise<GraphQLSchema> {
        console.warn(
            "Apollo Federation support is currently experimental. There will be missing functionality, and breaking changes may occur in patch and minor releases. It is not recommended to use it in a production environment."
        );

        if (!this.subgraphSchema) {
            this.subgraphSchema = this.generateSubgraphSchema();

            await this.subscriptionMechanismSetup();
        }

        return this.subgraphSchema;
    }

    public async checkNeo4jCompat({
        driver,
        sessionConfig,
    }: {
        driver?: Driver;
        sessionConfig?: Neo4jGraphQLSessionConfig;
    } = {}): Promise<void> {
        const neo4jDriver = driver || this.driver;

        if (!neo4jDriver) {
            throw new Error("neo4j-driver Driver missing");
        }

        if (!this.dbInfo) {
            this.dbInfo = await this.getNeo4jDatabaseInfo(neo4jDriver, sessionConfig);
        }

        return checkNeo4jCompat({
            driver: neo4jDriver,
            sessionConfig,
            dbInfo: this.dbInfo,
        });
    }

    public async assertIndexesAndConstraints({
        driver,
        sessionConfig,
        options,
    }: {
        driver?: Driver;
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
            this.dbInfo = await this.getNeo4jDatabaseInfo(neo4jDriver, sessionConfig);
        }

        await assertIndexesAndConstraints({
            driver: neo4jDriver,
            sessionConfig,
            nodes: this.nodes,
            options: options,
        });
    }

    public neo4jValidateGraphQLDocument(): { isValid: boolean; validationErrors: string[] } {
        try {
            const initialDocument = this.getDocument(this.typeDefs);

            validateDocument({ document: initialDocument, features: this.features });

            const { document, typesExcludedFromGeneration } = makeDocumentToAugment(initialDocument);
            const { jwt } = typesExcludedFromGeneration;

            const { typeDefs } = makeAugmentedSchema(document, {
                features: this.features,
                // enableRegex: false,
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
        if (this.debug === true || this.debug === false) {
            if (this.debug) {
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
            callbacks: this.features?.populatedBy?.callbacks,
        };

        const wrapResolverArgs: WrapResolverArguments = {
            driver: this.driver,
            config,
            nodes: this.nodes,
            relationships: this.relationships,
            schemaModel: this.schemaModel,
            features: this.features,
            authorization: this.authorization,
            jwtPayloadFieldsMap: this.jwtFieldsMap,
        };

        const resolversComposition = {
            "Query.*": [wrapResolver(wrapResolverArgs)],
            "Mutation.*": [wrapResolver(wrapResolverArgs)],
            "Subscription.*": [wrapSubscription(wrapResolverArgs)],
        };

        // Merge generated and custom resolvers
        const mergedResolvers = mergeResolvers([...asArray(resolvers), ...asArray(this.resolvers)]);
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

    private parseNeo4jFeatures(features: Neo4jFeaturesSettings | undefined): ContextFeatures {
        let subscriptionPlugin: Neo4jGraphQLSubscriptionsMechanism | undefined;
        if (features?.subscriptions === true) {
            subscriptionPlugin = new Neo4jGraphQLSubscriptionsDefaultMechanism();
        } else {
            subscriptionPlugin = features?.subscriptions || undefined;
        }

        return {
            ...features,
            subscriptions: subscriptionPlugin,
        };
    }

    private generateSchemaModel(document: DocumentNode): Neo4jGraphQLSchemaModel {
        // This can be run several times but it will always be the same result,
        // so we memoize the schemaModel.
        if (!this.schemaModel) {
            this.schemaModel = generateModel(document);
        }
        return this.schemaModel;
    }

    private generateExecutableSchema(): Promise<GraphQLSchema> {
        return new Promise((resolve) => {
            const initialDocument = this.getDocument(this.typeDefs);

            const validationConfig = this.parseStartupValidationConfig();

            if (validationConfig.validateTypeDefs) {
                validateDocument({ document: initialDocument, validationConfig, features: this.features });
            }

            const { document, typesExcludedFromGeneration } = makeDocumentToAugment(initialDocument);
            const { jwt } = typesExcludedFromGeneration;
            if (jwt) {
                this.jwtFieldsMap = jwt.jwtFieldsMap;
            }

            this.generateSchemaModel(document);

            const { nodes, relationships, typeDefs, resolvers } = makeAugmentedSchema(document, {
                features: this.features,
                validateResolvers: validationConfig.validateResolvers,
                generateSubscriptions: Boolean(this.features?.subscriptions),
                userCustomResolvers: this.resolvers,
            });

            if (validationConfig.validateTypeDefs) {
                validateUserDefinition({ userDocument: document, augmentedDocument: typeDefs, jwt: jwt?.type });
            }

            this._nodes = nodes;
            this._relationships = relationships;

            const schema = makeExecutableSchema({
                typeDefs,
                resolvers,
            });

            resolve(this.composeSchema(schema));
        });
    }

    private async generateSubgraphSchema(): Promise<GraphQLSchema> {
        // Import only when needed to avoid issues if GraphQL 15 being used
        const { Subgraph } = await import("./Subgraph");

        const initialDocument = this.getDocument(this.typeDefs);
        const subgraph = new Subgraph(this.typeDefs);

        const { directives, types } = subgraph.getValidationDefinitions();

        const validationConfig = this.parseStartupValidationConfig();

        if (validationConfig.validateTypeDefs) {
            validateDocument({
                document: initialDocument,
                validationConfig,
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

        const schemaModel = this.generateSchemaModel(document);

        const { nodes, relationships, typeDefs, resolvers } = makeAugmentedSchema(document, {
            features: this.features,
            validateResolvers: validationConfig.validateResolvers,
            generateSubscriptions: Boolean(this.features?.subscriptions),
            userCustomResolvers: this.resolvers,
            subgraph,
        });

        if (validationConfig.validateTypeDefs) {
            // validateUserDefinition(document, typeDefs, directives, types);
            // if (validateTypeDefs) {
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
        const referenceResolvers = subgraph.getReferenceResolvers(this._nodes, schemaModel);

        const schema = subgraph.buildSchema({
            typeDefs,
            resolvers: mergeResolvers([resolvers, referenceResolvers]),
        });

        return this.composeSchema(schema);
    }

    private parseStartupValidationConfig(): ValidationConfig {
        const validationConfig: ValidationConfig = { ...defaultValidationConfig };

        if (this.config?.startupValidation === false) {
            return {
                validateTypeDefs: false,
                validateResolvers: false,
                validateDuplicateRelationshipFields: false,
            };
        }

        if (typeof this.config?.startupValidation === "object") {
            if (this.config?.startupValidation.typeDefs === false) validationConfig.validateTypeDefs = false;
            if (this.config?.startupValidation.resolvers === false) validationConfig.validateResolvers = false;
            if (this.config?.startupValidation.noDuplicateRelationshipFields === false)
                validationConfig.validateDuplicateRelationshipFields = false;
        }

        return validationConfig;
    }

    private subscriptionMechanismSetup(): Promise<void> {
        if (this.subscriptionInit) {
            return this.subscriptionInit;
        }

        const setup = async () => {
            const subscriptionsMechanism = this.features?.subscriptions;
            if (subscriptionsMechanism) {
                subscriptionsMechanism.events.setMaxListeners(0); // Removes warning regarding leak. >10 listeners are expected
                if (subscriptionsMechanism.init) {
                    await subscriptionsMechanism.init();
                }
            }
        };

        this.subscriptionInit = setup();

        return this.subscriptionInit;
    }
}

export default Neo4jGraphQL;
