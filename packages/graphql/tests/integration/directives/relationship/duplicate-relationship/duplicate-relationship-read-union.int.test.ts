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

describe("Union: Multiple relationships results difference between Connection API and Simple API", () => {
    const testHelper: TestHelper = new TestHelper();

    const Production: UniqueType = testHelper.createUniqueType("Production");
    const Movie: UniqueType = testHelper.createUniqueType("Movie");
    const Series: UniqueType = testHelper.createUniqueType("Series");
    const Actor: UniqueType = testHelper.createUniqueType("Actor");

    beforeAll(async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${Series} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            union ${Production} = ${Movie} | ${Series}

            type ${Actor} @node {
                name: String!
                productions: [${Production}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                role: String!
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        // Create duplicate relationships
        await testHelper.executeCypher(`
            CREATE (m:${Movie} {title: "Movie One"})

            CREATE (s:${Series} {title: "Series One"})

            CREATE (a:${Actor} {name: "Actor One"})
            CREATE (a)-[:ACTED_IN {role: "Movie role one"}]->(m)
            CREATE (a)-[:ACTED_IN {role: "Movie role two"}]->(m)

            CREATE (a)-[:ACTED_IN {role: "Series role one"}]->(s)
            CREATE (a)-[:ACTED_IN {role: "Series role two"}]->(s)
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return multiple relationship results for connection API", async () => {
        const source = /* GraphQL */ `
            query {
                ${Actor.operations.connection} {
                    edges {
                        node {
                            productionsConnection {
                                edges {
                                    node {
                                        ... on ${Movie} {
                                            title
                                        }
                                        ... on ${Series} {
                                            title
                                        }
                                    }
                                    properties {
                                        role
                                    }
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
            [Actor.operations.connection]: {
                edges: [
                    {
                        node: {
                            productionsConnection: {
                                edges: [
                                    {
                                        node: {
                                            title: "Movie One",
                                        },
                                        properties: {
                                            role: "Movie role one",
                                        },
                                    },
                                    {
                                        node: {
                                            title: "Movie One",
                                        },
                                        properties: {
                                            role: "Movie role two",
                                        },
                                    },
                                    {
                                        node: {
                                            title: "Series One",
                                        },
                                        properties: {
                                            role: "Series role one",
                                        },
                                    },
                                    {
                                        node: {
                                            title: "Series One",
                                        },
                                        properties: {
                                            role: "Series role two",
                                        },
                                    },
                                ],
                            },
                        },
                    },
                ],
            },
        });
    });

    test("should only return a single relationship result for simple API", async () => {
        const source = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    productions {
                        ...on ${Movie} {
                            title
                        }
                        ...on ${Series} {
                            title
                        }
                    }
                    name
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(source);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Actor.plural]: [
                {
                    productions: expect.toIncludeSameMembers([
                        {
                            title: "Movie One",
                        },
                        {
                            title: "Series One",
                        },
                    ]),
                    name: "Actor One",
                },
            ],
        });
    });
});
