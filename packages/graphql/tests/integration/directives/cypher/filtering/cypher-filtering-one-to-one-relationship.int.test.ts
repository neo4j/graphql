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

import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive filtering - One To One Relationship", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("1 to 1 relationship with single property filter", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                actor: ${Actor}!
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
                movie: ${Movie}!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded" })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a)-[:ACTED_IN]->(m3)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: {
                        actor: {
                            name: { eq: "Keanu Reeves" }
                        } 
                    }
                ) {
                    title
                    actor {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix",
                    actor: {
                        name: "Keanu Reeves",
                    },
                },
                {
                    title: "The Matrix Reloaded",
                    actor: {
                        name: "Keanu Reeves",
                    },
                },
                {
                    title: "The Matrix Revolutions",
                    actor: {
                        name: "Keanu Reeves",
                    },
                },
            ]),
        });
    });

    test("1 to 1 relationship with single property filter with non-deterministic result", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                actor: ${Actor}!
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
                movie: ${Movie}!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded" })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a)-[:ACTED_IN]->(m3)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Actor.plural}(
                    where: {
                        movie: {
                            title: { startsWith: "The Matrix" }
                        } 
                    }
                ) {
                    name
                    movie {
                        title
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([
                {
                    name: "Keanu Reeves",
                    movie: {
                        // The result is non-deterministic, so we can potentially match any of the movies
                        title: expect.toStartWith("The Matrix"),
                    },
                },
            ]),
        });
    });

    // TODO: {actor: null} was not migrated to {actors: {eq: null}}. Check if this is correct
    test("1 to 1 relationship with null filter", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                actor: ${Actor}
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
                movie: ${Movie}
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", released: 1999 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", released: 2003 })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions", released: 2003 })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: {
                        released: {eq: 2003},
                        actor: null 
                    }
                ) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix Revolutions",
                },
            ]),
        });
    });

    // TODO: {actor: null} was not migrated to {actors: {eq: null}}. Check if this is correct
    test("1 to 1 relationship with NOT null filter", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                actor: ${Actor}
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
                movie: ${Movie}
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", released: 1999 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", released: 2003 })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions", released: 2003 })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a2:${Actor} { name: "Jada Pinkett Smith" })
            CREATE (a2)-[:ACTED_IN]->(m3)
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: { AND: [{ released: { in: [2003] }, NOT: { actor: null } }] }
                ) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "The Matrix Reloaded",
                },
                {
                    title: "The Matrix Revolutions",
                },
            ]),
        });
    });

    test("1 to 1 relationship with auth filter on type PASS", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(filter: [{ where: { node: { directed_by: { name: { eq: "$jwt.custom_value" } } } } }]) {
                title: String
                released: Int
                directed_by: ${Person}!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:${Person})
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type ${Person} @node {
                name: String
                directed: ${Movie}!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = testHelper.createBearerToken("secret", { custom_value: "Lilly Wachowski" });

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
            CREATE (m:${Movie} { title: "The Matrix", released: 1999 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", released: 2003 })
            CREATE (a:${Person} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a5:${Person} { name: "Lilly Wachowski" })
            CREATE (a5)-[:DIRECTED]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Person.plural}(where: { directed: { title: { eq: "The Matrix" }} }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Person.plural]: [
                {
                    directed: {
                        title: "The Matrix",
                        directed_by: {
                            name: "Lilly Wachowski",
                        },
                    },
                },
            ],
        });
    });

    test("1 to 1 relationship with auth filter on type FAIL", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(filter: [{ where: { node: { directed_by: { name:{ eq: "$jwt.custom_value" }} } } }]) {
                title: String
                released: Int
                directed_by: ${Person}!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:${Person})
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type ${Person} @node {
                name: String
                directed: ${Movie}!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:${Movie})
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
            CREATE (m:${Movie} { title: "The Matrix", released: 1999 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", released: 2003 })
            CREATE (a:${Person} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a5:${Person} { name: "Lilly Wachowski" })
            CREATE (a5)-[:DIRECTED]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Person.plural}(where: { directed: { title: { eq: "The Matrix" } } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeTruthy();
    });

    test("1 to 1 relationship with auth filter on field PASS", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                directed_by: ${Person}! @authorization(filter: [{ where: { node: { directed_by: { name: { eq: "$jwt.custom_value" } } } } }])
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:${Person})
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type ${Person} @node {
                name: String
                directed: ${Movie}!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = testHelper.createBearerToken("secret", { custom_value: "Lilly Wachowski" });

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
            CREATE (m:${Movie} { title: "The Matrix", released: 1999 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", released: 2003 })
            CREATE (a:${Person} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a5:${Person} { name: "Lilly Wachowski" })
            CREATE (a5)-[:DIRECTED]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Person.plural}(where: { directed: { title: { eq: "The Matrix" } } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Person.plural]: [
                {
                    directed: {
                        title: "The Matrix",
                        directed_by: {
                            name: "Lilly Wachowski",
                        },
                    },
                },
            ],
        });
    });

    test("1 to 1 relationship with auth filter on field FAIL", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                directed_by: ${Person}! @authorization(filter: [{ where: { node: { directed_by: { name: { eq: "$jwt.custom_value" } } } } }])
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:${Person})
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type ${Person} @node {
                name: String
                directed: ${Movie}!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:${Movie})
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
            CREATE (m:${Movie} { title: "The Matrix", released: 1999 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", released: 2003 })
            CREATE (a:${Person} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a5:${Person} { name: "Lilly Wachowski" })
            CREATE (a5)-[:DIRECTED]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Person.plural}(where: { directed: { title: { eq: "The Matrix" } } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeTruthy();
    });

    test("1 to 1 relationship with auth validate type PASS", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(validate: [{ where: { node: { directed_by: { name: { eq: "$jwt.custom_value" } } } } }]) {
                title: String
                released: Int
                directed_by: ${Person}!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:${Person})
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type ${Person} @node {
                name: String
                directed: ${Movie}!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = testHelper.createBearerToken("secret", { custom_value: "Lilly Wachowski" });

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
            CREATE (m:${Movie} { title: "The Matrix", released: 1999 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", released: 2003 })
            CREATE (a:${Person} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a5:${Person} { name: "Lilly Wachowski" })
            CREATE (a5)-[:DIRECTED]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Person.plural}(where: { directed: { title: { eq: "The Matrix" } } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Person.plural]: [
                {
                    directed: {
                        title: "The Matrix",
                        directed_by: {
                            name: "Lilly Wachowski",
                        },
                    },
                },
            ],
        });
    });

    test("1 to 1 relationship with auth validate type FAIL", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node @authorization(validate: [{ where: { node: { directed_by: { name: { eq: "$jwt.custom_value" } } } } }]) {
                title: String
                released: Int
                directed_by: ${Person}!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:${Person})
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type ${Person} @node {
                name: String
                directed: ${Movie}!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = testHelper.createBearerToken("secret", { custom_value: "Something Wrong" });

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
            CREATE (m:${Movie} { title: "The Matrix", released: 1999 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", released: 2003 })
            CREATE (a:${Person} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a5:${Person} { name: "Lilly Wachowski" })
            CREATE (a5)-[:DIRECTED]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Person.plural}(where: { directed: { title: { eq: "The Matrix" } } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Forbidden");
    });

    test("1 to 1 relationship with auth validate field PASS", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                directed_by: ${Person}! @authorization(validate: [{ where: { node: { directed_by: { name_EQ: "$jwt.custom_value" } } } }])
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:${Person})
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type ${Person} @node {
                name: String
                directed: ${Movie}!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = testHelper.createBearerToken("secret", { custom_value: "Lilly Wachowski" });

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
            CREATE (m:${Movie} { title: "The Matrix", released: 1999 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", released: 2003 })
            CREATE (a:${Person} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a5:${Person} { name: "Lilly Wachowski" })
            CREATE (a5)-[:DIRECTED]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Person.plural}(where: { directed: { title: { eq: "The Matrix" } } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Person.plural]: [
                {
                    directed: {
                        title: "The Matrix",
                        directed_by: {
                            name: "Lilly Wachowski",
                        },
                    },
                },
            ],
        });
    });

    test("1 to 1 relationship with auth validate field FAIL", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                directed_by: ${Person}! @authorization(validate: [{ where: { node: { directed_by: { name: { eq: "$jwt.custom_value" } } } } }])
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:${Person})
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type ${Person} @node {
                name: String
                directed: ${Movie}!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = testHelper.createBearerToken("secret", { custom_value: "Something Wrong" });

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
            CREATE (m:${Movie} { title: "The Matrix", released: 1999 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", released: 2003 })
            CREATE (a:${Person} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a5:${Person} { name: "Lilly Wachowski" })
            CREATE (a5)-[:DIRECTED]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Person.plural}(where: { directed: { title: { eq: "The Matrix" } } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe("Forbidden");
    });

    test("1 to 1 relationship with nested selection", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
                directed_by: ${Person}!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:${Person})
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type ${Person} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                directed: ${Movie}!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", released: 1999 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", released: 2003 })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions", released: 2003 })
            CREATE (a:${Person} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a)-[:ACTED_IN]->(m3)
            CREATE (a2:${Person} { name: "Jada Pinkett Smith" })
            CREATE (a2)-[:ACTED_IN]->(m2)
            CREATE (a2)-[:ACTED_IN]->(m3)
            CREATE (a3:${Person} { name: "Director Person" })
            CREATE (a3)-[:DIRECTED]->(m)
            CREATE (a4:${Person} { name: "Lana Wachowski" })
            CREATE (a4)-[:DIRECTED]->(m2)
            CREATE (a5:${Person} { name: "Lilly Wachowski" })
            CREATE (a5)-[:DIRECTED]->(m3)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Person.plural}(where: { directed: { title: { eq: "The Matrix" } } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                        actors {
                            name
                            movies {
                                directed_by {
                                    name
                                }
                                title
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Person.plural]: [
                {
                    directed: {
                        title: "The Matrix",
                        directed_by: {
                            name: "Director Person",
                        },
                        actors: expect.toIncludeSameMembers([
                            {
                                name: "Keanu Reeves",
                                movies: expect.toIncludeSameMembers([
                                    {
                                        directed_by: {
                                            name: "Director Person",
                                        },
                                        title: "The Matrix",
                                    },
                                    {
                                        directed_by: {
                                            name: "Lana Wachowski",
                                        },
                                        title: "The Matrix Reloaded",
                                    },
                                    {
                                        directed_by: {
                                            name: "Lilly Wachowski",
                                        },
                                        title: "The Matrix Revolutions",
                                    },
                                ]),
                            },
                        ]),
                    },
                },
            ],
        });
    });

    test("1 to 1 relationship with connection", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                released: Int
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
                directed_by: ${Person}!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:${Person})
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type ${Person} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                directed: ${Movie}!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:${Movie})
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix", released: 1999 })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded", released: 2003 })
            CREATE (m3:${Movie} { title: "The Matrix Revolutions", released: 2003 })
            CREATE (a:${Person} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            CREATE (a)-[:ACTED_IN]->(m2)
            CREATE (a)-[:ACTED_IN]->(m3)
            CREATE (a2:${Person} { name: "Jada Pinkett Smith" })
            CREATE (a2)-[:ACTED_IN]->(m2)
            CREATE (a2)-[:ACTED_IN]->(m3)
            CREATE (a5:${Person} { name: "Lilly Wachowski" })
            CREATE (a5)-[:DIRECTED]->(m)
            CREATE (a5)-[:DIRECTED]->(m2)
            CREATE (a5)-[:DIRECTED]->(m3)
            `,
            {}
        );

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { directed_by: { name: { eq: "Lilly Wachowski"}}, title: { endsWith: "Matrix" }}) {
                    actorsConnection {
                        totalCount
                        edges {
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    ["actorsConnection"]: {
                        totalCount: 1,
                        edges: [
                            {
                                node: {
                                    name: "Keanu Reeves",
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});
