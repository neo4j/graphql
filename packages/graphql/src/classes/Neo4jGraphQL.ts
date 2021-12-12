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

import Debug from "debug";
import { Driver } from "neo4j-driver";
import { DocumentNode, GraphQLResolveInfo, GraphQLSchema, parse, printSchema, print } from "graphql";
import { PubSub, PubSubEngine } from "graphql-subscriptions";
import { addResolversToSchema, addSchemaLevelResolver, IExecutableSchemaDefinition } from "@graphql-tools/schema";
import { SchemaDirectiveVisitor } from "@graphql-tools/utils";
import type { DriverConfig, CypherQueryOptions, Context } from "../types";
import { makeAugmentedSchema } from "../schema";
import Node from "./Node";
import Relationship from "./Relationship";
import checkNeo4jCompat from "./utils/verify-database";
import { getJWT } from "../auth";
import { DEBUG_GRAPHQL } from "../constants";
import getNeo4jResolveTree from "../utils/get-neo4j-resolve-tree";
import createAuthParam from "../translate/create-auth-param";
import assertIndexesAndConstraints, {
    AssertIndexesAndConstraintsOptions,
} from "./utils/asserts-indexes-and-constraints";

const debug = Debug(DEBUG_GRAPHQL);

export interface Neo4jGraphQLJWT {
    jwksEndpoint?: string;
    secret?: string;
    noVerify?: boolean;
    rolesPath?: string;
}

export interface Neo4jGraphQLConfig {
    driverConfig?: DriverConfig;
    jwt?: Neo4jGraphQLJWT;
    enableRegex?: boolean;
    skipValidateTypeDefs?: boolean;
    addInternalIdsToSchema?: boolean;
    queryOptions?: CypherQueryOptions;
}

export interface Neo4jGraphQLConstructor extends Omit<IExecutableSchemaDefinition, "schemaDirectives"> {
    config?: Neo4jGraphQLConfig;
    driver?: Driver;

    /**
     * A PubSub instance as defined in graphql-subscriptions.
     * If this is not provided, the @neo4j/graphql will default to a local
     * PubSub provider. If you plan on running more than one instance of your application
     * in parallel it is suggested that you connect a subscriptions manager such as Redis.
     * 
     * More information on graphql-subscriptions:  
     * https://github.com/apollographql/graphql-subscriptions
     * 
     * List of pubsub implementations:  
     * https://github.com/apollographql/graphql-subscriptions#pubsub-implementations
     */
    pubsub?: PubSubEngine;
    schemaDirectives?: Record<string, typeof SchemaDirectiveVisitor>;
}

class Neo4jGraphQL {
    public schema: GraphQLSchema;
    public nodes: Node[];
    public relationships: Relationship[];
    public document: DocumentNode;
    private driver?: Driver;

    public pubsub: PubSubEngine;

    public config?: Neo4jGraphQLConfig;

    constructor(input: Neo4jGraphQLConstructor) {
        const { config = {}, driver, pubsub, resolvers, schemaDirectives, ...schemaDefinition } = input;
        const { nodes, relationships, schema } = makeAugmentedSchema(schemaDefinition, {
            enableRegex: config.enableRegex,
            skipValidateTypeDefs: config.skipValidateTypeDefs,
            addInternalIdsToSchema: config.addInternalIdsToSchema,
        });

        this.driver = driver;
        this.pubsub = pubsub ||  new PubSub();
        this.config = config;
        this.nodes = nodes;
        this.relationships = relationships;
        this.schema = schema;

        /*
            Order must be:

                addResolversToSchema -> visitSchemaDirectives -> createWrappedSchema

            addResolversToSchema breaks schema directives added before it

            createWrappedSchema must come last so that all requests have context prepared correctly
        */
        if (resolvers) {
            if (Array.isArray(resolvers)) {
                resolvers.forEach((r) => {
                    this.schema = addResolversToSchema(this.schema, r);
                });
            } else {
                this.schema = addResolversToSchema(this.schema, resolvers);
            }
        }

        if (schemaDirectives) {
            SchemaDirectiveVisitor.visitSchemaDirectives(this.schema, schemaDirectives);
        }

        this.schema = this.createWrappedSchema({ schema: this.schema });
        this.document = parse(printSchema(schema));
    }

    async onSubscriptionConnect(context: Context) {
        this.populateContext(context);
        await context.neoSchema.authenticateContext(context);
        context.subCache = context.subCache || {};
        return context;
    }

    // Mutates context with variables from this Neo4jGraphql instance
    public populateContext(context: Partial<Context>) {
        if (!context?.driver) {
            if (!this.driver) {
                throw new Error(
                    "A Neo4j driver instance must either be passed to Neo4jGraphQL on construction, or passed as context.driver in each request."
                );
            }
            context.driver = this.driver;
        }
    
        if (!context.queryOptions) {
            context.queryOptions = this.config?.queryOptions;
        }

        if (!context?.driverConfig) {
            context.driverConfig = this.config?.driverConfig;
        }

        if (!context?.pubsub) {
            context.pubsub = this.pubsub;
        }

        context.neoSchema = this;

        return context as Context;
    }

    // Mutates context to add authentication information (.jwt and .auth)
    public async authenticateContext(context: Context) {

        if (!context.jwt) {
            context.jwt = await getJWT(context);
        }

        // temporary cast to as any, remove when type is fixed
        context.auth = createAuthParam({ context }) as any;
    }

    private createWrappedSchema({
        schema,
    }: {
        schema: GraphQLSchema;
    }): GraphQLSchema {
        return addSchemaLevelResolver(schema, async (obj, _args, context: any, resolveInfo: GraphQLResolveInfo) => {

            if (debug.enabled) {
                const query = print(resolveInfo.operation);

                debug(
                    "%s",
                    `Incoming GraphQL:\nQuery:\n${query}\nVariables:\n${JSON.stringify(
                        resolveInfo.variableValues,
                        null,
                        2
                    )}`
                );
            }

            this.populateContext(context);

            /*
                Deleting this property ensures that we call this function more than once,
                See https://github.com/ardatan/graphql-tools/issues/353#issuecomment-499569711
            */
            // @ts-ignore: Deleting private property from object
            delete resolveInfo.operation.__runAtMostOnce; // eslint-disable-line no-param-reassign,no-underscore-dangle

            context.resolveTree = getNeo4jResolveTree(resolveInfo);
            await this.authenticateContext(context);

            return obj;
        });
    }

    async checkNeo4jCompat(input: { driver?: Driver; driverConfig?: DriverConfig } = {}): Promise<void> {
        const driver = input.driver || this.driver;
        const driverConfig = input.driverConfig || this.config?.driverConfig;

        if (!driver) {
            throw new Error("neo4j-driver Driver missing");
        }

        return checkNeo4jCompat({ driver, driverConfig });
    }

    async assertIndexesAndConstraints(
        input: { driver?: Driver; driverConfig?: DriverConfig; options?: AssertIndexesAndConstraintsOptions } = {}
    ): Promise<void> {
        const driver = input.driver || this.driver;
        const driverConfig = input.driverConfig || this.config?.driverConfig;

        if (!driver) {
            throw new Error("neo4j-driver Driver missing");
        }

        await assertIndexesAndConstraints({ driver, driverConfig, nodes: this.nodes, options: input.options });
    }
}

export default Neo4jGraphQL;
