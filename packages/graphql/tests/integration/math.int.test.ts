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

import type { GraphQLError } from "graphql";
import { int } from "neo4j-driver";
import { generate } from "randomstring";
import { TestHelper } from "../utils/tests-helper";

describe("Mathematical operations tests", () => {
    const testHelper = new TestHelper();
    const largestSafeSigned32BitInteger = Number(2 ** 31 - 1);
    const largestSafeSigned64BitBigInt = BigInt(2 ** 63 - 1).toString();

    afterEach(async () => {
        await testHelper.close();
    });

    test.each([
        { initialValue: int(0), value: 5, type: "Int", operation: "INCREMENT", expected: 5 },
        { initialValue: int(10), value: 5, type: "Int", operation: "DECREMENT", expected: 5 },
        { initialValue: int(0), value: "5", type: "BigInt", operation: "INCREMENT", expected: "5" },
        { initialValue: int(10), value: "5", type: "BigInt", operation: "DECREMENT", expected: "5" },
        { initialValue: int(10), value: "-5", type: "BigInt", operation: "DECREMENT", expected: "15" },
        { initialValue: 0.0, value: 5.0, type: "Float", operation: "ADD", expected: 5.0 },
        { initialValue: 10.0, value: 5.0, type: "Float", operation: "SUBTRACT", expected: 5.0 },
        { initialValue: 10.0, value: 5.0, type: "Float", operation: "MULTIPLY", expected: 50.0 },
        { initialValue: 10.0, value: -5.0, type: "Float", operation: "MULTIPLY", expected: -50.0 },
        { initialValue: 10.0, value: 5.0, type: "Float", operation: "DIVIDE", expected: 2.0 },
    ])(
        "Simple operations on numberical fields: on $type, $operation($initialValue, $value) should return $expected",
        async ({ initialValue, type, value, operation, expected }) => {
            const movie = testHelper.createUniqueType("Movie");

            const typeDefs = `
            type ${movie.name} {
                id: ID!
                viewers: ${type}!
            }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const query = `
            mutation($id: ID, $value: ${type}) {
                ${movie.operations.update}(where: { id: $id }, update: {viewers_${operation}: $value}) {
                    ${movie.plural} {
                        id
                        viewers
                    }
                }
            }
            `;

            // Create new movie
            await testHelper.executeCypher(
                `
                CREATE (:${movie.name} {id: $id, viewers: $initialViewers})
                `,
                {
                    id,
                    initialViewers: initialValue,
                }
            );
            // Update movie
            const gqlResult = await testHelper.executeGraphQL(query, {
                variableValues: { id, value },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult?.data?.[movie.operations.update]).toEqual({
                [movie.plural]: [{ id, viewers: expected }],
            });
        }
    );

    test.each([
        {
            initialValue: int(largestSafeSigned32BitInteger),
            value: largestSafeSigned32BitInteger,
            type: "Int",
            operation: "INCREMENT",
            expectedError: "overflow",
        },
        {
            initialValue: int(largestSafeSigned64BitBigInt),
            value: largestSafeSigned64BitBigInt,
            type: "BigInt",
            operation: "INCREMENT",
            expectedError: "overflow",
        },
        {
            initialValue: Number.MAX_VALUE,
            value: Number.MAX_VALUE,
            type: "Float",
            operation: "ADD",
            expectedError: "overflow",
        },
        { initialValue: 10.0, value: 0.0, type: "Float", operation: "DIVIDE", expectedError: "division by zero" },
    ])(
        "Should raise an error in case of $expectedError on $type, initialValue: $initialValue, value: $value",
        async ({ initialValue, type, value, operation, expectedError }) => {
            const movie = testHelper.createUniqueType("Movie");
            const typeDefs = `
            type ${movie.name} {
                id: ID!
                viewers: ${type}!
            }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const query = `
            mutation($id: ID, $value: ${type}) {
                ${movie.operations.update}(where: { id: $id }, update: {viewers_${operation}: $value}) {
                    ${movie.plural} {
                        id
                        viewers
                    }
                }
            }
            `;

            // Create new movie
            await testHelper.executeCypher(
                `
                CREATE (:${movie.name} {id: $id, viewers: $initialViewers})
                `,
                {
                    id,
                    initialViewers: initialValue,
                }
            );
            // Update movie
            const gqlResult = await testHelper.executeGraphQL(query, {
                variableValues: { id, value },
            });
            expect(gqlResult.errors).toBeDefined();
            expect(
                (gqlResult.errors as GraphQLError[]).some((el) => el.message.toLowerCase().includes(expectedError))
            ).toBeTruthy();
            const storedValue = await testHelper.executeCypher(
                `
                MATCH (n:${movie.name} {id: $id}) RETURN n.viewers AS viewers
                `,
                {
                    id,
                }
            );
            expect(storedValue.records[0]?.get("viewers")).toEqual(initialValue);
        }
    );

    test("Should raise an error if the input fields are ambiguous", async () => {
        const initialViewers = int(100);
        const movie = testHelper.createUniqueType("Movie");
        const typeDefs = `
        type ${movie.name} {
            id: ID!
            viewers: Int!
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $value: Int) {
            ${movie.operations.update}(where: { id: $id }, update: {viewers: $value, viewers_INCREMENT: $value}) {
                ${movie.plural} {
                    id
                    viewers
                }
            }
        }
        `;

        // Create new movie
        await testHelper.executeCypher(
            `
                CREATE (:${movie.name} {id: $id, viewers: $initialViewers})
                `,
            {
                id,
                initialViewers,
            }
        );
        // Update movie
        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, value: 10 },
        });
        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as GraphQLError[]).some((el) =>
                el.message.includes("Cannot mutate the same field multiple times in one Mutation")
            )
        ).toBeTruthy();
        const storedValue = await testHelper.executeCypher(
            `
                MATCH (n:${movie.name} {id: $id}) RETURN n.viewers AS viewers
                `,
            {
                id,
            }
        );
        expect(storedValue.records[0]?.get("viewers")).toEqual(initialViewers);
    });

    test("Should be possible to do multiple operations in the same mutation", async () => {
        const initialViewers = int(100);
        const initialLength = int(100);
        const movie = testHelper.createUniqueType("Movie");
        const typeDefs = `
        type ${movie.name} {
            id: ID!
            viewers: Int!
            length: Int!
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $value: Int) {
            ${movie.operations.update}(where: { id: $id }, update: {length_DECREMENT: $value, viewers_INCREMENT: $value}) {
                ${movie.plural} {
                    id
                    viewers
                    length
                }
            }
        }
        `;

        // Create new movie
        await testHelper.executeCypher(
            `
                CREATE (:${movie.name} {id: $id, viewers: $initialViewers, length: $initialLength})
                `,
            {
                id,
                initialViewers,
                initialLength,
            }
        );
        // Update movie
        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, value: 10 },
        });

        expect(gqlResult.errors).toBeUndefined();
        const storedValue = await testHelper.executeCypher(
            `
                MATCH (n:${movie.name} {id: $id}) RETURN n.viewers AS viewers, n.length AS length
                `,
            {
                id,
            }
        );
        expect(storedValue.records[0]?.get("viewers")).toEqual(int(110));
        expect(storedValue.records[0]?.get("length")).toEqual(int(90));
    });

    test("Should be possible to update nested nodes", async () => {
        const initialViewers = int(100);
        const name = "Luigino";
        const movie = testHelper.createUniqueType("Movie");
        const actor = testHelper.createUniqueType("Actor");
        const typeDefs = `
        type ${movie.name} {
            viewers: Int!
            workers: [${actor.name}!]! @relationship(type: "WORKED_IN", direction: IN)
        }
        type ${actor.name} {
            id: ID!
            name: String!
            worksInMovies: [${movie.name}!]! @relationship(type: "WORKED_IN", direction: OUT)
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $value: Int) {
            ${actor.operations.update}(where: { id: $id }, 
                update: {
                    worksInMovies: [
                    {
                      update: {
                        node: {
                          viewers_INCREMENT: $value
                        }
                      }
                    }
                  ]
                }
              ) {
                ${actor.plural} {
                    name
                    worksInMovies {
                      viewers
                    }
                }
            }
        }
        `;

        // Create new movie
        await testHelper.executeCypher(
            `
                CREATE (a:${movie.name} {viewers: $initialViewers}), (b:${actor.name} {id: $id, name: $name}) WITH a,b CREATE (a)<-[worksInMovies: WORKED_IN]-(b) RETURN a, worksInMovies, b
                `,
            {
                id,
                initialViewers,
                name,
            }
        );
        // Update movie
        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, value: 10 },
        });

        expect(gqlResult.errors).toBeUndefined();
        const storedValue = await testHelper.executeCypher(
            `
                MATCH (n:${actor.name} {id: $id})--(m:${movie.name}) RETURN n.name AS name, m.viewers AS viewers
                `,
            {
                id,
            }
        );
        expect(storedValue.records[0]?.get("viewers")).toEqual(int(110));
        expect(storedValue.records[0]?.get("name")).toBe(name);
    });

    test("Should be possible to update nested nodes using interfaces", async () => {
        const initialViewers = int(100);
        const name = "Luigino";
        const movie = testHelper.createUniqueType("Movie");
        const production = testHelper.createUniqueType("Production");
        const actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
        interface ${production.name} {
            viewers: Int!
        }
        type ${movie.name} implements ${production.name} {
            viewers: Int!
            workers: [${actor.name}!]! @relationship(type: "WORKED_IN", direction: IN)
        }
        type ${actor.name} {
            id: ID!
            name: String!
            worksInProductions: [${production.name}!]! @relationship(type: "WORKED_IN", direction: OUT)
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $value: Int) {
            ${actor.operations.update}(where: { id: $id }, 
                update: {
                  worksInProductions: [
                    {
                      update: {
                        node: {
                          viewers_INCREMENT: $value
                        }
                      }
                    }
                  ]
                }
              ) {
                ${actor.plural} {
                    name
                    worksInProductions {
                      viewers
                    }
                }
            }
        }
        `;

        // Create new movie
        await testHelper.executeCypher(
            `
                CREATE (a:${movie.name} {viewers: $initialViewers}), (b:${actor.name} {id: $id, name: $name}) WITH a,b CREATE (a)<-[worksInProductions: WORKED_IN]-(b) RETURN a, worksInProductions, b
                `,
            {
                id,
                initialViewers,
                name,
            }
        );
        // Update movie
        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, value: 10 },
        });

        expect(gqlResult.errors).toBeUndefined();
        const storedValue = await testHelper.executeCypher(
            `
                MATCH (n:${actor.name} {id: $id})--(m:${movie.name}) RETURN n.name AS name, m.viewers AS viewers
                `,
            {
                id,
            }
        );
        expect(storedValue.records[0]?.get("viewers")).toEqual(int(110));
        expect(storedValue.records[0]?.get("name")).toBe(name);
    });

    test("Should throws an error if the property holds Nan values", async () => {
        const increment = 10;
        const movie = testHelper.createUniqueType("Movie");
        const typeDefs = `
        type ${movie.name} {
            id: ID!
            viewers: Int
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation($id: ID, $value: Int) {
            ${movie.operations.update}(where: { id: $id }, update: {viewers_INCREMENT: $value}) {
                ${movie.plural} {
                    id
                    viewers
                }
            }
        }
        `;

        // Create new movie
        await testHelper.executeCypher(
            `
                CREATE (:${movie.name} {id: $id})
                `,
            {
                id,
            }
        );
        // Update movie
        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, value: increment },
        });

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as GraphQLError[]).some((el) =>
                el.message.includes(`Cannot _INCREMENT ${increment} to Nan`)
            )
        ).toBeTruthy();
        const storedValue = await testHelper.executeCypher(
            `
                MATCH (n:${movie.name} {id: $id}) RETURN n.viewers AS viewers
                `,
            {
                id,
            }
        );
        expect(storedValue.records[0]?.get("viewers")).toBeNull();
    });

    test("Should be possible to update relationship properties", async () => {
        const initialPay = 100;
        const payIncrement = 50;
        const movie = testHelper.createUniqueType("Movie");
        const actor = testHelper.createUniqueType("Actor");
        const typeDefs = `
        type ${movie.name} {
            title: String
            actors: [${actor.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
        }
        
        type ${actor.name} {
            id: ID!
            name: String!
            actedIn: [${movie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
        }

        type ActedIn @relationshipProperties {
            pay: Float
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation Mutation($id: ID, $payIncrement: Float) {
            ${actor.operations.update}(where: { id: $id }, update: {
                  actedIn: [
                    {
                      update: {
                        edge: {
                          pay_ADD: $payIncrement
                        }
                      }
                    }
                  ]
                }) {
              ${actor.plural} {
                name
                actedIn {
                  title
                }
                actedInConnection {
                  edges {
                    properties {
                        pay
                    }
                  }
                }
              }
            }
        }
        `;

        // Create new movie
        await testHelper.executeCypher(
            `
                CREATE (a:${movie.name} {title: "The Matrix"}), (b:${actor.name} {id: $id, name: "Keanu"}) WITH a,b CREATE (a)<-[actedIn: ACTED_IN{ pay: $initialPay }]-(b) RETURN a, actedIn, b
                `,
            {
                id,
                initialPay,
            }
        );
        // Update movie
        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, payIncrement },
        });

        expect(gqlResult.errors).toBeUndefined();
        const storedValue = await testHelper.executeCypher(
            `
                MATCH(b: ${actor.name}{id: $id}) -[c: ACTED_IN]-> (a: ${movie.name}) RETURN c.pay as pay
                `,
            {
                id,
            }
        );
        expect(storedValue.records[0]?.get("pay")).toEqual(initialPay + payIncrement);
    });

    test("Should raise in case of ambiguous properties on relationships", async () => {
        const initialPay = 100;
        const payIncrement = 50;
        const movie = testHelper.createUniqueType("Movie");
        const actor = testHelper.createUniqueType("Actor");
        const typeDefs = `
        type ${movie.name} {
            title: String
            viewers: Int
            actors: [${actor.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
        }
        
        type ${actor.name} {
            id: ID!
            name: String!
            actedIn: [${movie.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
        }

        type ActedIn @relationshipProperties {
            pay: Float
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
        mutation Mutation($id: ID, $payIncrement: Float) {
            ${actor.operations.update}(where: { id: $id }, update: {
                  actedIn: [
                    {
                      update: {
                        edge: {
                          pay_ADD: $payIncrement
                          pay: $payIncrement
                        }
                      }
                    }
                  ]
                }) {
              ${actor.plural} {
                name
                actedIn {
                  title
                }
                actedInConnection {
                  edges {
                    properties { 
                        pay
                    }
                  }
                }
              }
            }
        }

        `;

        // Create new movie
        await testHelper.executeCypher(
            `
                CREATE (a:${movie.name} {title: "The Matrix"}), (b:${actor.name} {id: $id, name: "Keanu"}) WITH a,b CREATE (a)<-[actedIn: ACTED_IN{ pay: $initialPay }]-(b) RETURN a, actedIn, b
                `,
            {
                id,
                initialPay,
            }
        );
        // Update movie
        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { id, payIncrement },
        });

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as GraphQLError[]).some((el) =>
                el.message.includes("Cannot mutate the same field multiple times in one Mutation")
            )
        ).toBeTruthy();
        const storedValue = await testHelper.executeCypher(
            `
                MATCH(b: ${actor.name}{id: $id}) -[c: ACTED_IN]-> (a: ${movie.name}) RETURN c.pay as pay
                `,
            {
                id,
            }
        );
        expect(storedValue.records[0]?.get("pay")).toEqual(initialPay);
    });
});
