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

import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Connections Filtering", () => {
    const testHelper = new TestHelper();
    let actorType: UniqueType;
    let movieType: UniqueType;

    beforeEach(async () => {
        movieType = testHelper.createUniqueType("Movie");
        actorType = testHelper.createUniqueType("Actor");

        const typeDefs = gql`
            type ${movieType} {
                title: String!
                actors: [${actorType}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${actorType} {
                name: String!
                movies: [${movieType}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should allow where clause on relationship property of node", async () => {
        const movieTitle = "My title";
        const actorOneName = "Arthur";
        const actorTwoName = "Zaphod";

        const query = `
			query ($movieTitle: String!) {
				${movieType.plural}(where: { title: $movieTitle }) {
					actorsConnection(where: {node: {movies: { title: $movieTitle } } }) {
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
            `
					CREATE (movie:${movieType} {title: $movieTitle})
					CREATE (actorOne:${actorType} {name: $actorOneName})
					CREATE (actorTwo:${actorType} {name: $actorTwoName})
					CREATE (actorOne)-[:ACTED_IN]->(movie)<-[:ACTED_IN]-(actorTwo)
                `,
            {
                movieTitle,
                actorOneName,
                actorTwoName,
            }
        );
        const result = await testHelper.executeGraphQL(query, {
            variableValues: {
                movieTitle,
            },
        });
        expect(result.errors).toBeFalsy();
        expect((result?.data as any)?.[movieType.plural][0].actorsConnection.edges).toContainEqual({
            node: { name: actorOneName },
        });
        expect((result?.data as any)?.[movieType.plural][0].actorsConnection.edges).toContainEqual({
            node: { name: actorTwoName },
        });
    });

    it("allows for OR boolean operators on nested connections filters", async () => {
        const movieTitle = "My title";
        const actor1Name = "Arthur";
        const actor2Name = "Zaphod";

        const query = `
			query {
				${movieType.plural} (where: {actorsConnection: { OR: [{ node: { name: "${actor1Name}" } }, { node: { name: "${actor2Name}" } }]}}){
                    actorsConnection {
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
            `
					CREATE (movie:${movieType} {title: $movieTitle})
					CREATE (actorOne:${actorType} {name: $actor1Name})
					CREATE (actorTwo:${actorType} {name: $actor2Name})
					CREATE (actorOne)-[:ACTED_IN]->(movie)<-[:ACTED_IN]-(actorTwo)
                `,
            {
                actor1Name,
                actor2Name,
                movieTitle,
            }
        );
        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result?.data?.[movieType.plural]).toEqual([
            {
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: { name: actor1Name },
                        },
                        {
                            node: { name: actor2Name },
                        },
                    ]),
                },
            },
        ]);
    });

    it("allows for NOT boolean operators on nested connections filters", async () => {
        const movieTitle = "My title";
        const actor1Name = "Arthur";
        const actor2Name = "Zaphod";

        const query = `
			query {
				${movieType.plural} (where: {actorsConnection: { NOT: { node: { name: "${actor1Name}" } } } }){
                    actorsConnection {
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
            `
					CREATE (movie:${movieType} {title: $movieTitle})
					CREATE (actorOne:${actorType} {name: $actor1Name})
					CREATE (actorTwo:${actorType} {name: $actor2Name})
					CREATE (actorOne)-[:ACTED_IN]->(movie)<-[:ACTED_IN]-(actorTwo)
                `,
            {
                actor1Name,
                actor2Name,
                movieTitle,
            }
        );
        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result?.data?.[movieType.plural]).toEqual([
            {
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: { name: actor1Name },
                        },
                        {
                            node: { name: actor2Name },
                        },
                    ]),
                },
            },
        ]);
    });

    it("allows for NOT boolean operators on connection projection filters", async () => {
        const movieTitle = "My title";
        const actor1Name = "Arthur";
        const actor2Name = "Zaphod";

        const query = `
			query {
				${movieType.plural}{
                    actorsConnection(where: { NOT: { node: { name: "${actor1Name}" } } }){
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
            `
					CREATE (movie:${movieType} {title: $movieTitle})
					CREATE (actorOne:${actorType} {name: $actor1Name})
					CREATE (actorTwo:${actorType} {name: $actor2Name})
					CREATE (actorOne)-[:ACTED_IN]->(movie)<-[:ACTED_IN]-(actorTwo)
                `,
            {
                actor1Name,
                actor2Name,
                movieTitle,
            }
        );
        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result?.data?.[movieType.plural]).toEqual([
            {
                actorsConnection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: { name: actor2Name },
                        },
                    ]),
                },
            },
        ]);
    });
});
