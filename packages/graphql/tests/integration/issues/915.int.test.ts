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

import { Driver, int, isInt } from "neo4j-driver";
import debug from "debug";
import { generate } from "randomstring";
import { graphql, GraphQLError, GraphQLScalarType, Kind, ValueNode } from "graphql";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

debug.enable("@neo4j/graphql:*");

// Adapted from BigInt
const PositiveInt = new GraphQLScalarType({
    name: "PositiveInt",
    description: "A positive integer",
    serialize(outputValue: unknown) {
        if (isInt(outputValue)) {
            return outputValue.toInt();
        }

        if (typeof outputValue === "string") {
            return parseInt(outputValue, 10);
        }

        if (typeof outputValue === "number") {
            return outputValue;
        }

        throw new GraphQLError(`Positive values cannot represent value: ${outputValue}`);
    },
    parseValue(inputValue: unknown) {
        if (typeof inputValue !== "string" && typeof inputValue !== "number") {
            throw new GraphQLError(
                "PositiveInt values are not JSON serializable. Please pass as a string in variables, or inline in the GraphQL query."
            );
        }

        const value = int(inputValue);

        if (!value.greaterThan(0)) {
            throw new GraphQLError("PositiveInt values must be positive");
        }

        return value;
    },
    parseLiteral(ast: ValueNode) {
        switch (ast.kind) {
            case Kind.INT: {
                const value = int(ast.value);
                if (!value.greaterThan(0)) {
                    throw new GraphQLError("PositiveInt values must be positive");
                }
                return int(ast.value);
            }
            default:
                throw new GraphQLError("Value must be either a positive integer.");
        }
    },
});

describe("assertIndexesAndConstraints/unique/customScalar", () => {
    let driver: Driver;
    let databaseName: string;
    let MULTIDB_SUPPORT = true;

    beforeAll(async () => {
        driver = await neo4j();

        databaseName = generate({ readable: true, charset: "alphabetic" });

        const cypher = `CREATE DATABASE ${databaseName}`;
        const session = driver.session();
        try {
            await session.run(cypher);
        } catch (e) {
            if (e instanceof Error) {
                if (
                    e.message.includes(
                        "This is an administration command and it should be executed against the system database"
                    ) ||
                    e.message.includes(`Neo4jError: Unsupported administration command: ${cypher}`)
                ) {
                    // No multi-db support, so we skip tests
                    MULTIDB_SUPPORT = false;
                } else {
                    throw e;
                }
            }
        } finally {
            await session.close();
        }
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((x) => setTimeout(x, 5000));
    });

    afterAll(async () => {
        if (MULTIDB_SUPPORT) {
            const cypher = `DROP DATABASE ${databaseName}`;

            const session = driver.session();
            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }
        }
        await driver.close();
    });
    test("should create a constraint on custom scalar if it doesn't exist and specified in options, and then throw an error in the event of constraint validation", async () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const OrderNo = 12;
        const Name = generate({ readable: true });

        const typeDefs = gql`
            scalar PositiveInt
            type Order {
                OrderNo: PositiveInt! @unique
                Name: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: {
                PositiveInt,
            },
        });
        const schema = await neoSchema.getSchema();

        await expect(
            neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            })
        ).resolves.not.toThrow();

        const session = driver.session({ database: databaseName });

        const cypher = "SHOW UNIQUE CONSTRAINTS";

        try {
            const result = await session.run(cypher);

            expect(
                result.records
                    .map((record) => {
                        return record.toObject();
                    })
                    .filter((record) => record.labelsOrTypes.includes("Order"))
            ).toHaveLength(1);
        } finally {
            await session.close();
        }

        const mutation = `
            mutation CreateOrders($OrderNo: PositiveInt!, $Name: String!) {
                createOrders(input: [{ OrderNo: $OrderNo, Name: $Name }]) {
                    orders {
                        OrderNo
                        Name
                    }
                }
            }
        `;

        const createResult = await graphql({
            schema,
            source: mutation,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
            variableValues: {
                OrderNo,
                Name,
            },
        });

        expect(createResult.errors).toBeFalsy();

        expect(createResult.data).toEqual({
            createOrders: { orders: [{ OrderNo, Name }] },
        });

        const errorResult = await graphql({
            schema,
            source: mutation,
            contextValue: {
                driver,
                driverConfig: { database: databaseName },
            },
            variableValues: {
                OrderNo,
                Name,
            },
        });

        expect(errorResult.errors).toHaveLength(1);
        expect(errorResult.errors?.[0].message).toBe("Constraint validation failed");
    });
});
