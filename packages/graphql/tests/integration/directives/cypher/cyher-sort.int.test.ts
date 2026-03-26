/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("cypher directive sort", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Actor} @node {
                name: String!
                actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                ranking: Int! @cypher(statement: """
                    RETURN this.rank as ranking
                """, columnName: "ranking")
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
                    actorsConnection(sort: {node: {ranking: DESC}}) {
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
            `CREATE(m:${Movie} {title: "The Matrix"})<-[:ACTED_IN]-(:${Actor} {name: "Main actor", rank: 1})
            CREATE(m)<-[:ACTED_IN]-(:${Actor} {name: "Second actor", rank: 2})`
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
    test("order nested relationship by relationship properties ASC", async () => {
        const source = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                    actorsConnection(sort: {node: {ranking: ASC}}) {
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
            `CREATE(m:${Movie} {title: "The Matrix"})<-[:ACTED_IN]-(:${Actor} {name: "Main actor", rank: 1})
            CREATE(m)<-[:ACTED_IN]-(:${Actor} {name: "Second actor", rank: 2})`
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
});
