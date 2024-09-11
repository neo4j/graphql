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

import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("cypher directive filtering", () => {
    let CustomType: UniqueType;

    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    beforeEach(() => {
        CustomType = testHelper.createUniqueType("CustomType");
    });

    test.each([
        {
            title: "Int cypher field: exact match",
            filter: `special_count: 1`,
        },
        {
            title: "Int cypher field: GT",
            filter: `special_count_GT: 0`,
        },
        {
            title: "Int cypher field: GTE",
            filter: `special_count_GTE: 1`,
        },
        {
            title: "Int cypher field: LT",
            filter: `special_count_LT: 2`,
        },
        {
            title: "Int cypher field: LTE",
            filter: `special_count_LTE: 2`,
        },
        {
            title: "Int cypher field: IN",
            filter: `special_count_IN: [1, 2, 3]`,
        },
    ] as const)("$title", async ({ filter }) => {
        const typeDefs = `
            type ${CustomType} @node {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:${CustomType})
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "test" })`, {});

        const query = `
            query {
                ${CustomType.plural}(where: { ${filter} }) {
                    special_count
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    special_count: 1,
                },
            ],
        });
    });

    test.each([
        {
            title: "String cypher field: exact match",
            filter: `special_word: "test"`,
        },
        {
            title: "String cypher field: CONTAINS",
            filter: `special_word_CONTAINS: "es"`,
        },
        {
            title: "String cypher field: ENDS_WITH",
            filter: `special_word_ENDS_WITH: "est"`,
        },
        {
            title: "String cypher field: STARTS_WITH",
            filter: `special_word_STARTS_WITH: "tes"`,
        },
        {
            title: "String cypher field: IN",
            filter: `special_word_IN: ["test", "test2"]`,
        },
    ] as const)("$title", async ({ filter }) => {
        const typeDefs = `
            type ${CustomType} @node {
                title: String
                special_word: String
                    @cypher(
                        statement: """
                        RETURN "test" as s
                        """
                        columnName: "s"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "test" })`, {});

        const query = `
            query {
                ${CustomType.plural}(where: { ${filter} }) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    title: "test",
                },
            ],
        });
    });

    test("Int cypher field AND String title field", async () => {
        const typeDefs = `
            type ${CustomType} @node {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:${CustomType})
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            UNWIND [
                {title: 'CustomType One' },
                {title: 'CustomType Two' },
                {title: 'CustomType Three' }
            ] AS CustomTypeData
            CREATE (m:${CustomType})
            SET m = CustomTypeData;
        `,
            {}
        );

        const query = `
            query {
                ${CustomType.plural}(where: { special_count_GTE: 1, title: "CustomType One" }) {
                    special_count
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    special_count: 3,
                },
            ],
        });
    });

    test("unmatched Int cypher field AND String title field", async () => {
        const typeDefs = `
            type ${CustomType} @node {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:${CustomType})
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(
            `
            UNWIND [
                {title: 'CustomType One' },
                {title: 'CustomType Two' },
                {title: 'CustomType Three' }
            ] AS CustomTypeData
            CREATE (m:${CustomType})
            SET m = CustomTypeData;
        `,
            {}
        );

        const query = `
            query {
                ${CustomType.plural}(where: { special_count_GTE: 1, title: "CustomType Unknown" }) {
                    special_count
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [],
        });
    });

    test("Int cypher field, selecting String title field", async () => {
        const typeDefs = `
            type ${CustomType} @node {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:${CustomType})
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "test" })`, {});

        const query = `
            query {
                ${CustomType.plural}(where: { special_count_GTE: 1 }) {
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    title: "test",
                },
            ],
        });
    });

    test("Point cypher field", async () => {
        const typeDefs = `
            type ${CustomType} @node {
                title: String
                special_location: Point
                    @cypher(
                        statement: """
                        RETURN point({ longitude: 1.0, latitude: 1.0 }) AS l
                        """
                        columnName: "l"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "test" })`, {});

        const query = `
            query {
                ${CustomType.plural}(
                    where: {
                        special_location_DISTANCE: {
                            point: { latitude: 1, longitude: 1 }
                            distance: 0
                        }
                    }
                ) {
                    title
                    special_location {
                        latitude
                        longitude
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    special_location: {
                        latitude: 1,
                        longitude: 1,
                    },
                    title: "test",
                },
            ],
        });
    });

    test("CartesianPoint cypher field", async () => {
        const typeDefs = `
            type ${CustomType} @node {
                title: String
                special_location: CartesianPoint
                    @cypher(
                        statement: """
                        RETURN point({ x: 1.0, y: 1.0, z: 1.0 }) AS l
                        """
                        columnName: "l"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "test" })`, {});

        const query = `
            query {
                ${CustomType.plural}(
                    where: {
                        special_location_DISTANCE: {
                            point: { x: 1, y: 1, z: 2 }
                            distance: 1
                        }
                    }
                ) {
                    title
                    special_location {
                        x
                        y
                        z
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    special_location: {
                        x: 1,
                        y: 1,
                        z: 1,
                    },
                    title: "test",
                },
            ],
        });
    });

    test("DateTime cypher field", async () => {
        const typeDefs = `
            type ${CustomType} @node {
                title: String
                special_time: DateTime
                    @cypher(
                        statement: """
                        RETURN datetime("2024-09-03T15:30:00Z") AS t
                        """
                        columnName: "t"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        await testHelper.executeCypher(`CREATE (m:${CustomType} { title: "test" })`, {});

        const query = `
            query {
                ${CustomType.plural}(
                    where: {
                        special_time_GT: "2024-09-02T00:00:00Z"
                    }
                ) {
                    special_time
                    title
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [CustomType.plural]: [
                {
                    special_time: "2024-09-03T15:30:00.000Z",
                    title: "test",
                },
            ],
        });
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
                        custom_field: "hello world!"
                        actors_SOME: {
                            name: "Keanu Reeves"
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
                    movies(where: { custom_field: "hello world!"}) {
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
                ${Movie.plural}(where: { custom_field: "hello world!" }) {
                    title
                    actors(where: { name: "Keanu Reeves" }) {
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

    test("With authorization (custom Cypher field)", async () => {
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
                    @authorization(filter: [{ where: { node: { title: "$jwt.title" } } }])
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken("secret", { title: "The Matrix" });

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
                ${Movie.plural}(where: { custom_field: "hello world!" }) {
                    title
                    custom_field
                    actors {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    custom_field: "hello world!",
                    actors: [
                        {
                            name: "Keanu Reeves",
                        },
                    ],
                },
            ],
        });
    });

    test("With authorization (not custom Cypher field)", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Movie} @node {
                title: String @authorization(filter: [{ where: { node: { title: "$jwt.title" } } }])
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken("secret", { title: "The Matrix" });

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
                ${Movie.plural}(where: { custom_field: "hello world!" }) {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

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

    test("With sorting", async () => {
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
            `
            CREATE (m1:${Movie} { title: "The Matrix" })
            CREATE (m2:${Movie} { title: "The Matrix Reloaded" })
            CREATE (a1:${Actor} { name: "Keanu Reeves" })
            CREATE (a2:${Actor} { name: "Jada Pinkett Smith" })
            CREATE (a1)-[:ACTED_IN]->(m1)
            CREATE (a1)-[:ACTED_IN]->(m2)
            CREATE (a2)-[:ACTED_IN]->(m2)
            `,
            {}
        );

        const query = `
            query {
                ${Movie.plural}(
                    where: { custom_field: "hello world!" }
                    options: { sort: [{ title: DESC }] }
                ) {
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
                    title: "The Matrix Reloaded",
                    actors: expect.toIncludeSameMembers([
                        {
                            name: "Keanu Reeves",
                        },
                        {
                            name: "Jada Pinkett Smith",
                        },
                    ]),
                },
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

    test("Connect filter", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            type ${Movie} @node {
                title: String
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
            `
            CREATE (m:${Movie} { title: "The Matrix" })
            CREATE (a:${Actor} { name: "Keanu Reeves" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: "The Matrix Reloaded"
                            actors: {
                                connect: [
                                    {
                                        where: {
                                            node: {
                                                name: "Keanu Reeves",
                                                custom_field: "hello world!"
                                            }
                                        }
                                    }
                                ]
                                create: [
                                    {
                                        node: {
                                            name: "Jada Pinkett Smith"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data?.[Movie.operations.create]?.[Movie.plural]).toIncludeSameMembers([
            {
                title: "The Matrix Reloaded",
                actors: expect.toIncludeSameMembers([
                    {
                        name: "Keanu Reeves",
                    },
                    {
                        name: "Jada Pinkett Smith",
                    },
                ]),
            },
        ]);
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
                ${Movie.plural}(where: { custom_field: "hello world!", another_custom_field_GT: 50 }) {
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
                ${Movie.plural}(where: { custom_field: "hello world!" }) {
                    title
                    actors(where: { another_custom_field: "goodbye!" name: "Keanu Reeves" }) {
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
