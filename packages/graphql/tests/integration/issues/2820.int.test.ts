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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2820", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        Movie = new UniqueType("Movie");
        Series = new UniqueType("Series");
        Actor = new UniqueType("Actor");

        const typeDefs = `
            interface Production {
                title: String!
            }

            type ${Movie} implements Production {
                title: String!
            }

            type ${Series} implements Production {
                title: String!
            }

            union ProductionUnion = ${Movie} | ${Series}

            type ${Actor} {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
                actedInUnion: [ProductionUnion!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver
        });

        session = await neo4j.getSession();

        await session.run(`
            CREATE (a:${Actor} { name: "Actor" })
            CREATE (a)-[:ACTED_IN]->(:${Movie} { title: "House" })
            CREATE (a)-[:ACTED_IN]->(:${Series} { title: "House" })
            CREATE (a)-[:ACTED_IN]->(:${Movie} { title: "Friends" })
            CREATE (a)-[:ACTED_IN]->(:${Series} { title: "Friends" })
        `);

        await session.close();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        session = await neo4j.getSession();
        await cleanNodes(session, [Movie, Actor]);
        await session.close();
        await driver.close();
    });

    describe("interface count and amount should be correct", () => {
        test("should return total count 4", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInConnection {
                        totalCount
                    }
                }
            }
        `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues()
            });

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInConnection.totalCount).toBe(4);
        });

        test("should return interface members in Connection", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInConnection {
                        totalCount
                        edges {
                            node {
                                __typename
                                title
                            }
                        }
                    }
                }
            }
        `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues()
            });

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInConnection).toEqual({
                totalCount: 4,
                edges: expect.toIncludeAllMembers([
                    {
                        node: {
                            __typename: Movie.name,
                            title: "House"
                        }
                    },
                    {
                        node: {
                            __typename: Series.name,
                            title: "House"
                        }
                    },
                    {
                        node: {
                            __typename: Movie.name,
                            title: "Friends"
                        }
                    },
                    {
                        node: {
                            __typename: Series.name,
                            title: "Friends"
                        }
                    }
                ])
            });
        });

        test("should return interface members in Connection without querying title", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInConnection {
                        totalCount
                        edges {
                            node {
                                __typename
                            }
                        }
                    }
                }
            }
        `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues()
            });

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInConnection).toEqual({
                totalCount: 4,
                edges: expect.toIncludeAllMembers([
                    {
                        node: {
                            __typename: Movie.name
                        }
                    },
                    {
                        node: {
                            __typename: Series.name
                        }
                    },
                    {
                        node: {
                            __typename: Movie.name
                        }
                    },
                    {
                        node: {
                            __typename: Series.name
                        }
                    }
                ])
            });
        });

        test("should return interface members in normal field", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedIn {
                        __typename
                        title
                    }
                }
            }
        `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues()
            });

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedIn).toIncludeAllMembers([
                {
                    __typename: Movie.name,
                    title: "House"
                },
                {
                    __typename: Series.name,
                    title: "House"
                },
                {
                    __typename: Movie.name,
                    title: "Friends"
                },
                {
                    __typename: Series.name,
                    title: "Friends"
                }
            ]);
        });

        test("should return interface members in normal field without querying title", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedIn {
                        __typename
                    }
                }
            }
        `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues()
            });

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedIn).toIncludeAllMembers([
                {
                    __typename: Movie.name
                },
                {
                    __typename: Series.name
                },
                {
                    __typename: Movie.name
                },
                {
                    __typename: Series.name
                }
            ]);
        });
    });

    describe("union count and amount should be correct", () => {
        test("should return total count 4", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInUnionConnection {
                        totalCount
                    }
                }
            }
        `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues()
            });

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInUnionConnection.totalCount).toBe(4);
        });

        test("should return interface members in Connection", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInUnionConnection {
                        totalCount
                        edges {
                            node {
                                __typename
                                ... on ${Movie} {
                                    title
                                }
                                ... on ${Series} {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues()
            });

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInUnionConnection).toEqual({
                totalCount: 4,
                edges: expect.toIncludeAllMembers([
                    {
                        node: {
                            __typename: Movie.name,
                            title: "House"
                        }
                    },
                    {
                        node: {
                            __typename: Series.name,
                            title: "House"
                        }
                    },
                    {
                        node: {
                            __typename: Movie.name,
                            title: "Friends"
                        }
                    },
                    {
                        node: {
                            __typename: Series.name,
                            title: "Friends"
                        }
                    }
                ])
            });
        });

        test("should return interface members in Connection without querying title", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInUnionConnection {
                        totalCount
                        edges {
                            node {
                                __typename
                            }
                        }
                    }
                }
            }
        `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues()
            });

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInUnionConnection).toEqual({
                totalCount: 4,
                edges: expect.toIncludeAllMembers([
                    {
                        node: {
                            __typename: Movie.name
                        }
                    },
                    {
                        node: {
                            __typename: Series.name
                        }
                    },
                    {
                        node: {
                            __typename: Movie.name
                        }
                    },
                    {
                        node: {
                            __typename: Series.name
                        }
                    }
                ])
            });
        });

        test("should return interface members in normal field", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInUnion {
                        __typename
                        ... on ${Movie} {
                            title
                        }
                        ... on ${Series} {
                            title
                        }
                    }
                }
            }
        `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues()
            });

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInUnion).toIncludeAllMembers([
                {
                    __typename: Movie.name,
                    title: "House"
                },
                {
                    __typename: Series.name,
                    title: "House"
                },
                {
                    __typename: Movie.name,
                    title: "Friends"
                },
                {
                    __typename: Series.name,
                    title: "Friends"
                }
            ]);
        });

        test("should return interface members in normal field without querying title", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInUnion {
                        __typename
                    }
                }
            }
        `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues()
            });

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInUnion).toIncludeAllMembers([
                {
                    __typename: Movie.name
                },
                {
                    __typename: Series.name
                },
                {
                    __typename: Movie.name
                },
                {
                    __typename: Series.name
                }
            ]);
        });
    });
});
