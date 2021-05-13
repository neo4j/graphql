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
import { addSchemaLevelResolver, IExecutableSchemaDefinition } from "@graphql-tools/schema";
import { parseResolveInfo, ResolveTree } from "graphql-parse-resolve-info";
import type { DriverConfig } from "../types";
import { makeAugmentedSchema } from "../schema";
import Node from "./Node";
import Relationship from "./Relationship";
import { checkNeo4jCompat } from "../utils";
import { getJWT } from "../auth/index";
import { DEBUG_GRAPHQL } from "../constants";

const debug = Debug(DEBUG_GRAPHQL);

export interface Neo4jGraphQLJWT {
    secret: string;
    noVerify?: string;
    rolesPath?: string;
}

export interface Neo4jGraphQLConfig {
    driverConfig?: DriverConfig;
    jwt?: Neo4jGraphQLJWT;
    enableRegex?: boolean;
}

export interface Neo4jGraphQLConstructor extends IExecutableSchemaDefinition {
    config?: Neo4jGraphQLConfig;
    driver?: Driver;
}

class Neo4jGraphQL {
    public schema: GraphQLSchema;

    public nodes: Node[];

    public relationships: Relationship[];

    public document: DocumentNode;

    private driver?: Driver;

    public config?: Neo4jGraphQLConfig;

    constructor(input: Neo4jGraphQLConstructor) {
        const { config = {}, driver, ...schemaDefinition } = input;
        const { nodes, relationships, schema } = makeAugmentedSchema(schemaDefinition, {
            enableRegex: config.enableRegex,
        });

        this.driver = driver;
        this.config = config;
        this.nodes = nodes;
        this.relationships = relationships;
        this.schema = this.createWrappedSchema({ schema, config });
        this.document = parse(printSchema(schema));
    }

    private createWrappedSchema({
        schema,
        config,
    }: {
        schema: GraphQLSchema;
        config: Neo4jGraphQLConfig;
    }): GraphQLSchema {
        return addSchemaLevelResolver(schema, (_obj, _args, context: any, resolveInfo: GraphQLResolveInfo) => {
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
            context.resolveTree = parseResolveInfo(resolveInfo) as ResolveTree;
            context.jwt = getJWT(context);
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
}

export default Neo4jGraphQL;
