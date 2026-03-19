/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("cypher directive in relationship properties", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type ${Actor} @node {
                name: String!
                actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                screenTimeHours: Float
                    @cypher(
                        statement: """
                        RETURN this.screenTimeMinutes / 60 AS c
                        """
                        columnName: "c"
                    )
                screenTimeMinutes: Int
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("order nested relationship by relationship properties DESC", async () => {
        const source = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                    actorsConnection(sort: {edge: {screenTimeHours: DESC}}) {
                        edges {
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `CREATE(m:${Movie} {title: "The Matrix"})<-[:ACTED_IN {screenTimeMinutes: 120}]-(:${Actor} {name: "Main actor"})
            CREATE(m)<-[:ACTED_IN {screenTimeMinutes: 80}]-(:${Actor} {name: "Second actor"})`
        );

        const gqlResult = await testHelper.executeGraphQL(source);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    actorsConnection: {
                        edges: [
                            {
                                node: {
                                    name: "Main actor",
                                },
                            },
                            {
                                node: {
                                    name: "Second actor",
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });

    test("order nested relationship by relationship properties ASC", async () => {
        const source = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                    actorsConnection(sort: {edge: {screenTimeHours: ASC}}) {
                        edges {
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(
            `CREATE(m:${Movie} {title: "The Matrix"})<-[:ACTED_IN {screenTimeMinutes: 120}]-(:${Actor} {name: "Main actor"})
            CREATE(m)<-[:ACTED_IN {screenTimeMinutes: 80}]-(:${Actor} {name: "Second actor"})`
        );

        const gqlResult = await testHelper.executeGraphQL(source);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Movie.plural]: [
                {
                    title: "The Matrix",
                    actorsConnection: {
                        edges: [
                            {
                                node: {
                                    name: "Second actor",
                                },
                            },
                            {
                                node: {
                                    name: "Main actor",
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});
