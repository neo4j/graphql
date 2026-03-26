/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("create -> connect", () => {
    const testHelper = new TestHelper();
    let Actor: UniqueType;
    let Movie: UniqueType;

    beforeEach(async () => {
        Actor = testHelper.createUniqueType("Actor");
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        
            type ${Movie} @node {
                title: String
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`CREATE (a:${Actor} {name: "Keanu"})`);
        await testHelper.executeCypher(`CREATE (m:${Movie} {title: "Another Matrix"})`);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should create a movie and connect to an actor", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        { title: "The Matrix", actors: { connect: [{ where: { node: { name: { eq: "Keanu" } } } }] } }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                    }
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: [
                    {
                        title: "The Matrix",
                    },
                ],
                info: {
                    relationshipsCreated: 1,
                    nodesCreated: 1,
                },
            },
        });

        const path = await testHelper.executeCypher(`
                MATCH (m:${Movie} {title: "The Matrix"})-[:ACTED_IN]-(a:${Actor} {name: "Keanu"})
                RETURN COUNT(*) as resultsCount
            `);

        expect(path.records[0]?.toObject().resultsCount.toNumber()).toBe(1);
    });

    test("should create a movie and a nested connect -> connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: "The Matrix"
                            actors: {
                                connect: [
                                    {
                                        where: {
                                            node: {
                                                name: { eq: "Keanu" }
                                            }
                                        },
                                        connect: {
                                            movies: { where: { node: { title: { eq: "Another Matrix" } } } }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                    }
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: [
                    {
                        title: "The Matrix",
                    },
                ],
                info: {
                    relationshipsCreated: 2,
                    nodesCreated: 1,
                },
            },
        });

        const path = await testHelper.executeCypher(`
                MATCH (m:${Movie} {title: "The Matrix"})-[:ACTED_IN]-(:${Actor} {name: "Keanu"})-[:ACTED_IN]-(:${Movie} {title: "Another Matrix"})
                RETURN COUNT(*) as resultsCount
            `);

        expect(path.records[0]?.toObject().resultsCount.toNumber()).toBe(1);
    });
});
