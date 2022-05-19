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

import { Driver, int } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("Mathematical operations tests", () => {
    let driver: Driver;
    const largestSafeSigned32BitInteger = Number(2 ** 31 - 1);
    const largestSafeSigned64BitBigInt = BigInt(2 ** 63 - 1).toString();

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test.each([
        {initialValue: int(0), value: 5, type: "Int", operation: "INCREMENT", expected: 5},
        {initialValue: int(10), value: 5, type: "Int", operation: "DECREMENT", expected: 5},
        {initialValue: int(0), value: "5", type: "BigInt", operation: "INCREMENT", expected: "5"},
        {initialValue: int(10), value: "5", type: "BigInt", operation: "DECREMENT", expected: "5"},
        {initialValue: 0.0, value: 5.0, type: "Float", operation: "ADD", expected: 5.0},
        {initialValue: 10.0, value: 5.0, type: "Float", operation: "SUBTRACT", expected: 5.0},
        {initialValue: 10.0, value: 5.0, type: "Float", operation: "MULTIPLY", expected: 50.0},
        {initialValue: 10.0, value: 5.0, type: "Float", operation: "DIVIDE", expected: 2.0},
      ])('Test simple operations on numberical fields: on $type, $operation($initialValue, $value) should return $expected',
       async ({ initialValue, type, value, operation, expected }) => {
        const session = driver.session();

        const typeDefs = `
        type Movie {
            id: ID!
            viewers: ${type}!
        }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $value: ${type}) {
            updateMovies(where: { id: $id }, update: {viewers_${operation}: $value}) {
                movies {
                    id
                    viewers
                }
            }
        }
        `;

        try {
            // Create new movie
            await session.run(
                `
                CREATE (:Movie {id: $id, viewers: $initialViewers})
                `,
                {
                    id,
                    initialViewers: initialValue,
                }
            );
            // Update movie
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id, value },
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeUndefined();

            expect(gqlResult?.data?.updateMovies).toEqual({ movies: [{ id, viewers: expected }] });

        } finally {
            await session.close();
        }
      });
    
      test.each([
        {initialValue: int(largestSafeSigned32BitInteger), value: largestSafeSigned32BitInteger, type: "Int", operation: "INCREMENT", expectedError: "overflow"},
        {initialValue: int(largestSafeSigned64BitBigInt), value: largestSafeSigned64BitBigInt, type: "BigInt", operation: "INCREMENT", expectedError: "overflow"},
        {initialValue: Number.MAX_VALUE, value: Number.MAX_VALUE, type: "Float", operation: "ADD", expectedError: "overflow"},
        {initialValue: 10.0, value: 0.0, type: "Float", operation: "DIVIDE", expectedError: "division by zero"}
      ])('Should raise an error in case of $expectedError on $type, initialValue: $initialValue, value: $value',
       async ({ initialValue, type, value, operation }) => {
        const session = driver.session();

        const typeDefs = `
        type Movie {
            id: ID!
            viewers: ${type}!
        }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $value: ${type}) {
            updateMovies(where: { id: $id }, update: {viewers_${operation}: $value}) {
                movies {
                    id
                    viewers
                }
            }
        }
        `;

        try {
            // Create new movie
            await session.run(
                `
                CREATE (:Movie {id: $id, viewers: $initialViewers})
                `,
                {
                    id,
                    initialViewers: initialValue,
                }
            );
            // Update movie
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id, value },
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeDefined();
            const storedValue = await session.run(
                `
                MATCH (n:Movie {id: $id}) RETURN n.viewers AS viewers
                `,
                {
                    id
                }
            );
            expect(storedValue.records[0].get('viewers')).toEqual(initialValue);

        } finally {
            await session.close();
        }
      });

      test('Should raise an error if the input fields are ambigous', async () => {
        const session = driver.session();
        const initialViewers = int(100);
        const typeDefs = `
        type Movie {
            id: ID!
            viewers: Int!
        }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $value: Int) {
            updateMovies(where: { id: $id }, update: {viewers: $value, viewers_INCREMENT: $value}) {
                movies {
                    id
                    viewers
                }
            }
        }
        `;

        try {
            // Create new movie
            await session.run(
                `
                CREATE (:Movie {id: $id, viewers: $initialViewers})
                `,
                {
                    id,
                    initialViewers,
                }
            );
            // Update movie
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id, value: 10 },
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeDefined();
            const storedValue = await session.run(
                `
                MATCH (n:Movie {id: $id}) RETURN n.viewers AS viewers
                `,
                {
                    id
                }
            );
            expect(storedValue.records[0].get('viewers')).toEqual(initialViewers);

        } finally {
            await session.close();
        }
      });


      test('Should be possible to do multiple operations in the same mutation', async () => {
        const session = driver.session();
        const initialViewers = int(100);
        const initialLength = int(100);
        const typeDefs = `
        type Movie {
            id: ID!
            viewers: Int!
            length: Int!
        }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $value: Int) {
            updateMovies(where: { id: $id }, update: {length_DECREMENT: $value, viewers_INCREMENT: $value}) {
                movies {
                    id
                    viewers
                    length
                }
            }
        }
        `;

        try {
            // Create new movie
            await session.run(
                `
                CREATE (:Movie {id: $id, viewers: $initialViewers, length: $initialLength})
                `,
                {
                    id,
                    initialViewers,
                    initialLength
                }
            );
            // Update movie
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id, value: 10 },
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeUndefined();
            const storedValue = await session.run(
                `
                MATCH (n:Movie {id: $id}) RETURN n.viewers AS viewers, n.length AS length
                `,
                {
                    id
                }
            );
            expect(storedValue.records[0].get('viewers')).toEqual(int(110));
            expect(storedValue.records[0].get('length')).toEqual(int(90));

        } finally {
            await session.close();
        }
      });

});
