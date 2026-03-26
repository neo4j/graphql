/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Union filtering", () => {
    const secret = "the-secret";

    const testHelper = new TestHelper();
    let typeDefs: string;

    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Series = testHelper.createUniqueType("Series");
        Actor = testHelper.createUniqueType("Actor");

        typeDefs = /* GraphQL */ `
            union Production = ${Movie} | ${Series}

            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            
            type ${Series} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Actor} @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        await testHelper.executeCypher(`
                CREATE(m1:${Movie} { title: "The Office" })
                CREATE(m2:${Movie} { title: "The Office 2" })
                CREATE(m3:${Movie} { title: "NOT The Office 2" })
                CREATE(s1:${Series} { title: "The Office 2" })
                CREATE(s2:${Series} { title: "NOT The Office" })
                CREATE(a1:${Actor} {name: "Keanu"})
                CREATE(a2:${Actor} {name: "Michael"})
                CREATE(a3:${Actor} {name: "John"})
                MERGE(a1)-[:ACTED_IN]->(m1)
                MERGE(a1)-[:ACTED_IN]->(s2)
                MERGE(a2)-[:ACTED_IN]->(m2)
                MERGE(a2)-[:ACTED_IN]->(m3)
                MERGE(a2)-[:ACTED_IN]->(s1)
                MERGE(a3)-[:ACTED_IN]->(s1)
                MERGE(a3)-[:ACTED_IN]->(s2)
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

    afterEach(async () => {
        await testHelper.close();
    });

    test("allow for filtering on top-level union relationships", async () => {
        const query = /* GraphQL */ `
            query {
                productions(where: { ${Movie}: { title_EQ: "The Office" }, ${Series}: { title_EQ: "The Office 2" } }) {
                    ... on ${Movie} {
                        title
                    }
                    ... on ${Series} {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            productions: expect.toIncludeSameMembers([
                {
                    title: "The Office",
                },
                {
                    title: "The Office 2",
                },
            ]),
        });
    });

    test("allow for filtering on nested-level relationship unions", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural}(where: {
                    actedIn_SOME: { ${Movie}: { title_CONTAINS: "Office" }}
                }) {
                    name
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([
                {
                    name: "Keanu",
                },
                {
                    name: "Michael",
                },
            ]),
        });
    });

    test("allow updating an actor name based on a union relationship filter", async () => {
        const query = /* GraphQL */ `
            mutation updateName($name: String!) {
                ${Actor.operations.update}(
                    where: { actedIn_SOME: { ${Movie}: { title_EQ: "The Office" } }},
                    update: { name_SET: $name }
                ) {
                    ${Actor.plural} {
                        name
                        actedIn {
                            __typename
                            ... on ${Movie} {
                                title
                            }
                            ... on ${Series} {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: {
                name: "Michael Scott",
            },
        });

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Actor.operations.update]: {
                [Actor.plural]: [
                    {
                        name: "Michael Scott",
                        actedIn: [
                            {
                                __typename: Movie.name,
                                title: "The Office",
                            },
                            {
                                __typename: Series.name,
                                title: "NOT The Office",
                            },
                        ],
                    },
                ],
            },
        });
    });
});
