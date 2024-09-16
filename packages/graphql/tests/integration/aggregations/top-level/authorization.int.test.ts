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

import { generate } from "randomstring";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { TestHelper } from "../../../utils/tests-helper";

describe("aggregations-top_level authorization", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    afterEach(async () => {
        await testHelper.close();
    });

    test("should throw forbidden when incorrect allow on aggregate count", async () => {
        const randomType = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} {
                id: ID
            }

            extend type ${randomType.name} @authorization(validate: [ { operations: [AGGREGATE], when: BEFORE, where: { node: { id: "$jwt.sub" } } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = `
            {
                ${randomType.operations.aggregate} {
                    count
                }
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await testHelper.executeCypher(`
                CREATE (:${randomType.name} {id: "${userId}"})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should append auth where to predicate and return post count for this user", async () => {
        const typeDefs = `
            type User {
                id: ID
                posts: [Post!]! @relationship(type: "POSTED", direction: OUT)
            }

            type Post {
                content: String
                creator: User! @relationship(type: "POSTED", direction: IN)
            }

            extend type Post @authorization(filter: [{ operations: [AGGREGATE], where: { node: { creator: { id: "$jwt.sub" } } } }])
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await testHelper.executeCypher(`
                CREATE (:User {id: "${userId}"})-[:POSTED]->(:Post {content: randomUUID()})
            `);

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            postsAggregate: {
                count: 1,
            },
        });
    });

    test("should throw when invalid allow when aggregating a Int field", async () => {
        const typeDefs = `
            type Movie {
                id: ID
                director: Person! @relationship(type: "DIRECTED", direction: IN)
                imdbRatingInt: Int  @authorization(validate: [ { when: BEFORE, where: { node: { director: { id: "$jwt.sub" } } } }])
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await testHelper.executeCypher(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", imdbRatingInt: rand()})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when invalid allow when aggregating a ID field", async () => {
        const typeDefs = `
            type Movie {
                id: ID
                director: Person! @relationship(type: "DIRECTED", direction: IN)
                someId: ID  @authorization(validate: [ { when: BEFORE, where: { node: { director: { id: "$jwt.sub" } } } }])
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await testHelper.executeCypher(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", someId: "some-random-string"})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when invalid allow when aggregating a String field", async () => {
        const typeDefs = `
            type Movie {
                id: ID
                director: Person! @relationship(type: "DIRECTED", direction: IN)
                someString: String  @authorization(validate: [ { when: BEFORE, where: { node: { director: { id: "$jwt.sub" } } } }])
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await testHelper.executeCypher(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", someString: "some-random-string"})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when invalid allow when aggregating a Float field", async () => {
        const typeDefs = `
            type Movie {
                id: ID
                director: Person! @relationship(type: "DIRECTED", direction: IN)
                imdbRatingFloat: Float  @authorization(validate: [ {  when: BEFORE, where: { node: { director: { id: "$jwt.sub" } } } }])              
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await testHelper.executeCypher(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", imdbRatingFloat: rand()})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when invalid allow when aggregating a BigInt field", async () => {
        const typeDefs = `
            type Movie {
                id: ID
                director: Person! @relationship(type: "DIRECTED", direction: IN)
                imdbRatingBigInt: BigInt @authorization(validate: [ {  when: BEFORE, where: { node: { director: { id: "$jwt.sub" } } } }])
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await testHelper.executeCypher(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", imdbRatingBigInt: rand()})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when invalid allow when aggregating a DateTime field", async () => {
        const typeDefs = `
            type Movie {
                id: ID
                director: Person! @relationship(type: "DIRECTED", direction: IN)
                createdAt: DateTime  @authorization(validate: [ { when: BEFORE, where: { node: { director: { id: "$jwt.sub" } } } }])
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await testHelper.executeCypher(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", createdAt: datetime()})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when invalid allow when aggregating a Duration field", async () => {
        const typeDefs = `
            type Movie {
                id: ID
                director: Person! @relationship(type: "DIRECTED", direction: IN)
                screenTime: Duration  @authorization(validate: [ { when: BEFORE, where: { node: { director: { id: "$jwt.sub" } } } }])
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await testHelper.executeCypher(`
                CREATE (:Person {id: "${userId}"})-[:DIRECTED]->(:Movie {id: "${movieId}", createdAt: datetime()})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });
});
