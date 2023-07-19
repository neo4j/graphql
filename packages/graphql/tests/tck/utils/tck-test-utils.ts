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

import type { DocumentNode, GraphQLArgs } from "graphql";
import { graphql } from "graphql";
import { Neo4jError } from "neo4j-driver";
import type { Neo4jGraphQL } from "../../../src";
import { DriverBuilder } from "../../utils/builders/driver-builder";
import { getQuerySource } from "../../utils/get-query-source";
import { Neo4jDatabaseInfo } from "../../../src/classes/Neo4jDatabaseInfo";
import Neo4j from "../../integration/neo4j";

export function setTestEnvVars(envVars: string | undefined): void {
    if (envVars) {
        envVars.split(/\n/g).forEach((v: string) => {
            const [name, val] = v.split("=");
            process.env[name as string] = val;
        });
    }
}

export function unsetTestEnvVars(envVars: string | undefined): void {
    if (envVars) {
        envVars.split(/\n/g).forEach((v: string) => {
            const name = v.split("=")[0] as string;
            delete process.env[name];
        });
    }
}

export function formatCypher(cypher: string): string {
    return cypher.replace(/\s+\n/g, "\n");
}

export function formatParams(params: Record<string, any>): string {
    return JSON.stringify(params, null, 4);
}

export async function translateQuery(
    neoSchema: Neo4jGraphQL,
    query: DocumentNode,
    options?: {
        token?: string;
        variableValues?: Record<string, any>;
        neo4jVersion?: string;
        contextValues?: Record<string, any>;
        subgraph?: boolean;
    }
): Promise<{ cypher: string; params: Record<string, any> }> {
    const driverBuilder = new DriverBuilder();
    const neo4jDatabaseInfo = new Neo4jDatabaseInfo(options?.neo4jVersion ?? "4.4");
    let contextValue: Record<string, any> = { executionContext: driverBuilder.instance(), neo4jDatabaseInfo };

    if (options?.token) {
        contextValue.token = options.token;
    }

    if (options?.contextValues) {
        contextValue = { ...contextValue, ...options.contextValues };
    }

    const graphqlArgs: GraphQLArgs = {
        schema: await (options?.subgraph ? neoSchema.getSubgraphSchema() : neoSchema.getSchema()),
        source: getQuerySource(query),
        contextValue,
    };
    if (options?.variableValues) {
        graphqlArgs.variableValues = options.variableValues;
    }

    const { errors } = await graphql(graphqlArgs);

    if (errors?.length) {
        const errorString = errors.map((x) => `${x.message}\n${x.stack}`).join("\n");

        // Because we dont return the correct
        // contract that the schema is expecting,
        // instead we return a string and params for testing
        const expectedErrors = [
            "Cannot read property 'get' of undefined",
            "Cannot return null for non-nullable",
            "Cannot read properties of undefined (reading 'get')",
        ];

        if (!expectedErrors.some((error) => errorString.includes(error))) {
            throw new Error(errorString);
        }
    }

    const [cypher, params] = driverBuilder.runFunction.calls[0] as [string, Record<string, any>];

    if (process.env.VERIFY_TCK) {
        const neo4j = new Neo4j();
        const session = await neo4j.getSession();
        try {
            await session.run(`EXPLAIN ${cypher}`, params);
        } catch (e) {
            if (e instanceof Neo4jError) {
                throw new Error(`${e.message}\n\n${cypher}\n\n${formatParams(params)}`);
            }

            throw e;
        } finally {
            await session.close();
            const driver = await neo4j.getDriver();
            await driver.close();
        }
    }

    return {
        cypher,
        params,
    };
}
