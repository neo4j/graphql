/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("Create: Multiple relationships results difference between Connection API and Simple API", () => {
    const testHelper: TestHelper = new TestHelper();
    const Movie: UniqueType = testHelper.createUniqueType("Movie");
    const Actor: UniqueType = testHelper.createUniqueType("Actor");

    beforeEach(async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${Actor} @node {
                name: String!
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                role: String!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return multiple relationship results for connection API", async () => {
        const source = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: "Movie One"
                            actors: {
                                create: [{ edge: { role: "Role One" }, node: { name: "Actor One" } }]
                                connect: [{ edge: { role: "Role Two" } }]
                            }
                        }
                    ]
                ) {
                    ${Movie.plural} {
                        title
                        actorsConnection {
                            edges {
                                properties {
                                    role
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(source);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: [
                    {
                        title: "Movie One",
                        actorsConnection: {
                            edges: expect.toIncludeSameMembers([
                                {
                                    node: {
                                        name: "Actor One",
                                    },
                                    properties: {
                                        role: "Role One",
                                    },
                                },
                                {
                                    node: {
                                        name: "Actor One",
                                    },
                                    properties: {
                                        role: "Role Two",
                                    },
                                },
                            ]),
                        },
                    },
                ],
            },
        });
    });

    test("should only return a single relationship result for simple API", async () => {
        const source = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(
                    input: [
                        {
                            title: "Movie One"
                            actors: {
                                create: [{ edge: { role: "Role One" }, node: { name: "Actor One" } }]
                                connect: [{ edge: { role: "Role Two" } }]
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

        const gqlResult = await testHelper.executeGraphQL(source);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.operations.create]: {
                [Movie.plural]: [
                    {
                        title: "Movie One",
                        actors: [
                            {
                                name: "Actor One",
                            },
                        ],
                    },
                ],
            },
        });
    });
});
