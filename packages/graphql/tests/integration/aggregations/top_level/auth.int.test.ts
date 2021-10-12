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
import { graphql } from "graphql";
import { generate } from "randomstring";
import pluralize from "pluralize";
import camelCase from "camelcase";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";

describe("aggregations-top_level-auth", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw forbidden when incorrect allow on aggregate count", async () => {
        const session = driver.session({ defaultAccessMode: "WRITE" });

        const randomType = `${generate({
            charset: "alphabetic",
            readable: true,
        })}Movie`;

        const pluralRandomType = pluralize(camelCase(randomType));

        const typeDefs = `
            type ${randomType} {
                id: ID
            }

            extend type ${randomType} @auth(rules: [{ allow: { id: "$jwt.sub" } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${pluralRandomType}Aggregate {
                    count
                }
            }
        `;

        const secret = "secret";

        const token = jsonwebtoken.sign(
            {
                roles: [],
                sub: "invalid",
            },
            secret
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        try {
            await session.run(`
                CREATE (:${randomType} {id: "${userId}"})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should append auth where to predicate and return post count for this user", async () => {
        const session = driver.session({ defaultAccessMode: "WRITE" });

        const typeDefs = `
            type User {
                id: ID
                posts: [Post] @relationship(type: "POSTED", direction: OUT)
            }

            type Post {
                content: String
                creator: User @relationship(type: "POSTED", direction: IN)
            }

            extend type Post @auth(rules: [{ where: { creator: { id: "$jwt.sub" } } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                postsAggregate {
                    count
                }
            }
        `;

        const secret = "secret";

        const token = jsonwebtoken.sign(
            {
                roles: [],
                sub: userId,
            },
            secret
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        try {
            await session.run(`
                CREATE (:User {id: "${userId}"})-[:POSTED]->(:Post {content: randomUUID()})
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

            expect(gqlResult.data).toEqual({
                postsAggregate: {
                    count: 1,
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should throw when invalid allow when aggregating a Int field", async () => {
        const session = driver.session({ defaultAccessMode: "WRITE" });

        const typeDefs = `
            type Movie {
                id: ID
                director: Person @relationship(type: "DIRECTED", direction: IN)
                imdbRatingInt: Int @auth(rules: [{ allow: { director: { id: "$jwt.sub" } } }])
            }

            type Person {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                moviesAggregate(where: {id: "${movieId}"}) {
                    imdbRatingInt {
                        min
                        max
                    }
                }
            }
        `;

        const secret = "secret";

        const token = jsonwebtoken.sign(
            {
                roles: [],
                sub: "invalid",
            },
            secret
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        try {
            await session.run(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", imdbRatingInt: rand()})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should throw when invalid allow when aggregating a ID field", async () => {
        const session = driver.session({ defaultAccessMode: "WRITE" });

        const typeDefs = `
            type Movie {
                id: ID
                director: Person @relationship(type: "DIRECTED", direction: IN)
                someId: ID @auth(rules: [{ allow: { director: { id: "$jwt.sub" } } }])
            }

            type Person {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                moviesAggregate(where: {id: "${movieId}"}) {
                    someId {
                        shortest
                        longest
                    }
                }
            }
        `;

        const secret = "secret";

        const token = jsonwebtoken.sign(
            {
                roles: [],
                sub: "invalid",
            },
            secret
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        try {
            await session.run(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", someId: "some-random-string"})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should throw when invalid allow when aggregating a String field", async () => {
        const session = driver.session({ defaultAccessMode: "WRITE" });

        const typeDefs = `
            type Movie {
                id: ID
                director: Person @relationship(type: "DIRECTED", direction: IN)
                someString: String @auth(rules: [{ allow: { director: { id: "$jwt.sub" } } }])
            }

            type Person {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                moviesAggregate(where: {id: "${movieId}"}) {
                    someString {
                        shortest
                        longest
                    }
                }
            }
        `;

        const secret = "secret";

        const token = jsonwebtoken.sign(
            {
                roles: [],
                sub: "invalid",
            },
            secret
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        try {
            await session.run(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", someString: "some-random-string"})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should throw when invalid allow when aggregating a Float field", async () => {
        const session = driver.session({ defaultAccessMode: "WRITE" });

        const typeDefs = `
            type Movie {
                id: ID
                director: Person @relationship(type: "DIRECTED", direction: IN)
                imdbRatingFloat: Float @auth(rules: [{ allow: { director: { id: "$jwt.sub" } } }])
            }

            type Person {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                moviesAggregate(where: {id: "${movieId}"}) {
                    imdbRatingFloat {
                        min
                        max
                    }
                }
            }
        `;

        const secret = "secret";

        const token = jsonwebtoken.sign(
            {
                roles: [],
                sub: "invalid",
            },
            secret
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        try {
            await session.run(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", imdbRatingFloat: rand()})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should throw when invalid allow when aggregating a BigInt field", async () => {
        const session = driver.session({ defaultAccessMode: "WRITE" });

        const typeDefs = `
            type Movie {
                id: ID
                director: Person @relationship(type: "DIRECTED", direction: IN)
                imdbRatingBigInt: BigInt @auth(rules: [{ allow: { director: { id: "$jwt.sub" } } }])
            }

            type Person {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                moviesAggregate(where: {id: "${movieId}"}) {
                    imdbRatingBigInt {
                        min
                        max
                    }
                }
            }
        `;

        const secret = "secret";

        const token = jsonwebtoken.sign(
            {
                roles: [],
                sub: "invalid",
            },
            secret
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        try {
            await session.run(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", imdbRatingBigInt: rand()})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should throw when invalid allow when aggregating a DateTime field", async () => {
        const session = driver.session({ defaultAccessMode: "WRITE" });

        const typeDefs = `
            type Movie {
                id: ID
                director: Person @relationship(type: "DIRECTED", direction: IN)
                createdAt: DateTime @auth(rules: [{ allow: { director: { id: "$jwt.sub" } } }])
            }

            type Person {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                moviesAggregate(where: {id: "${movieId}"}) {
                    createdAt {
                        min
                        max
                    }
                }
            }
        `;

        const secret = "secret";

        const token = jsonwebtoken.sign(
            {
                roles: [],
                sub: "invalid",
            },
            secret
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        try {
            await session.run(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", createdAt: datetime()})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });

    test("should throw when invalid allow when aggregating a Duration field", async () => {
        const session = driver.session({ defaultAccessMode: "WRITE" });

        const typeDefs = `
            type Movie {
                id: ID
                director: Person @relationship(type: "DIRECTED", direction: IN)
                screenTime: Duration @auth(rules: [{ allow: { director: { id: "$jwt.sub" } } }])
            }

            type Person {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                moviesAggregate(where: {id: "${movieId}"}) {
                    screenTime {
                        min
                        max
                    }
                }
            }
        `;

        const secret = "secret";

        const token = jsonwebtoken.sign(
            {
                roles: [],
                sub: "invalid",
            },
            secret
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        try {
            await session.run(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", createdAt: datetime()})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req },
            });

            expect((gqlResult.errors as any[])[0].message).toEqual("Forbidden");
        } finally {
            await session.close();
        }
    });
});
