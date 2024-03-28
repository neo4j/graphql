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

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("Relationship properties - update", () => {
    let testHelper: TestHelper;
    let Movie: UniqueType;
    let Actor: UniqueType;
    let movieTitle: string;
    let actor1: string;
    let actor2: string;
    let actor3: string;

    beforeEach(async () => {
        testHelper = new TestHelper();
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
        const typeDefs = /* GraphQL */ `
            type ${Movie} {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${Actor} {
                name: String!
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;
        movieTitle = generate({ charset: "alphabetic" });
        actor1 = generate({ charset: "alphabetic" });
        actor2 = generate({ charset: "alphabetic" });
        actor3 = generate({ charset: "alphabetic" });
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                CREATE (:${Actor} { name: '${actor1}' })-[:ACTED_IN { screenTime: 105 }]->(m:${Movie} { title: '${movieTitle}'})
                CREATE (m)<-[:ACTED_IN { screenTime: 100 }]-(:${Actor} { name: '${actor2}' })
            `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Update a relationship property on a relationship between two specified nodes (update -> update)", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.update}(
                    where: { title: "${movieTitle}" }
                    update: { actors: [{ where: { node: { name: "${actor1}" } }, update: { edge: { screenTime: 60 } } }] }
                ) {
                    ${Movie.plural} {
                        title
                        actorsConnection(sort: { edge: { screenTime: DESC }}) {
                            edges {
                                properties {
                                    screenTime
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

        const result = await testHelper.executeGraphQL(mutation);
        expect(result.errors).toBeFalsy();

        expect((result?.data as any)[Movie.operations.update][Movie.plural]).toEqual([
            {
                title: movieTitle,
                actorsConnection: {
                    edges: [
                        {
                            properties: { screenTime: 100 },
                            node: {
                                name: actor2,
                            },
                        },
                        {
                            properties: { screenTime: 60 },
                            node: {
                                name: actor1,
                            },
                        },
                    ],
                },
            },
        ]);
    });

    test("Update properties on both the relationship and end node in a nested update (update -> update)", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.update}(
                    where: { title: "${movieTitle}" }
                    update: {
                        actors: [
                            {
                                where: { node: { name: "${actor2}" } }
                                update: {
                                    edge: { screenTime: 60 }
                                    node: { name: "${actor3}" }
                                }
                            }
                        ]
                    }
                ) {
                    ${Movie.plural} {
                        title
                        actorsConnection(sort: { edge: { screenTime: ASC }}) {
                            edges {
                                properties {
                                    screenTime
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

        const result = await testHelper.executeGraphQL(mutation);

        expect(result.errors).toBeFalsy();

        expect((result?.data as any)[Movie.operations.update][Movie.plural]).toEqual([
            {
                title: movieTitle,
                actorsConnection: {
                    edges: [
                        {
                            properties: { screenTime: 60 },
                            node: {
                                name: actor3,
                            },
                        },
                        {
                            properties: { screenTime: 105 },
                            node: {
                                name: actor1,
                            },
                        },
                    ],
                },
            },
        ]);
    });

    test("Create relationship node through update field on end node in a nested update (update -> update)", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.update}(
                    where: { title: "${movieTitle}" }
                    update: {
                        actors: [
                            {
                                create: {
                                    node: { name: "${actor3}" }
                                    edge: { screenTime: 60 }
                                }
                            }
                        ]
                    }
                ) {
                    ${Movie.plural} {
                        title
                        actorsConnection(sort: { edge: { screenTime: ASC }}) {
                            edges {
                                properties {
                                    screenTime
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

        const result = await testHelper.executeGraphQL(mutation);

        expect(result.errors).toBeFalsy();

        expect((result?.data as any)[Movie.operations.update][Movie.plural]).toEqual([
            {
                title: movieTitle,
                actorsConnection: {
                    edges: [
                        {
                            properties: { screenTime: 60 },
                            node: {
                                name: actor3,
                            },
                        },
                        {
                            properties: { screenTime: 100 },
                            node: {
                                name: actor2,
                            },
                        },
                        {
                            properties: { screenTime: 105 },
                            node: {
                                name: actor1,
                            },
                        },
                    ],
                },
            },
        ]);
    });

    test("Create a relationship node with relationship properties on end node in a nested update (update -> create)", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                ${Movie.operations.update}(
                    where: { title: "${movieTitle}" }
                    create: {
                        actors: [
                            {
                                node: { name: "${actor3}" }
                                edge: { screenTime: 60 }
                            }
                        ]
                    }
                ) {
                    ${Movie.plural} {
                        title
                        actorsConnection(sort: { edge: { screenTime: ASC }}) {
                            edges {
                                properties {
                                    screenTime
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

        const result = await testHelper.executeGraphQL(mutation);

        expect(result.errors).toBeFalsy();

        expect((result?.data as any)[Movie.operations.update][Movie.plural]).toEqual([
            {
                title: movieTitle,
                actorsConnection: {
                    edges: [
                        {
                            properties: { screenTime: 60 },
                            node: {
                                name: actor3,
                            },
                        },
                        {
                            properties: { screenTime: 100 },
                            node: {
                                name: actor2,
                            },
                        },
                        {
                            properties: { screenTime: 105 },
                            node: {
                                name: actor1,
                            },
                        },
                    ],
                },
            },
        ]);
    });
});
