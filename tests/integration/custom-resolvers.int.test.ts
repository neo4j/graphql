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

import { createSourceEventStream, parse } from "graphql";
import { driver } from "neo4j-driver";
import { generate } from "randomstring";
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("Custom Resolvers", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should define a custom field resolver and resolve it", async () => {
        const typeDefs = `
            type ${Movie} {
              id: ID
              custom: String
            }
        `;

        function customResolver(root) {
            return (root.id as string).toUpperCase();
        }

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: { [Movie.name]: { custom: customResolver } },
        });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                ${Movie.operations.create}(input:[{id: "${id}"}]) {
                    ${Movie.plural} {
                        id
                        custom
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[Movie.operations.create][Movie.plural][0]).toEqual({
            id,
            custom: id.toUpperCase(),
        });
    });

    test("should define a custom Query resolver and resolve it", async () => {
        const typeDefs = `
            type ${Movie} {
              id: ID
              custom: String
            }

            type Query {
                id: ID
            }
        `;

        const id = generate({
            charset: "alphabetic",
        });

        function customResolver() {
            return id;
        }

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: { Query: { id: customResolver } },
        });

        const query = `
            {
                id
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).id).toEqual(id);
    });

    test("should define a custom Mutation resolver and resolve it", async () => {
        const typeDefs = `
            type ${Movie} {
              id: ID
              custom: String
            }

            type Mutation {
                id: ID
            }
        `;

        const id = generate({
            charset: "alphabetic",
        });

        function customResolver() {
            return id;
        }

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: { Mutation: { id: customResolver } },
        });

        const mutation = `
            mutation {
                id
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(mutation);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).id).toEqual(id);
    });

    test("should define a custom Subscription resolver and resolve it", async () => {
        const typeDefs = `
            type ${Movie} {
              id: ID
              custom: String
            }

            type Subscription {
                id: ID!
            }
        `;

        const id = generate({
            charset: "alphabetic",
        });

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                Subscription: {
                    id: {
                        // eslint-disable-next-line @typescript-eslint/require-await
                        async *subscribe() {
                            yield { id };
                        },
                    },
                },
            },
        });

        const query = `
            subscription {
                id
            }
        `;

        const gqlResult = await createSourceEventStream(await neoSchema.getSchema(), parse(query), null, { driver });

        // @ts-ignore
        const next = await gqlResult.next();
        expect(next.value.id).toEqual(id);
    });

    test("should accept an array of custom resolvers", async () => {
        const typeDefs = `
            type ${Movie} {
              id: ID
              custom1: String
              custom2: String
            }
        `;

        function customResolver1(root) {
            return (root.id as string).toUpperCase();
        }

        function customResolver2(root) {
            return (root.id as string).toLowerCase();
        }

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: [{ [Movie.name]: { custom1: customResolver1 } }, { [Movie.name]: { custom2: customResolver2 } }],
        });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                ${Movie.operations.create}(input:[{id: "${id}"}]) {
                    ${Movie.plural} {
                        id
                        custom1
                        custom2
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[Movie.operations.create][Movie.plural][0]).toEqual({
            id,
            custom1: id.toUpperCase(),
            custom2: id.toLowerCase(),
        });
    });

    describe("@cypher", () => {
        test.each(["ID", "Int", "Float", "Boolean", "Object", "Node"] as const)(
            "should define custom Query (with cypher directive) and resolve each value",
            async (type) => {
                let typeDefs;
                let query;

                const id = generate({
                    charset: "alphabetic",
                });

                const int = Math.floor(Math.random() * 100000);
                const float = Math.floor(Math.random() * 100000) - 0.5;
                const bool = false;

                if (type === "ID") {
                    typeDefs = `
                            type Query {
                                test: ${type}! @cypher(statement: """
                                RETURN "${id}" as id
                                """,
                                columnName: "id")
                            }
                        `;

                    query = `
                            {
                                test
                            }
                        `;
                }

                if (type === "Int") {
                    typeDefs = `
                            type Query {
                                test: ${type}! @cypher(statement: """
                                RETURN ${int} as res
                                """, columnName: "res")
                            }
                        `;

                    query = `
                            {
                                test
                            }
                        `;
                }

                if (type === "Float") {
                    typeDefs = `
                            type Query {
                                test: ${type}! @cypher(statement: """
                                RETURN ${float} as res
                                """, columnName: "res")
                            }
                        `;

                    query = `
                            {
                                test
                            }
                        `;
                }

                if (type === "Boolean") {
                    typeDefs = `
                            type Query {
                                test: ${type}! @cypher(statement: """
                                RETURN ${bool} as res
                                """, columnName: "res")
                            }
                        `;

                    query = `
                            {
                                test
                            }
                        `;
                }

                if (type === "Object") {
                    typeDefs = `
                            type Test {
                                id: ID
                            }

                            type Query {
                                test: Test! @cypher(statement: """
                                RETURN {id: "${id}"} as res
                                """, columnName: "res")
                            }
                        `;

                    query = `
                            {
                                test {
                                    id
                                }
                            }
                        `;
                }

                if (type === "Node") {
                    typeDefs = `
                            type ${Movie} {
                                id: ID
                            }

                            type Query {
                                test(id: ID!): ${Movie}! @cypher(statement: """
                                MATCH (n:${Movie} {id: $id})
                                RETURN n
                                """, columnName: "n")
                            }
                        `;

                    query = `
                            {
                                test(id: "${id}") {
                                    id
                                }
                            }
                        `;
                }

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                });

                if (type === "Node") {
                    await testHelper.executeCypher(`
                                CREATE (n:${Movie} {id: "${id}"})
                            `);
                }

                const gqlResult = await testHelper.executeGraphQL(query);

                expect(gqlResult.errors).toBeFalsy();

                let expected: any;

                if (type === "ID") {
                    expected = id;
                }

                if (type === "Object" || type === "Node") {
                    expected = { id };
                }

                if (type === "Int") {
                    expected = int;
                }

                if (type === "Float") {
                    expected = float;
                }

                if (type === "Boolean") {
                    expected = bool;
                }

                expect((gqlResult.data as any).test).toEqual(expected);
            }
        );

        test("should define custom Mutation (with cypher directive) and resolve each value", async () => {
            const id = generate({
                charset: "alphabetic",
            });

            const typeDefs = `
                type Query {
                    ignore: String ## Query root type must be provided
                }

                type Mutation {
                    test(id: ID!): ID! @cypher(statement: """
                        RETURN "${id}" + $id as res
                    """, columnName: "res")
                }
            `;

            const mutation = `
                mutation {
                    test(id: "${id}")
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const gqlResult = await testHelper.executeGraphQL(mutation);

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).test).toBe(`${id}${id}`);
        });

        test("should return an enum from a cypher directive (top level)", async () => {
            const typeDefs = `
                enum Status {
                    COMPLETED
                }

                type Query {
                    status: Status @cypher(statement: """
                        RETURN 'COMPLETED' as str
                    """, columnName: "str")
                }
            `;

            const query = `
                query {
                    status
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).status).toBe("COMPLETED");
        });

        test("should return an enum from a cypher directive (field level)", async () => {
            const id = generate({
                charset: "alphabetic",
            });
            const Trade = testHelper.createUniqueType("Trade");

            const typeDefs = `
                enum Status {
                    COMPLETED
                }

                type ${Trade} {
                    id: ID
                    status: Status @cypher(statement: """
                        RETURN 'COMPLETED' as res
                    """, columnName: "res")
                }
            `;

            const query = `
                query {
                    ${Trade.plural}(where: { id: "${id}" }) {
                        id
                        status
                    }
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await testHelper.executeCypher(`
                    CREATE (:${Trade} {id: "${id}"})
                `);

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any)[Trade.plural][0]).toEqual({ id, status: "COMPLETED" });
        });

        test("should return an array of primitive values from a cypher directive (field level)", async () => {
            const Type = testHelper.createUniqueType("Type");

            const id = generate({
                charset: "alphabetic",
            });
            const string1 = generate({
                charset: "alphabetic",
            });
            const string2 = generate({
                charset: "alphabetic",
            });
            const string3 = generate({
                charset: "alphabetic",
            });

            const typeDefs = `
                type ${Type} {
                    id: ID
                    strings: [String] @cypher(statement: """
                        RETURN ['${string1}', '${string2}', '${string3}'] as arr
                    """,
                    columnName: "arr")
                }
            `;

            const query = `
                query {
                    ${Type.plural}(where: { id: "${id}" }) {
                        id
                        strings
                    }
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await testHelper.executeCypher(`
                    CREATE (:${Type} {id: "${id}"})
                `);

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any)[Type.plural][0]).toEqual({ id, strings: [string1, string2, string3] });
        });
    });
});
