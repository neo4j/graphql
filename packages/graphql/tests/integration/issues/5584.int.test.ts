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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5584", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
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
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should support alias at every level of a query", async () => {
        await testHelper.executeCypher(`
            CREATE(:${Movie} {title: "The Matrix"})<-[:ACTED_IN {screenTime: 12}]-(:${Actor} {name: "Keanu Reeves"})
            `);

        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { title: "The Matrix" }) {
                    title1: title
                    actorsConnection1: actorsConnection(where: { node: { name: "Keanu Reeves" } }) {
                        edges1: edges {
                            properties1: properties {
                                screenTime1: screenTime
                            }
                            node1: node {
                                name1: name
                                b: moviesConnection(where: { node: { title: "The Matrix" } }) {
                                    edges2: edges {
                                        node2: node {
                                            title2: title
                                            a: actors {
                                                name2: name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await testHelper.executeGraphQL(query);

        expect(response.errors).toBeFalsy();
        expect(response.data).toEqual({
            [Movie.plural]: [
                {
                    title1: "The Matrix",
                    actorsConnection1: {
                        edges1: [
                            {
                                properties1: {
                                    screenTime1: 12,
                                },

                                node1: {
                                    name1: "Keanu Reeves",
                                    b: {
                                        edges2: [
                                            {
                                                node2: {
                                                    title2: "The Matrix",
                                                    a: [
                                                        {
                                                            name2: "Keanu Reeves",
                                                        },
                                                    ],
                                                },
                                            },
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});
