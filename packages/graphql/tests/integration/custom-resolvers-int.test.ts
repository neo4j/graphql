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
import { graphql, createSourceEventStream, parse } from "graphql";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import { Neo4jGraphQL } from "../../src/classes";
import neo4j from "./neo4j";

describe("Custom Resolvers", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should define a custom field resolver and resolve it", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
              id: ID
              custom: String
            }
        `;

        function customResolver(root) {
            return (root.id as string).toUpperCase();
        }

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: { Movie: { custom: customResolver } },
        });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                createMovies(input:[{id: "${id}"}]) {
                    movies {
                        id
                        custom
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).createMovies.movies[0]).toEqual({
                id,
                custom: id.toUpperCase(),
            });
        } finally {
            await session.close();
        }
    });

    test("should define a custom Query resolver and resolve it", async () => {
        const typeDefs = `
            type Movie {
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

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: { Query: { id: customResolver } },
        });

        const query = `
            {
                id
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).id).toEqual(id);
    });

    test("should define a custom Mutation resolver and resolve it", async () => {
        const typeDefs = `
            type Movie {
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

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: { Mutation: { id: customResolver } },
        });

        const mutation = `
            mutation {
                id
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: mutation,
            contextValue: { driver },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).id).toEqual(id);
    });

    test("should define a custom Subscription resolver and resolve it", async () => {
        const typeDefs = `
            type Movie {
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

        const neoSchema = new Neo4jGraphQL({
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

        const gqlResult = await createSourceEventStream(neoSchema.schema, parse(query), null, { driver });

        // @ts-ignore
        const next = await gqlResult.next();
        expect(next.value.id).toEqual(id);
    });

    describe("@cypher", () => {
        test("should define custom Query (with cypher directive) and resolve each value", async () => {
            await Promise.all(
                ["ID", "Int", "Float", "Boolean", "Object", "Node"].map(async (type) => {
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
                                RETURN \\"${id}\\"
                                """)
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
                                RETURN ${int}
                                """)
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
                                RETURN ${float}
                                """)
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
                                RETURN ${bool}
                                """)
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
                                RETURN {id: \\"${id}\\"}
                                """)
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
                            type Test {
                                id: ID
                            }

                            type Query {
                                test(id: ID!): Test! @cypher(statement: """
                                MATCH (n:Test {id: $id})
                                RETURN n
                                """)
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

                    const session = driver.session();

                    const neoSchema = new Neo4jGraphQL({
                        typeDefs,
                    });

                    try {
                        if (type === "Node") {
                            await session.run(`
                                CREATE (n:Test {id: "${id}"})
                            `);
                        }

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver },
                        });

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
                    } finally {
                        await session.close();
                    }
                })
            );
        });

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
                        RETURN \\"${id}\\" + $id
                    """)
                }
            `;

            const mutation = `
                mutation {
                    test(id: "${id}")
                }
            `;

            const session = driver.session();

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            try {
                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: mutation,
                    contextValue: { driver },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect((gqlResult.data as any).test).toEqual(`${id}${id}`);
            } finally {
                await session.close();
            }
        });

        describe("auth", () => {
            describe("should inject the auth into cypher directive on queries and mutations", () => {
                test("query", async () => {
                    const session = driver.session();

                    const typeDefs = `
                        type Query {
                            userId: ID @cypher(statement: """
                                RETURN $auth.jwt.sub
                            """)
                        }
                    `;

                    const userId = generate({
                        charset: "alphabetic",
                    });

                    const secret = "secret";

                    const token = jsonwebtoken.sign({ sub: userId }, secret);

                    const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

                    const query = `
                        {
                            userId
                        }
                    `;

                    try {
                        const socket = new Socket({ readable: true });
                        const req = new IncomingMessage(socket);
                        req.headers.authorization = `Bearer ${token}`;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query as string,
                            contextValue: { driver, req },
                        });

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any).userId).toEqual(userId);
                    } finally {
                        await session.close();
                    }
                });

                test("mutation", async () => {
                    const session = driver.session();

                    const typeDefs = `
                        type User {
                            id: ID
                        }

                        type Mutation {
                            userId: ID @cypher(statement: """
                                RETURN $auth.jwt.sub
                            """)
                        }
                    `;

                    const userId = generate({
                        charset: "alphabetic",
                    });

                    const secret = "secret";

                    const token = jsonwebtoken.sign({ sub: userId }, secret);

                    const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

                    const query = `
                        mutation {
                            userId
                        }
                    `;

                    try {
                        const socket = new Socket({ readable: true });
                        const req = new IncomingMessage(socket);
                        req.headers.authorization = `Bearer ${token}`;

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query as string,
                            contextValue: { driver, req },
                        });

                        expect(gqlResult.errors).toBeUndefined();

                        expect((gqlResult.data as any).userId).toEqual(userId);
                    } finally {
                        await session.close();
                    }
                });
            });

            test("should inject the auth into cypher directive on fields", async () => {
                const session = driver.session();

                const typeDefs = `
                    type User {
                        id: ID
                        userId: ID @cypher(statement: """
                            WITH $auth.jwt.sub as a
                            RETURN a
                        """)
                    }
                `;

                const userId = generate({
                    charset: "alphabetic",
                });

                const secret = "secret";

                const token = jsonwebtoken.sign({ sub: userId }, secret);

                const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

                const query = `
                {
                     users(where: {id: "${userId}"}){
                        userId
                    }
                }
                `;

                try {
                    await session.run(`
                        CREATE (:User {id: "${userId}"})
                    `);

                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    req.headers.authorization = `Bearer ${token}`;

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: query,
                        contextValue: { driver, req },
                    });

                    expect(gqlResult.errors).toBeUndefined();

                    expect((gqlResult.data as any).users[0].userId).toEqual(userId);
                } finally {
                    await session.close();
                }
            });
        });

        test("should return an enum from a cypher directive (top level)", async () => {
            const typeDefs = `
                enum Status {
                    COMPLETED
                }


                type Query {
                    status: Status @cypher(statement: """
                        RETURN 'COMPLETED'
                    """)
                }
            `;

            const query = `
                query {
                    status
                }
            `;

            const session = driver.session();

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            try {
                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect((gqlResult.data as any).status).toEqual("COMPLETED");
            } finally {
                await session.close();
            }
        });

        test("should return an enum from a cypher directive (field level)", async () => {
            const id = generate({
                charset: "alphabetic",
            });

            const typeDefs = `
                enum Status {
                    COMPLETED
                }

                type Trade {
                    id: ID
                    status: Status @cypher(statement: """
                        RETURN 'COMPLETED'
                    """)
                }
            `;

            const query = `
                query {
                    trades(where: { id: "${id}" }) {
                        id
                        status
                    }
                }
            `;

            const session = driver.session();

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            try {
                await session.run(`
                    CREATE (:Trade {id: "${id}"})
                `);

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: query,
                    contextValue: { driver },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect((gqlResult.data as any).trades[0]).toEqual({ id, status: "COMPLETED" });
            } finally {
                await session.close();
            }
        });
    });
});
