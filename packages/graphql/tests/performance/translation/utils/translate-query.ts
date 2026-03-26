/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLArgs } from "graphql";
import { graphql } from "graphql";
import type { IncomingMessage } from "http";
import type { Neo4jGraphQL } from "../../../../src";
import { Neo4jDatabaseInfo } from "../../../../src/classes/Neo4jDatabaseInfo";
import { DriverBuilder } from "../../../utils/builders/driver-builder";

// TODO: improve this so only `graphql(graphqlArgs)` is tested
export async function translateQuery(
    neoSchema: Neo4jGraphQL,
    query: string,
    options?: {
        req?: IncomingMessage;
        variableValues?: Record<string, any>;
        neo4jVersion?: string;
        contextValues?: Record<string, any>;
    }
): Promise<{ cypher: string; params: Record<string, any> }> {
    const driverBuilder = new DriverBuilder();
    const neo4jDatabaseInfo = new Neo4jDatabaseInfo(options?.neo4jVersion ?? "4.4");
    let contextValue: Record<string, any> = { driver: driverBuilder.instance(), neo4jDatabaseInfo };
    if (options?.req) {
        contextValue.req = options.req;
    }

    if (options?.contextValues) {
        contextValue = { ...contextValue, ...options.contextValues };
    }

    const graphqlArgs: GraphQLArgs = {
        schema: await neoSchema.getSchema(),
        source: query,
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

    return {
        cypher,
        params,
    };
}
