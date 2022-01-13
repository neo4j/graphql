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
import { addResolversToSchema, addSchemaLevelResolver, IExecutableSchemaDefinition } from "@graphql-tools/schema";
import { SchemaDirectiveVisitor } from "@graphql-tools/utils";
import type { DriverConfig, CypherQueryOptions, Context } from "../types";
import { makeAugmentedSchema } from "../schema";
import Node from "./Node";
import Relationship from "./Relationship";
import checkNeo4jCompat from "./utils/verify-database";
import { getJWT } from "../auth";
import { DEBUG_GRAPHQL } from "../constants";
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
    queryOptions?: CypherQueryOptions;
}

export interface Neo4jGraphQLConstructor extends Omit<IExecutableSchemaDefinition, "schemaDirectives"> {
    config?: Neo4jGraphQLConfig;
    driver?: Driver;
    schemaDirectives?: Record<string, typeof SchemaDirectiveVisitor>;
}

class Neo4jGraphQL {
    public schema: GraphQLSchema;
    public nodes: Node[];
    public relationships: Relationship[];
    public document: DocumentNode;
    private driver?: Driver;
    public config?: Neo4jGraphQLConfig;

    constructor(input: Neo4jGraphQLConstructor) {
        const { config = {}, driver, resolvers, schemaDirectives, ...schemaDefinition } = input;
        const { nodes, relationships, schema } = makeAugmentedSchema(schemaDefinition, {
            enableRegex: config.enableRegex,
            skipValidateTypeDefs: config.skipValidateTypeDefs,
        });

        this.driver = driver;
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

        this.schema = this.createWrappedSchema({ schema: this.schema, config });
        this.document = parse(printSchema(schema));
    }

    private createWrappedSchema({
        schema,
        config,
    }: {
        schema: GraphQLSchema;
        config: Neo4jGraphQLConfig;
    }): GraphQLSchema {
        return addSchemaLevelResolver(schema, async (obj: any, _args, context: Context, resolveInfo: GraphQLResolveInfo) => {
            const { driverConfig } = config;

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

            /*
                Deleting this property ensures that we call this function more than once,
                See https://github.com/ardatan/graphql-tools/issues/353#issuecomment-499569711
            */
            // @ts-ignore: Deleting private property from object
            delete resolveInfo.operation.__runAtMostOnce; // eslint-disable-line no-param-reassign,no-underscore-dangle

            if (!context?.driver) {
                if (!this.driver) {
                    throw new Error(
                        "A Neo4j driver instance must either be passed to Neo4jGraphQL on construction, or passed as context.driver in each request."
                    );
                }
                context.driver = this.driver;
            }

            if (!context?.driverConfig) {
                context.driverConfig = driverConfig;
            }

            context.neoSchema = this;
            if (!context.jwt) {
                context.jwt = await getJWT(context);
            }

            context.auth = createAuthParam({ context });

            context.queryOptions = config.queryOptions;
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
