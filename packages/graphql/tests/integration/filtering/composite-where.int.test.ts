/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("composite-where", () => {
    const testHelper = new TestHelper();
    let Actor: UniqueType;
    let Movie: UniqueType;

    beforeAll(async () => {
        Actor = testHelper.createUniqueType("Actor");
        Movie = testHelper.createUniqueType("Movie");
        const typeDefs = `
            type ${Actor} @node {
                name: String
            }
    
            type ${Movie} @node {
                id: ID!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }
    
            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    describe("Delete", () => {
        test("should use composite where to delete", async () => {
            const actorName1 = generate({
                charset: "alphabetic",
            });
            const actorName2 = generate({
                charset: "alphabetic",
            });
            const movieId = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const query = `
                mutation($movieId: ID, $actorName1: String, $screenTime: Int) {
                    ${Movie.operations.update}(
                        where: {
                            id_EQ: $movieId
                        }
                        update: {
                            actors: {
                                delete: {
                                    where: {
                                        node: {
                                            name_EQ: $actorName1
                                        }
                                        edge: {
                                            screenTime_EQ: $screenTime
                                        }
                                    }
                                }
                            }
                        }
                    ) {
                        ${Movie.plural} {
                            id
                            actors {
                                name
                            }
                        }
                    }
                }
            `;

            await testHelper.executeCypher(
                `
                        CREATE (m:${Movie} {id: $movieId})
                        CREATE (m)<-[:ACTED_IN {screenTime:$screenTime}]-(:${Actor} {name:$actorName1})
                        CREATE (m)<-[:ACTED_IN {screenTime:$screenTime}]-(:${Actor} {name:$actorName2})
                    `,
                { movieId, screenTime, actorName1, actorName2 }
            );

            const gqlResult = await testHelper.executeGraphQL(query, {
                variableValues: { movieId, actorName1, screenTime },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
                [Movie.plural]: [{ id: movieId, actors: [{ name: actorName2 }] }],
            });
        });
    });

    describe("Disconnect", () => {
        test("should use composite where to delete", async () => {
            const actorName1 = generate({
                charset: "alphabetic",
            });
            const actorName2 = generate({
                charset: "alphabetic",
            });
            const movieId = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const query = `
                mutation($movieId: ID, $actorName1: String, $screenTime: Int) {
                    ${Movie.operations.update}(
                        where: {
                            id_EQ: $movieId
                        }
                        update: {
                            actors: {
                                disconnect: {
                                    where: {
                                        node: {
                                            name_EQ: $actorName1
                                        }
                                        edge: {
                                            screenTime_EQ: $screenTime
                                        }
                                    }
                                }
                            }
                        }
                    ) {
                        ${Movie.plural} {
                            id
                            actors {
                                name
                            }
                        }
                    }
                }
            `;

            await testHelper.executeCypher(
                `
                        CREATE (m:${Movie} {id: $movieId})
                        CREATE (m)<-[:ACTED_IN {screenTime:$screenTime}]-(:${Actor} {name:$actorName1})
                        CREATE (m)<-[:ACTED_IN {screenTime:$screenTime}]-(:${Actor} {name:$actorName2})
                    `,
                { movieId, screenTime, actorName1, actorName2 }
            );

            const gqlResult = await testHelper.executeGraphQL(query, {
                variableValues: { movieId, actorName1, screenTime },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult?.data?.[Movie.operations.update]).toEqual({
                [Movie.plural]: [{ id: movieId, actors: [{ name: actorName2 }] }],
            });
        });
    });
});
