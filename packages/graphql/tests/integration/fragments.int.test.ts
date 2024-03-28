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

import { TestHelper } from "../utils/tests-helper";

describe("fragments", () => {
    const testHelper = new TestHelper();
    const Movie = testHelper.createUniqueType("Movie");
    const Series = testHelper.createUniqueType("Series");
    const Actor = testHelper.createUniqueType("Actor");

    const typeDefs = /* GraphQL */ `
        interface Production {
            title: String!
            runtime: Int!
        }

        type ${Movie} implements Production {
            title: String!
            runtime: Int!
        }

        type ${Series} implements Production {
            title: String!
            runtime: Int!
            episodes: Int!
        }

        type ActedIn @relationshipProperties {
            screenTime: Int!
        }

        interface InterfaceA {
            actedIn: [Production!]! @declareRelationship
        }

        type ${Actor} implements InterfaceA {
            name: String!
            actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
        }
    `;

    const actorName = "Marvin";

    const movieTitle = "The Hitchhiker's Guide to the Galaxy";
    const movieRuntime = 1230;
    const movieScreenTime = 3210;

    const seriesTitle = "So Long, and Thanks for All the Fish";
    const seriesRuntime = 112;
    const seriesEpisodes = 113;
    const seriesScreenTime = 114;

    beforeAll(async () => {
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
            CREATE (a:${Actor} { name: $actorName })
            CREATE (a)-[:ACTED_IN { screenTime: $movieScreenTime }]->(:${Movie} { title: $movieTitle, runtime:$movieRuntime })
            CREATE (a)-[:ACTED_IN { screenTime: $seriesScreenTime }]->(:${Series} { title: $seriesTitle, runtime:$seriesRuntime, episodes: $seriesEpisodes })
        `,
            {
                actorName,
                movieTitle,
                movieRuntime,
                movieScreenTime,
                seriesTitle,
                seriesRuntime,
                seriesEpisodes,
                seriesScreenTime,
            }
        );
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should be able project fragment on type", async () => {
        const query = /* GraphQL */ `
            query ($actorName: String!) {
                ${Actor.plural}(where: { name: $actorName }) {
                    ...FragmentOnType
                }
            }

            fragment FragmentOnType on ${Actor} {
                name
            }
        `;
        const graphqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { actorName },
        });

        expect(graphqlResult.errors).toBeFalsy();

        const graphqlActor: Array<{ name: string }> = (graphqlResult.data as any)?.[Actor.plural];

        expect(graphqlActor).toHaveLength(1);
        expect(graphqlActor[0]?.name).toBe(actorName);
    });

    test("should be able project fragment on interface", async () => {
        const query = /* GraphQL */ `
            query ($actorName: String!) {
                ${Actor.plural}(where: { name: $actorName }) {
                    name
                    actedIn {
                        ...FragmentOnInterface
                    }
                }
            }

            fragment FragmentOnInterface on Production {
                title
            }
        `;

        const graphqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { actorName },
        });

        expect(graphqlResult.errors).toBeFalsy();

        const graphqlActors: Array<{ name: string; actedIn: Array<{ title: string }> }> = (graphqlResult.data as any)?.[
            Actor.plural
        ];

        expect(graphqlActors).toHaveLength(1);
        expect(graphqlActors[0]?.name).toBe(actorName);
        expect(graphqlActors[0]?.actedIn).toEqual(
            expect.toIncludeSameMembers([{ title: movieTitle }, { title: seriesTitle }])
        );
    });

    test("should be able to project nested fragments", async () => {
        const query = `
            query ($actorName: String!) {
                ${Actor.plural}(where: { name: $actorName }) {
                    name
                    actedIn {
                        ...FragmentA
                    }
                    ...FragmentB
                }
            }

            fragment FragmentA on Production {
                title
            }

            fragment FragmentB on InterfaceA {
                actedIn {
                    runtime
                }
            }
        `;

        const graphqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { actorName },
        });

        expect(graphqlResult.errors).toBeFalsy();

        const graphqlActors: Array<{ name: string; actedIn: Array<{ title: string; runtime: number }> }> = (
            graphqlResult.data as any
        )?.[Actor.plural];

        expect(graphqlActors).toHaveLength(1);
        expect(graphqlActors[0]?.name).toBe(actorName);
        expect(graphqlActors[0]?.actedIn).toEqual(
            expect.toIncludeSameMembers([
                { title: movieTitle, runtime: movieRuntime },
                { title: seriesTitle, runtime: seriesRuntime },
            ])
        );
    });
});
