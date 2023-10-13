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

import type { Driver } from "neo4j-driver";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { UniqueType } from "../utils/graphql-types";
import { graphql } from "graphql";

describe("unions", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    let GenreType: UniqueType;
    let MovieType: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(() => {
        GenreType = new UniqueType("Genre");
        MovieType = new UniqueType("Movie");
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should read top-level simple query on union", async () => {
        const session = await neo4j.getSession();
        const typeDefs = `
            union Search = ${GenreType} | ${MovieType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: {},
            experimental: true,
        });

        const query = `
            query {
                searches {
                    ... on ${GenreType} {
                        name
                    }
                    ... on ${MovieType} {
                        title
                        search {
                            ... on ${GenreType} {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (m:${MovieType} {title: "The Matrix"})
                CREATE (g:${GenreType} {name: "Action"})
                MERGE (m)-[:SEARCH]->(m)
                MERGE (m)-[:SEARCH]->(g)
            `);
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).searches).toIncludeSameMembers([
                { name: "Action" },
                { title: "The Matrix", search: [{ name: "Action" }, {}] },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should read top-level simple query on union with filters", async () => {
        const session = await neo4j.getSession();
        const typeDefs = `
            union Search = ${GenreType} | ${MovieType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: {},
            experimental: true,
        });

        const query = `
            query {
                searches(where: {${MovieType.name}: {title_NOT: "The Matrix"}, ${GenreType.name}: {}}) {
                    ... on ${GenreType} {
                        name
                    }
                    ... on ${MovieType} {
                        title
                        search {
                            ... on ${GenreType} {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (m:${MovieType} {title: "The Matrix"})
                CREATE (g:${GenreType} {name: "Action"})
                MERGE (m)-[:SEARCH]->(m)
                MERGE (m)-[:SEARCH]->(g)
            `);
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).searches).toIncludeSameMembers([
                { name: "Action" },
                // { title: "The Matrix", search: [{ name: "Action" }, {}] },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should read top-level simple query on union with filters - only specifying a filter for one constituent automatically filters-out the other constituents from the return data", async () => {
        const session = await neo4j.getSession();
        const typeDefs = `
            union Search = ${GenreType} | ${MovieType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: {},
            experimental: true,
        });

        const query = `
            query {
                searches(where: {${MovieType.name}: {title_NOT: "The Matrix"}}) {
                    ... on ${GenreType} {
                        name
                    }
                    ... on ${MovieType} {
                        title
                        search {
                            ... on ${GenreType} {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (m:${MovieType} {title: "The Matrix"})
                CREATE (g:${GenreType} {name: "Action"})
                MERGE (m)-[:SEARCH]->(m)
                MERGE (m)-[:SEARCH]->(g)
            `);
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).searches).toIncludeSameMembers([]);
        } finally {
            await session.close();
        }
    });

    test("should read top-level simple query on union with filters on relationship field", async () => {
        const session = await neo4j.getSession();
        const typeDefs = `
            union Search = ${GenreType} | ${MovieType}

            type ${GenreType} {
                name: String
            }

            type ${MovieType} {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: {},
            experimental: true,
        });

        const query = `
            query {
                searches(where: {${MovieType.name}: {searchConnection: {${GenreType.name}: {node: { name: "Action"} }}}}) {
                    ... on ${GenreType} {
                        name
                    }
                    ... on ${MovieType} {
                        title
                        search {
                            ... on ${GenreType} {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (m:${MovieType} {title: "The Matrix"})
                CREATE (g:${GenreType} {name: "Action"})
                MERGE (m)-[:SEARCH]->(m)
                MERGE (m)-[:SEARCH]->(g)
            `);
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect((gqlResult.data as any).searches).toIncludeSameMembers([
                { title: "The Matrix", search: [{ name: "Action" }, {}] },
            ]);
        } finally {
            await session.close();
        }
    });
});
