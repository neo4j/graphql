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
import type { Neo4jFeaturesSettings, ContextFeatures, Neo4jGraphQLSubscriptionsEngine } from "../types";
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
import { forEachField, getResolversFromSchema } from "@graphql-tools/utils";
import type { DocumentNode, GraphQLSchema } from "graphql";
import type { Driver, SessionConfig } from "neo4j-driver";
import { validateDocument } from "../schema/validation";
import { validateUserDefinition } from "../schema/validation/schema-validation";
import { makeDocumentToAugment } from "../schema/make-document-to-augment";
import { Neo4jGraphQLAuthorization } from "./authorization/Neo4jGraphQLAuthorization";
import { Neo4jGraphQLSubscriptionsDefaultEngine } from "./Neo4jGraphQLSubscriptionsDefaultEngine";

type TypeDefinitions = string | DocumentNode | TypeDefinitions[] | (() => TypeDefinitions);

export interface Neo4jGraphQLConstructor {
    typeDefs: TypeDefinitions;
    resolvers?: IExecutableSchemaDefinition["resolvers"];
    features?: Neo4jFeaturesSettings;
    driver?: Driver;
    debug?: boolean;
    validate?: boolean;
}

class Neo4jGraphQL {
    private typeDefs: TypeDefinitions;
    private resolvers?: IExecutableSchemaDefinition["resolvers"];

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
    private validate: boolean;

    constructor(input: Neo4jGraphQLConstructor) {
        const { driver, features, typeDefs, resolvers, debug, validate = true } = input;

        this.driver = driver;
        this.features = this.parseNeo4jFeatures(features);

        this.typeDefs = typeDefs;
        this.resolvers = resolvers;

        this.debug = debug;
        this.validate = validate;

        this.checkEnableDebug();

        if (this.features?.authorization) {
            const authorizationSettings = this.features?.authorization;

            this.authorization = new Neo4jGraphQLAuthorization(authorizationSettings);
        }
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

    private get nodes(): Node[] {
        if (!this._nodes) {
            throw new Error("You must await `.getSchema()` before accessing `nodes`");
        }

        return this._nodes;
    }

    private get relationships(): Relationship[] {
        if (!this._relationships) {
            throw new Error("You must await `.getSchema()` before accessing `relationships`");
        }

        return this._relationships;
    }

    /**
     * Currently just merges all type definitions into a document. Eventual intention described below:
     *
     * Normalizes the user's type definitions using the method with the lowest risk of side effects:
     * - Type definitions of type `string` are parsed using the `parse` function from the reference GraphQL implementation.
     * - Type definitions of type `DocumentNode` are returned as they are.
     * - Type definitions in arrays are merged using `mergeTypeDefs` from `@graphql-tools/merge`.
     * - Callbacks are resolved to a type which can be parsed into a document.
     *
     * This method maps to the Type Definition Normalization stage of the Schema Generation lifecycle.
     *
     * @param {TypeDefinitions} typeDefinitions - The unnormalized type definitions.
     * @returns {DocumentNode} The normalized type definitons as a document.
     */
    private normalizeTypeDefinitions(typeDefinitions: TypeDefinitions): DocumentNode {
        // TODO: The dream: minimal modification of the type definitions. However, this does not merge extensions, which we can't currently deal with in translation.
        // if (typeof typeDefinitions === "function") {
        //     return this.normalizeTypeDefinitions(typeDefinitions());
        // }

        // if (typeof typeDefinitions === "string") {
        //     return parse(typeDefinitions);
        // }

        // if (Array.isArray(typeDefinitions)) {
        //     return mergeTypeDefs(typeDefinitions);
        // }

        // return typeDefinitions;

        return mergeTypeDefs(typeDefinitions);
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

        const wrapResolverArgs: WrapResolverArguments = {
            driver: this.driver,
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
        let subscriptionPlugin: Neo4jGraphQLSubscriptionsEngine | undefined;
        if (features?.subscriptions === true) {
            subscriptionPlugin = new Neo4jGraphQLSubscriptionsDefaultEngine();
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
            const initialDocument = this.normalizeTypeDefinitions(this.typeDefs);

            if (this.validate) {
                validateDocument({ document: initialDocument, features: this.features });
            }

            const { document, typesExcludedFromGeneration } = makeDocumentToAugment(initialDocument);
            const { jwt } = typesExcludedFromGeneration;
            if (jwt) {
                this.jwtFieldsMap = jwt.jwtFieldsMap;
            }

            this.generateSchemaModel(document);

            const { nodes, relationships, typeDefs, resolvers } = makeAugmentedSchema(document, {
                features: this.features,
                generateSubscriptions: Boolean(this.features?.subscriptions),
                userCustomResolvers: this.resolvers,
            });

            if (this.validate) {
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

        const initialDocument = this.normalizeTypeDefinitions(this.typeDefs);
        const subgraph = new Subgraph(this.typeDefs);

        const { directives, types } = subgraph.getValidationDefinitions();

        if (this.validate) {
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

        const schemaModel = this.generateSchemaModel(document);

        const { nodes, relationships, typeDefs, resolvers } = makeAugmentedSchema(document, {
            features: this.features,
            generateSubscriptions: Boolean(this.features?.subscriptions),
            userCustomResolvers: this.resolvers,
            subgraph,
        });

        if (this.validate) {
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
