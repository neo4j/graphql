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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("Update: Multiple relationships results difference between Connection API and Simple API", () => {
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

        // Create duplicate relationships
        await testHelper.executeCypher(`
            CREATE (m:${Movie} {title: "Movie One"})
            CREATE (a:${Actor} {name: "Actor One"})
            CREATE (a)-[:ACTED_IN {role: "Role One"}]->(m)
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return multiple relationship results for connection API", async () => {
        const source = /* GraphQL */ `
            mutation {
                ${Movie.operations.update}(
                    where: { title: { eq: "Movie One" } }
                    update: {
                        actors: [
                            {
                                connect: [
                                    {
                                        where: { node: { name: { eq: "Actor One" } } }
                                        edge: { role: "Role Two" }
                                    }
                                ]
                            }
                        ]
                    }
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
            [Movie.operations.update]: {
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
                ${Movie.operations.update}(
                    where: { title: { eq: "Movie One" } }
                    update: {
                        actors: [
                            {
                                connect: [
                                    {
                                        where: { node: { name: { eq: "Actor One" } } }
                                        edge: { role: "Role Two" }
                                    }
                                ]
                            }
                        ]
                    }
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
            [Movie.operations.update]: {
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
