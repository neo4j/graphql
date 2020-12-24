/* eslint-disable no-useless-escape */
import { Driver } from "neo4j-driver";
import { graphql, createSourceEventStream, parse } from "graphql";
import { generate } from "randomstring";
import { describe, beforeAll, afterAll, test, expect } from "@jest/globals";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import makeAugmentedSchema from "../../src/schema/make-augmented-schema";
import neo4j from "./neo4j";

describe("Custom Resolvers", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
        process.env.JWT_SECRET = "secret";
    });

    afterAll(async () => {
        await driver.close();
        delete process.env.JWT_SECRET;
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

        const neoSchema = makeAugmentedSchema({
            typeDefs,
            resolvers: { Movie: { custom: customResolver } },
        });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                createMovies(input:[{id: "${id}"}]) {
                    id
                    custom
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

            expect((gqlResult.data as any).createMovies[0] as any).toEqual({
                id,
                custom: (id as string).toUpperCase(),
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

        const neoSchema = makeAugmentedSchema({
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

        const neoSchema = makeAugmentedSchema({
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

        const neoSchema = makeAugmentedSchema({
            typeDefs,
            resolvers: {
                Subscription: {
                    id: {
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
                                RETURN \"${id}\"
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
                                RETURN {id: \"${id}\"}
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

                    const neoSchema = makeAugmentedSchema({
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

                        if (type === "ID") {
                            expect((gqlResult.data as any).test as any).toEqual(id);
                        }

                        if (type === "Int") {
                            expect((gqlResult.data as any).test as any).toEqual(int);
                        }

                        if (type === "Float") {
                            expect((gqlResult.data as any).test as any).toEqual(float);
                        }

                        if (type === "Boolean") {
                            expect((gqlResult.data as any).test as any).toEqual(bool);
                        }

                        if (type === "Object") {
                            expect((gqlResult.data as any).test.id as any).toEqual(id);
                        }

                        if (type === "Node") {
                            expect((gqlResult.data as any).test.id as any).toEqual(id);
                        }
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
                        RETURN \"${id}\" + $id
                    """)
                }
            `;

            const mutation = `
                mutation {
                    test(id: "${id}")
                }
            `;

            const session = driver.session();

            const neoSchema = makeAugmentedSchema({
                typeDefs,
            });

            try {
                const gqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: mutation,
                    contextValue: { driver },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect((gqlResult.data as any).test as any).toEqual(id + id);
            } finally {
                await session.close();
            }
        });

        describe("should inject the jwt into cypher directive on queries and mutations", () => {
            test("query", async () => {
                const session = driver.session();

                const typeDefs = `
                    type Query {
                        userId: ID @cypher(statement: """
                            RETURN $jwt.sub
                        """)
                    }
                `;

                const userId = generate({
                    charset: "alphabetic",
                });

                const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

                const neoSchema = makeAugmentedSchema({ typeDefs });

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

                    expect(gqlResult.errors).toEqual(undefined);

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
                            RETURN $jwt.sub
                        """)
                    }
                `;

                const userId = generate({
                    charset: "alphabetic",
                });

                const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

                const neoSchema = makeAugmentedSchema({ typeDefs });

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

                    expect(gqlResult.errors).toEqual(undefined);

                    expect((gqlResult.data as any).userId).toEqual(userId);
                } finally {
                    await session.close();
                }
            });
        });

        test("should inject the jwt into cypher directive on fields", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    id: ID
                    userId: ID @cypher(statement: """
                        WITH $jwt.sub as a
                        RETURN a
                    """)
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const token = jsonwebtoken.sign({ sub: userId }, process.env.JWT_SECRET as string);

            const neoSchema = makeAugmentedSchema({ typeDefs, debug: true });

            const query = `
            {
                 Users(where: {id: "${userId}"}){
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
                    source: query as string,
                    contextValue: { driver, req },
                });

                expect(gqlResult.errors).toEqual(undefined);

                expect((gqlResult.data as any).Users[0].userId).toEqual(userId);
            } finally {
                await session.close();
            }
        });
    });
});
