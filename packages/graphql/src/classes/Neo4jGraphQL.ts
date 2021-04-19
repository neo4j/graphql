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

import { Driver } from "neo4j-driver";
import { DocumentNode, GraphQLSchema, parse, printSchema } from "graphql";
import { addSchemaLevelResolver, IExecutableSchemaDefinition } from "@graphql-tools/schema";
import { parseResolveInfo, ResolveTree } from "graphql-parse-resolve-info";
import type { DriverConfig } from "../types";
import { makeAugmentedSchema } from "../schema";
import Node from "./Node";
import { checkNeo4jCompat } from "../utils";
import { getJWT } from "../auth/index";

export type SchemaDirectives = IExecutableSchemaDefinition["schemaDirectives"];

export interface Neo4jGraphQLConfig {
    debug?: boolean | ((message: string) => void);
    driver?: Driver;
    driverConfig?: DriverConfig;
}

export interface Neo4jGraphQLConstructor extends IExecutableSchemaDefinition {
    config?: Neo4jGraphQLConfig;
}

class Neo4jGraphQL {
    public schema: GraphQLSchema;

    public nodes: Node[];

    public document: DocumentNode;

    private driver?: Driver;

    private driverConfig?: DriverConfig;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
    debug(message: string): void {
        return undefined;
    }

    constructor(input: Neo4jGraphQLConstructor) {
        const { config = {}, ...rest } = input;
        this.driver = config.driver;
        this.driverConfig = config.driverConfig;
        const { nodes, schema } = makeAugmentedSchema(rest);

        if (input.config?.debug) {
            // eslint-disable-next-line no-console
            let logger = console.log;

            if (typeof input.config.debug === "function") {
                logger = input.config.debug;
            }

            this.debug = (message: string) => logger(message);
        }

        this.nodes = nodes;
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
        return addSchemaLevelResolver(schema, (_obj, _args, context: any, resolveInfo: any) => {
            const { driver, driverConfig } = config;

            /*
                Deleting this property ensures that we call this function more than once,
                See https://github.com/ardatan/graphql-tools/issues/353#issuecomment-499569711
            */
            // eslint-disable-next-line no-param-reassign,no-underscore-dangle
            delete resolveInfo.operation.__runAtMostOnce;

            if (!context?.driver) {
                if (!driver) {
                    throw new Error(
                        "A Neo4j driver instance must either be passed to Neo4jGraphQL on construction, or passed as context.driver in each request."
                    );
                }
                context.driver = driver;
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
        const driverConfig = input.driverConfig || this.driverConfig;

        if (!driver) {
            throw new Error("neo4j-driver Driver missing");
        }

        return checkNeo4jCompat({ driver, driverConfig });
    }
}

export default Neo4jGraphQL;
