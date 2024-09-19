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

describe("cypher directive filtering", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("With relationship filter (non-Cypher field)", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Movie} @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural}(
                    where: {
                        custom_field_EQ: "hello world!"
                        actors_SOME: {
                            name_EQ: "Keanu Reeves"
                        } 
                    }
                ) {
                    custom_field
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    custom_field: "hello world!",
                    title: "The Matrix",
                    actors: [
                        {
                            name: "Keanu Reeves",
                        },
                    ],
                },
            ],
        });
    });

    test("In a nested filter", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Movie} @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = `
            query {
                ${Actor.plural} {
                    name
                    movies(where: { custom_field_EQ: "hello world!"}) {
                        title
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Actor.plural]: [
                {
                    name: "Keanu Reeves",
                    movies: [
                        {
                            title: "The Matrix",
                        },
                    ],
                },
            ],
        });
    });

    test("With a nested filter", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Movie} @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural}(where: { custom_field_EQ: "hello world!" }) {
                    title
                    actors(where: { name_EQ: "Keanu Reeves" }) {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    actors: [
                        {
                            name: "Keanu Reeves",
                        },
                    ],
                },
            ],
        });
    });

    test("With two cypher fields", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Movie} @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                another_custom_field: Int
                    @cypher(
                        statement: """
                        RETURN 100 AS i
                        """
                        columnName: "i"
                    )
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                another_custom_field: String
                    @cypher(
                        statement: """
                        RETURN "goodbye!" AS s
                        """
                        columnName: "s"
                    )
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural}(where: { custom_field_EQ: "hello world!", another_custom_field_GT: 50 }) {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    actors: [
                        {
                            name: "Keanu Reeves",
                        },
                    ],
                },
            ],
        });
    });

    test("With two cypher fields, one nested", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Movie} @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                another_custom_field: String
                    @cypher(
                        statement: """
                        RETURN "goodbye!" AS s
                        """
                        columnName: "s"
                    )
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural}(where: { custom_field_EQ: "hello world!" }) {
                    title
                    actors(where: { another_custom_field_EQ: "goodbye!" name_EQ: "Keanu Reeves" }) {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    actors: [
                        {
                            name: "Keanu Reeves",
                        },
                    ],
                },
            ],
        });
    });
});
