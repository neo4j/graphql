/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../utils/create-bearer-token";
import { TestHelper } from "../../utils/tests-helper";

describe("Interface filtering", () => {
    const secret = "the-secret";

    const testHelper = new TestHelper();
    let typeDefs: string;

    const Movie = testHelper.createUniqueType("Movie");
    const Series = testHelper.createUniqueType("Series");
    const Actor = testHelper.createUniqueType("Actor");

    beforeAll(async () => {
        typeDefs = /* GraphQL */ `
            interface Show {
                title: String!
                actors: [${Actor}!]! @declareRelationship
            }

            type ${Movie} implements Show @limit(default: 3, max: 10) @node {
                title: String!
                cost: Float
                runtime: Int
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Series} implements Show @node {
                title: String!
                episodes: Int
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Actor} @node {
                name: String!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;

        await testHelper.executeCypher(`
                CREATE(m:${Movie} { title: "The Office" })
                CREATE(m2:${Movie}{ title: "The Office 2" })
                CREATE(m3:${Movie}{ title: "NOT The Office 2" })
                CREATE(s1:${Series}{ title: "The Office 2" })
                CREATE(s2:${Series}{ title: "NOT The Office" })
                CREATE(a:${Actor} {name: "Keanu"})
                MERGE(a)-[:ACTED_IN]->(m)
                MERGE(a)-[:ACTED_IN]->(m2)
                MERGE(a)-[:ACTED_IN]->(m3)
                MERGE(a)-[:ACTED_IN]->(s1)
                MERGE(a)-[:ACTED_IN]->(s2)
                
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("allow for logical filters on top-level interfaces", async () => {
        const query = /* GraphQL */ `
            query actedInWhere {
                shows(where: { OR: [{ title: { eq: "The Office" } }, { title: { eq: "The Office 2" } }] }) {
                    title
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            shows: expect.toIncludeSameMembers([
                {
                    title: "The Office",
                },
                {
                    title: "The Office 2",
                },
                {
                    title: "The Office 2",
                },
            ]),
        });
    });

    test("allow for logical filters on nested-level interfaces", async () => {
        const query = /* GraphQL */ `
            query actedInWhere {
                ${Actor.plural} {
                    actedIn(where: { OR: [{ title: {eq: "The Office"} }, { title: { eq: "The Office 2"} }] }) {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.plural]: [
                {
                    actedIn: expect.toIncludeSameMembers([
                        {
                            title: "The Office",
                        },
                        {
                            title: "The Office 2",
                        },
                        {
                            title: "The Office 2",
                        },
                    ]),
                },
            ],
        });
    });
});
