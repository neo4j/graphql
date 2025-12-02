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

describe("top level union authorization", () => {
    const testHelper = new TestHelper();

    let GenreType: UniqueType;
    let MovieType: UniqueType;

    beforeAll(async () => {
        GenreType = testHelper.createUniqueType("Genre");
        MovieType = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
        union Search = ${GenreType} | ${MovieType}

        type ${GenreType} @node {
            name: String
        }

        type ${MovieType} @node {
            title: String
            search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
        }

        type JWT @jwt {
            jwtAllowedNamesExample: String
            roles: [String]
        }
        extend type ${GenreType.name} @authorization(
            validate: [
                { when: [BEFORE], operations: [READ], where: { node: { name_EQ: "$jwt.jwtAllowedNamesExample" } } }
            ])
        extend type ${MovieType.name} @authorization(
            filter: [
                { operations: [READ], where: { jwt: { roles_INCLUDES: "admin" } } }
            ]) 
        `;

        await testHelper.executeCypher(`
                CREATE (m:${MovieType} {title: "The Matrix"})
                CREATE (g:${GenreType} {name: "Action"})
                MERGE (m)-[:SEARCH]->(m)
                MERGE (m)-[:SEARCH]->(g)
            `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should read top-level simple query on union when jwt correct", async () => {
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

        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: {
                jwt: {
                    jwtAllowedNamesExample: "Action",
                    roles: ["admin"],
                },
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).searches).toIncludeSameMembers([
            { name: "Action" },
            { title: "The Matrix", search: [{ name: "Action" }, {}] },
        ]);
    });

    test("should throw forbidden when jwt incorrect", async () => {
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

        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: {
                jwt: {
                    jwtAllowedNamesExample: "somenode",
                    roles: ["admin"],
                },
            },
        });

        expect(gqlResult.errors?.[0]?.message).toBe("Forbidden");
    });

    test("should not throw forbidden when jwt incorrect if filtering-out the authorized constituent", async () => {
        const query = `
            query {
                searches(where: {${MovieType.name}: {title_EQ: "The Matrix"}}) {
                    ... on ${GenreType} {
                        name
                    }
                    ... on ${MovieType} {
                        title
                        
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: {
                jwt: {
                    jwtAllowedNamesExample: "somenode",
                    roles: ["admin"],
                },
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).searches).toIncludeSameMembers([
            {
                title: "The Matrix",
            },
        ]);
    });

    test("should combine filter with authorization filter", async () => {
        const query = `
            query {
                searches(where: {
                    ${MovieType.name}: {
                        searchConnection_SOME: {
                            ${GenreType.name}: {
                                node: { name_EQ: "Action"} 
                            }
                        }
                    }, 
                    ${GenreType.name}: {}
                }) {
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

        const gqlResult = await testHelper.executeGraphQL(query, {
            contextValue: {
                jwt: {
                    roles: [],
                    jwtAllowedNamesExample: "Action",
                },
            },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).searches).toIncludeSameMembers([{ name: "Action" }]);
    });
});
