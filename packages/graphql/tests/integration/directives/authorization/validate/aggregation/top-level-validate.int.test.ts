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
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("aggregations-top_level authorization", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    afterEach(async () => {
        await testHelper.close();
    });

    test("should throw forbidden when incorrect allow on aggregate count", async () => {
        const randomType = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${randomType.name} @node {
                id: ID
            }

            extend type ${randomType.name} @authorization(validate: [ { operations: [AGGREGATE], when: BEFORE, where: { node: { id: { eq: "$jwt.sub" } } } } ])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                ${randomType.operations.connection} {
                    aggregate {
                        count {
                            nodes
                        }
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
                CREATE (:${randomType.name} {id: "${userId}"})
                CREATE (:${randomType.name} {id: "other-user"})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when invalid allow when aggregating a Int field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                id: ID
                director: [${Person}!]! @relationship(type: "DIRECTED", direction: IN)
                imdbRatingInt: Int
                    @authorization(
                        validate: [{ when: BEFORE, where: { node: { director: { single: { id: { eq: "$jwt.sub" } } } } } }]
                    )
            }

            type ${Person} @node {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { id: { eq: "${movieId}" } }) {
                    aggregate {
                        node {
                            imdbRatingInt {
                                min
                                max
                            }
                        }
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
                CREATE (:${Person.name} {id: "${userId}"})-[:DIRECTED]->(:${Movie} {id: "${movieId}", imdbRatingInt: 8})
                CREATE (:${Person.name} {id: "other-user"})-[:DIRECTED]->(:${Movie} {id: "other-movie", imdbRatingInt: 5})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when invalid allow when aggregating a String field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                id: ID
                director: [${Person}!]! @relationship(type: "DIRECTED", direction: IN)
                someString: String
                    @authorization(
                        validate: [{ when: BEFORE, where: { node: { director: { single: { id: { eq: "$jwt.sub" } } } } } }]
                    )
            }

            type ${Person} @node {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { id: { eq: "${movieId}" } }) {
                    aggregate {
                        node {
                            someString {
                                shortest
                                longest
                            }
                        }
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
                CREATE (:${Person.name} {id: "${userId}"})-[:DIRECTED]->(:${Movie.name} {id: "${movieId}", someString: "authorized movie"})
                CREATE (:${Person.name} {id: "other-user"})-[:DIRECTED]->(:${Movie.name} {id: "other-movie", someString: "unauthorized movie"})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when invalid allow when aggregating a Float field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                id: ID
                director: [${Person}!]! @relationship(type: "DIRECTED", direction: IN)
                imdbRatingFloat: Float
                    @authorization(
                        validate: [{ when: BEFORE, where: { node: { director: { single: { id: { eq: "$jwt.sub" } } } } } }]
                    )
            }

            type ${Person} @node {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { id: { eq: "${movieId}" } }) {
                    aggregate {
                        node {
                            imdbRatingFloat {
                                min
                                max
                            }
                        }
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
                CREATE (:${Person.name} {id: "${userId}"})-[:DIRECTED]->(:${Movie.name} {id: "${movieId}", imdbRatingFloat: 8.5})
                CREATE (:${Person.name} {id: "other-user"})-[:DIRECTED]->(:${Movie.name} {id: "other-movie", imdbRatingFloat: 5.5})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when invalid allow when aggregating a BigInt field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                id: ID
                director: [${Person}!]! @relationship(type: "DIRECTED", direction: IN)
                imdbRatingBigInt: BigInt
                    @authorization(
                        validate: [{ when: BEFORE, where: { node: { director: { single: { id: { eq: "$jwt.sub" } } } } } }]
                    )
            }

            type ${Person} @node {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { id: { eq: "${movieId}" } }) {
                    aggregate {
                        node {
                            imdbRatingBigInt {
                                min
                                max
                            }
                        }
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
                CREATE (:${Person.name} {id: "${userId}"})-[:DIRECTED]->(:${Movie.name} {id: "${movieId}", imdbRatingBigInt: 1000000000})
                CREATE (:${Person.name} {id: "other-user"})-[:DIRECTED]->(:${Movie.name} {id: "other-movie", imdbRatingBigInt: 500000000})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when invalid allow when aggregating a DateTime field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                id: ID
                director: [${Person}!]! @relationship(type: "DIRECTED", direction: IN)
                createdAt: DateTime
                    @authorization(
                        validate: [{ when: BEFORE, where: { node: { director: { single: { id: { eq: "$jwt.sub" } } } } } }]
                    )
            }

            type ${Person} @node {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { id: { eq: "${movieId}" } }) {
                    aggregate {
                        node {
                            createdAt {
                                min
                                max
                            }
                        }
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

        const now = new Date().toISOString();
        const yesterday = new Date(Date.now() - 86400000).toISOString();

        await testHelper.executeCypher(`
                CREATE (:${Person.name} {id: "${userId}"})-[:DIRECTED]->(:${Movie.name} {id: "${movieId}", createdAt: datetime("${now}")})
                CREATE (:${Person.name} {id: "other-user"})-[:DIRECTED]->(:${Movie.name} {id: "other-movie", createdAt: datetime("${yesterday}")})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("should throw when invalid allow when aggregating a Duration field", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                id: ID
                director: [${Person}!]! @relationship(type: "DIRECTED", direction: IN)
                screenTime: Duration
                    @authorization(
                        validate: [{ when: BEFORE, where: { node: { director: { single: { id: { eq: "$jwt.sub" } } } } } }]
                    )
            }

            type ${Person} @node {
                id: ID
            }
        `;

        const movieId = generate({
            charset: "alphabetic",
        });

        const userId = generate({
            charset: "alphabetic",
        });

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { id: { eq: "${movieId}" } }) {
                    aggregate {
                        node {
                            screenTime {
                                min
                                max
                            }
                        }
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
                CREATE (:${Person.name} {id: "${userId}"})-[:DIRECTED]->(:${Movie.name} {id: "${movieId}", screenTime: duration("PT2H30M")})
                CREATE (:${Person.name} {id: "other-user"})-[:DIRECTED]->(:${Movie.name} {id: "other-movie", screenTime: duration("PT1H45M")})
            `);

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });
});
