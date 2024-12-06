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

import { TestHelper } from "../../../../../utils/tests-helper";

describe("cypher directive filtering - relationship auth filter", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("relationship with auth filter on type PASS", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(filter: [{ where: { node: { actors_SOME: { name_EQ: "$jwt.custom_value" } } } }]) {
                title: String
                rating: Float
                actors: [${Actor}!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:${Actor})
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = testHelper.createBearerToken("secret", { custom_value: "Jada Pinkett Smith" });

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", rating: 10.0 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", rating: 8.0 })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions", rating: 6.0 })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a)-[:ACTED_IN]->(m3)
            CREATE (a2:${Actor} { name: "Carrie-Anne Moss" })
            CREATE (a2)-[:ACTED_IN]->(m)
            CREATE (a2)-[:ACTED_IN]->(m2)
            CREATE (a2)-[:ACTED_IN]->(m3)
            CREATE (a3:${Actor} { name: "Jada Pinkett Smith" })
            CREATE (a3)-[:ACTED_IN]->(m2)
            CREATE (a3)-[:ACTED_IN]->(m3)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection}(
                    where: {
                        rating_GT: 7.0
                    }
                ) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            title: "The Matrix Reloaded",
                        },
                    },
                ]),
            },
        });
    });

    test("relationship with auth filter on type FAIL", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(filter: [{ where: { node: { actors_SOME: { name_EQ: "$jwt.custom_value" } } } }]) {
                title: String
                rating: Float
                actors: [${Actor}!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:${Actor})
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = testHelper.createBearerToken("secret", { custom_value: "Something Incorrect" });

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", rating: 10.0 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", rating: 8.0 })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions", rating: 6.0 })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a)-[:ACTED_IN]->(m3)
            CREATE (a2:${Actor} { name: "Carrie-Anne Moss" })
            CREATE (a2)-[:ACTED_IN]->(m)
            CREATE (a2)-[:ACTED_IN]->(m2)
            CREATE (a2)-[:ACTED_IN]->(m3)
            CREATE (a3:${Actor} { name: "Jada Pinkett Smith" })
            CREATE (a3)-[:ACTED_IN]->(m2)
            CREATE (a3)-[:ACTED_IN]->(m3)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection}(
                    where: {
                        rating_GT: 7.0
                    }
                ) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.operations.connection]: {
                edges: [],
            },
        });
    });

    test("relationship with auth validate on type PASS", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(validate: [{ where: { node: { actors_SOME: { name_EQ: "$jwt.custom_value" } } } }]) {
                title: String
                rating: Float
                actors: [${Actor}!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:${Actor})
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = testHelper.createBearerToken("secret", { custom_value: "Jada Pinkett Smith" });

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", rating: 10.0 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", rating: 8.0 })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions", rating: 6.0 })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a)-[:ACTED_IN]->(m3)
            CREATE (a2:${Actor} { name: "Carrie-Anne Moss" })
            CREATE (a2)-[:ACTED_IN]->(m)
            CREATE (a2)-[:ACTED_IN]->(m2)
            CREATE (a2)-[:ACTED_IN]->(m3)
            CREATE (a3:${Actor} { name: "Jada Pinkett Smith" })
            CREATE (a3)-[:ACTED_IN]->(m2)
            CREATE (a3)-[:ACTED_IN]->(m3)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection}(
                    where: {
                        rating_LT: 7.0
                    }
                ) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            title: "The Matrix Revolutions",
                        },
                    },
                ]),
            },
        });
    });

    test("relationship with auth validate on type FAIL", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(validate: [{ where: { node: { actors_SOME: { name_EQ: "$jwt.custom_value" } } } }]) {
                title: String
                rating: Float
                actors: [${Actor}!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:${Actor})
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = testHelper.createBearerToken("secret", { custom_value: "Jada Pinkett Smith" });

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", rating: 10.0 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", rating: 8.0 })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions", rating: 6.0 })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a)-[:ACTED_IN]->(m3)
            CREATE (a2:${Actor} { name: "Carrie-Anne Moss" })
            CREATE (a2)-[:ACTED_IN]->(m)
            CREATE (a2)-[:ACTED_IN]->(m2)
            CREATE (a2)-[:ACTED_IN]->(m3)
            CREATE (a3:${Actor} { name: "Jada Pinkett Smith" })
            CREATE (a3)-[:ACTED_IN]->(m2)
            CREATE (a3)-[:ACTED_IN]->(m3)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection}(
                    where: {
                        rating_GT: 7.0
                    }
                ) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Forbidden");
    });
});
