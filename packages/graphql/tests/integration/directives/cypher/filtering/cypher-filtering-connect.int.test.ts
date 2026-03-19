/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive filtering - Connect", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("Connect filter", async () => {
        const Movie = testHelper.createUniqueType("Movie");
        const Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String
                custom_field: String
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field AS s
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
            CREATE (m2:${Movie} { title: "The Matrix" })
            CREATE (a:${Actor} { name: "Keanu Reeves", custom_field: "hello world!" })
            CREATE (a)-[:ACTED_IN]->(m)
            `,
            {}
        );

        const query = /* GraphQL */ `
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
                                                name_EQ: "Keanu Reeves",
                                                custom_field_EQ: "hello world!"
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
});
