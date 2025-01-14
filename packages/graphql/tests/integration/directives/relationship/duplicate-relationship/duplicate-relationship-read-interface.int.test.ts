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

describe("Interface: Multiple relationships results difference between Connection API and Simple API", () => {
    const testHelper: TestHelper = new TestHelper();

    const Production: UniqueType = testHelper.createUniqueType("Production");
    const Movie: UniqueType = testHelper.createUniqueType("Movie");
    const Series: UniqueType = testHelper.createUniqueType("Series");
    const Actor: UniqueType = testHelper.createUniqueType("Actor");

    beforeAll(async () => {
        const typeDefs = /* GraphQL */ `
            interface ${Production}  {
                title: String!
            }

            type ${Movie} implements ${Production} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type ${Series} implements ${Production} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

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
                ${Production.operations.connection} {
                    edges {
                        node {
                            ...on ${Movie} {
                                title
                                actorsConnection {
                                    edges {
                                        node {
                                            name
                                        }
                                        properties {
                                            role
                                        }
                                    }
                                }
                            }
                            ...on ${Series} {
                                title
                                actorsConnection {
                                    edges {
                                        node {
                                            name
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
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(source);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Production.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            title: "Movie One",
                            actorsConnection: {
                                edges: expect.toIncludeSameMembers([
                                    {
                                        node: {
                                            name: "Actor One",
                                        },
                                        properties: {
                                            role: "Movie role one",
                                        },
                                    },
                                    {
                                        node: {
                                            name: "Actor One",
                                        },
                                        properties: {
                                            role: "Movie role two",
                                        },
                                    },
                                ]),
                            },
                        },
                    },
                    {
                        node: {
                            title: "Series One",
                            actorsConnection: {
                                edges: expect.toIncludeSameMembers([
                                    {
                                        node: {
                                            name: "Actor One",
                                        },
                                        properties: {
                                            role: "Series role one",
                                        },
                                    },
                                    {
                                        node: {
                                            name: "Actor One",
                                        },
                                        properties: {
                                            role: "Series role two",
                                        },
                                    },
                                ]),
                            },
                        },
                    },
                ]),
            },
        });
    });

    test("should only return a single relationship result for simple API", async () => {
        const source = /* GraphQL */ `
            query {
                ${Production.plural} {
                    ...on ${Movie} {
                        title
                        actors {
                            name
                        }
                    }
                    ...on ${Series} {
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
            [Production.plural]: expect.toIncludeSameMembers([
                {
                    title: "Movie One",
                    actors: [
                        {
                            name: "Actor One",
                        },
                    ],
                },
                {
                    title: "Series One",
                    actors: [
                        {
                            name: "Actor One",
                        },
                    ],
                },
            ]),
        });
    });
});
