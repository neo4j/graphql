/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/3015", () => {
    const testHelper = new TestHelper();

    let NodeA: UniqueType;
    let NodeB: UniqueType;
    let Connected: UniqueType;

    beforeEach(() => {
        NodeA = testHelper.createUniqueType("NodeA");
        NodeB = testHelper.createUniqueType("NodeB");
        Connected = testHelper.createUniqueType("Connected");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("union should filter by top level match", async () => {
        const typeDefs = `
            type ${NodeA} @node {
                name: String!
            }

            type ${NodeB} @node {
                name: String!
            }

            union EitherNode = ${NodeA} | ${NodeB}
            type ${Connected} @node {
                name: String!
                connections: [EitherNode]
                    @cypher(
                        statement: "MATCH (this)-[:LINKED_TO]->(a:${NodeA}) RETURN a as output UNION WITH this MATCH (this)-[:LINKED_TO]->(b:${NodeB}) RETURN b as output"
                        columnName: "output"
                    )
            }
        `;

        await testHelper.executeCypher(`
            CREATE (a:${NodeA} {name: "testA"})
            CREATE (b:${NodeB} {name: "testB"})
            CREATE (c:${Connected} {name: "connectedB"})

            CREATE (a2:${NodeA} {name: "testA2"})
            CREATE (b2:${NodeB} {name: "testB2"})
            CREATE (c2:${Connected} {name: "connectedAB2"})

            CREATE(c)-[:LINKED_TO]->(b)
            CREATE(c2)-[:LINKED_TO]->(a2)
            CREATE(c2)-[:LINKED_TO]->(b2)
        `);

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            query {
                ${Connected.plural} {
                    name
                    connections {
                        ... on ${NodeB} {
                            name
                        }
                        ... on ${NodeA} {
                            name
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();

        expect(result.data).toEqual({
            [Connected.plural]: expect.toIncludeSameMembers([
                {
                    name: "connectedB",
                    connections: expect.toIncludeSameMembers([
                        {
                            name: "testB",
                        },
                    ]),
                },
                {
                    name: "connectedAB2",
                    connections: expect.toIncludeSameMembers([
                        {
                            name: "testA2",
                        },
                        {
                            name: "testB2",
                        },
                    ]),
                },
            ]),
        });
    });
});
