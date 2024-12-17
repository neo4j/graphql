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

import { type Driver } from "neo4j-driver";
import { generate } from "randomstring";
import type { Neo4jGraphQL } from "../../../../src/classes";
import { SCORE_FIELD } from "../../../../src/constants";
import { upperFirst } from "../../../../src/utils/upper-first";
import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { isMultiDbUnsupportedError } from "../../../utils/is-multi-db-unsupported-error";
import { TestHelper } from "../../../utils/tests-helper";
import { GraphQLError } from "graphql";

function generatedTypeDefs(personType: UniqueType, movieType: UniqueType): string {
    return `
        type ${personType.name} @fulltext(indexes: [{ indexName: "${personType.name}Index", queryName: "${personType.plural}ByName", fields: ["name"] }]) @node {
            name: String!
            born: Int!
            actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
        } 

        type ${movieType.name} @node {
            title: String!
            released: Int!
            actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    `;
}

describe("@fulltext directive", () => {
    let driver: Driver;
    const testHelper = new TestHelper();
    let databaseName: string;
    let MULTIDB_SUPPORT = true;

    beforeAll(async () => {
        databaseName = generate({ readable: true, charset: "alphabetic" });

        try {
            await testHelper.createDatabase(databaseName);
        } catch (e) {
            if (e instanceof Error) {
                if (isMultiDbUnsupportedError(e)) {
                    // No multi-db support, so we skip tests
                    MULTIDB_SUPPORT = false;
                    await testHelper.close();
                } else {
                    throw e;
                }
            }
        }
    });

    beforeEach(async () => {
        if (MULTIDB_SUPPORT) {
            driver = await testHelper.getDriver();
        }
    });

    afterEach(async () => {
        if (MULTIDB_SUPPORT) {
            await testHelper.close();
        }
    });

    afterAll(async () => {
        if (MULTIDB_SUPPORT) {
            await testHelper.dropDatabase();
            await testHelper.close();
        }
    });

    describe("Query Tests", () => {
        let neoSchema: Neo4jGraphQL;
        let personType: UniqueType;
        let movieType: UniqueType;
        let queryType: string;

        const person1 = {
            name: "this is a name",
            born: 1984,
        };
        const person2 = {
            name: "This is a different name",
            born: 1985,
        };
        const person3 = {
            name: "Another name",
            born: 1986,
        };
        const movie1 = {
            title: "Some Title",
            description: "some other description",
            released: 2001,
        };
        const movie2 = {
            title: "Another Title",
            description: "this is a description",
            released: 2002,
        };

        beforeEach(async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            personType = testHelper.createUniqueType("Person");
            movieType = testHelper.createUniqueType("Movie");
            queryType = `${personType.plural}ByName`;

            const typeDefs = generatedTypeDefs(personType, movieType);

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await testHelper.createFulltextIndex(`${personType.name}Index`, personType.name, ["name"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            await testHelper.executeCypher(
                `
                    CREATE (person1:${personType.name})-[:ACTED_IN]->(movie1:${movieType.name})
                    CREATE (person1)-[:ACTED_IN]->(movie2:${movieType.name})
                    CREATE (person2:${personType.name})-[:ACTED_IN]->(movie1)
                    CREATE (person3:${personType.name})-[:ACTED_IN]->(movie2)
                    SET person1 = $person1
                    SET person2 = $person2
                    SET person3 = $person3
                    SET movie1 = $movie1
                    SET movie2 = $movie2
                `,
                { person1, person2, person3, movie1, movie2 }
            );
        });

        test("Orders by score DESC as default", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name") {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node).toEqual({
                name: person2.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[1].node).toEqual({
                name: person1.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[2].node).toEqual({
                name: person3.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]
            );
            expect((gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[2][SCORE_FIELD]
            );
        });

        test("Order updates when using a different phrase", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "some name") {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node).toEqual({
                name: person3.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[1].node).toEqual({
                name: person1.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[2].node).toEqual({
                name: person2.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]
            );
            expect((gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[2][SCORE_FIELD]
            );
        });

        test("No results if phrase doesn't match", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "should not match") {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toEqual([]);
        });

        test("Filters node to single result", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { node: { name_EQ: "${person1.name}" } }) {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node.name).toBe(person1.name);
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeNumber();
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(1);
        });

        test("Filters node to multiple results", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { node: { born_GTE: ${person2.born} } }) {
                        edges {
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toEqual([
                {
                    node: {
                        name: person2.name,
                    },
                },
                {
                    node: {
                        name: person3.name,
                    },
                },
            ]);
        });

        test("Filters node to no results", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { node: { name_CONTAINS: "not in anything!!" } }) {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toEqual([]);
        });

        test("Filters score to single result", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { min: 0.5 } }) {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node.name).toBe(person2.name);
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeNumber();
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(1);
        });

        test("Filters score to multiple results", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { max: 0.5 } }) {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node.name).toBe(person1.name);
            expect((gqlResult.data?.[queryType] as any).edges[1].node.name).toBe(person3.name);
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]
            );
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(2);
        });

        test("Filters score to no results", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { min: 100 } }) {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toEqual([]);
        });

        test("Filters score with combined min and max", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { min: 0.201, max: 0.57 } }) {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node.name).toBe(person1.name);
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeNumber();
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(1);
        });

        test("Filters score with max score of 0", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { max: 0 } }) {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toEqual([]);
        });

        test("Throws error if score filtered with a non-number", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const nonNumberScoreInput = "not a number";
            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { max: "${nonNumberScoreInput}" } }) {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect((gqlResult.errors as any[])[0].message).toBe(
                `Float cannot represent non numeric value: "${nonNumberScoreInput}"`
            );
        });

        test("Filters a related node to multiple values", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { node: { actedInMovies_SOME: { title_EQ: "${movie1.title}" } } }) {
                        edges {
                            score
                            node {
                                name
                                actedInMovies( sort: [{ released: DESC }] ) {
                                    title
                                    released
                                }
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node.name).toBe(person2.name);
            expect((gqlResult.data?.[queryType] as any).edges[0].node.actedInMovies).toEqual([
                {
                    title: movie1.title,
                    released: movie1.released,
                },
            ]);
            expect((gqlResult.data?.[queryType] as any).edges[1].node.name).toBe(person1.name);
            expect((gqlResult.data?.[queryType] as any).edges[1].node.actedInMovies).toEqual([
                {
                    title: movie2.title,
                    released: movie2.released,
                },
                {
                    title: movie1.title,
                    released: movie1.released,
                },
            ]);
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]
            );
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(2);
        });

        test("Filters a related node to a single value", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { node: { actedInMovies_ALL: { released_EQ: ${movie1.released} } } }) {
                        edges {
                            node {
                                name
                                actedInMovies {
                                    title
                                    released
                                }
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toEqual([
                {
                    node: {
                        name: person2.name,
                        actedInMovies: [
                            {
                                title: movie1.title,
                                released: movie1.released,
                            },
                        ],
                    },
                },
            ]);
        });

        test("Filters a related node to no values", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { node: { actedInMovies_ALL: { NOT: { released_IN: [${movie1.released}, ${movie2.released}] }} } }) {
                        edges {
                            score
                            node {
                                name
                                actedInMovies {
                                    title
                                    released
                                }
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toEqual([]);
        });

        test("Throws an error for a non-string phrase", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const nonStringValue = '["not", "a", "string"]';
            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: ${nonStringValue}) {
                        edges {
                            score
                            node {
                                name
                                actedInMovies {
                                    title
                                    released
                                }
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect((gqlResult.errors as any[])[0].message).toBe(
                `String cannot represent a non string value: ${nonStringValue}`
            );
        });

        test("Throws an error for an invalid where", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const invalidField = "not_a_field";
            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "some name", where: { node: { ${invalidField}_EQ: "invalid" } }) {
                        edges {
                            score
                            node {
                                name
                                actedInMovies {
                                    title
                                    released
                                }
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect((gqlResult.errors as any[])[0].message).toStartWith(
                `Field "${invalidField}_EQ" is not defined by type`
            );
        });

        test("Sorting by score ascending", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", sort: { score: ASC }) {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node.name).toBe(person3.name);
            expect((gqlResult.data?.[queryType] as any).edges[1].node.name).toBe(person1.name);
            expect((gqlResult.data?.[queryType] as any).edges[2].node.name).toBe(person2.name);
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeLessThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]
            );
            expect((gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]).toBeLessThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[2][SCORE_FIELD]
            );
        });

        test("Sorting by node", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", sort: [{ node: { name: ASC } }]) {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node.name).toBe(person3.name);
            expect((gqlResult.data?.[queryType] as any).edges[1].node.name).toBe(person2.name);
            expect((gqlResult.data?.[queryType] as any).edges[2].node.name).toBe(person1.name);
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeNumber();
            expect((gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]).toBeNumber();
            expect((gqlResult.data?.[queryType] as any).edges[2][SCORE_FIELD]).toBeNumber();
        });

        test("Unordered sorting", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "this is", sort: { node: { born: ASC, name: DESC } }) {
                        edges {
                            node {
                                name
                                born
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toEqual([
                {
                    node: person1,
                },
                {
                    node: person2,
                },
            ]);
        });

        test("Ordered sorting, no score", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const person1 = {
                name: "a b c",
                born: 123,
            };
            const person2 = {
                name: "b c d",
                born: 234,
            };

            await testHelper.executeCypher(
                `
                CREATE (person1:${personType.name})
                CREATE (person2:${personType.name})
                SET person1 = $person1
                SET person2 = $person2
            `,
                { person1, person2 }
            );

            const query1 = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "b", sort: [{ node: { born: DESC } }, { node: { name: ASC } }]) {
                        edges {
                            node {
                                name
                                born
                            } 
                        }
                    }
                }
            `;
            const query2 = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "b", sort: [{ node: { name: ASC } }, { node: { born: DESC } }]) {
                        edges {
                            node {
                                name
                                born
                            } 
                        }
                    }
                }
            `;
            const gqlResult1 = await testHelper.executeGraphQL(query1);
            const gqlResult2 = await testHelper.executeGraphQL(query2);

            expect(gqlResult1.errors).toBeFalsy();
            expect(gqlResult2.errors).toBeFalsy();
            expect((gqlResult1.data?.[queryType] as any).edges).toEqual([{ node: person2 }, { node: person1 }]);
            expect((gqlResult2.data?.[queryType] as any).edges).toEqual([{ node: person1 }, { node: person2 }]);
        });

        test("Ordered sorting, with score", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const person1 = {
                name: "a b c",
                born: 123,
            };
            const person2 = {
                name: "b c d",
                born: 234,
            };

            await testHelper.executeCypher(
                `
                CREATE (person1:${personType.name})
                CREATE (person2:${personType.name})
                SET person1 = $person1
                SET person2 = $person2
            `,
                { person1, person2 }
            );

            const query1 = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "b d", sort: [{ score: DESC }, { node: { name: ASC } }]) {
                        edges {
                            score
                            node {
                                name
                                born
                            } 
                        }
                    }
                }
            `;
            const query2 = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "b d", sort: [{ node: { name: ASC } }, { score: DESC }]) {
                        edges {
                            score
                            node {
                                name
                                born
                            } 
                        }
                    }
                }
            `;
            const gqlResult1 = await testHelper.executeGraphQL(query1);
            const gqlResult2 = await testHelper.executeGraphQL(query2);

            expect(gqlResult1.errors).toBeFalsy();
            expect(gqlResult2.errors).toBeFalsy();
            expect((gqlResult1.data?.[queryType] as any).edges[0].node).toEqual(person2);
            expect((gqlResult1.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeNumber();
            expect((gqlResult1.data?.[queryType] as any).edges[1].node).toEqual(person1);
            expect((gqlResult1.data?.[queryType] as any).edges[1][SCORE_FIELD]).toBeNumber();
            expect((gqlResult1.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeGreaterThan(
                (gqlResult1.data?.[queryType] as any).edges[1][SCORE_FIELD]
            );
            expect((gqlResult2.data?.[queryType] as any).edges[0].node).toEqual(person1);
            expect((gqlResult2.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeNumber();
            expect((gqlResult2.data?.[queryType] as any).edges[1].node).toEqual(person2);
            expect((gqlResult2.data?.[queryType] as any).edges[1][SCORE_FIELD]).toBeNumber();
        });

        test("Sort on nested field", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a name") {
                        edges {
                            node {
                                name
                                actedInMovies(sort: [{ released: ASC }]) {
                                    title
                                    released
                                }
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toEqual([
                {
                    node: {
                        name: person1.name,
                        actedInMovies: [
                            {
                                title: movie1.title,
                                released: movie1.released,
                            },
                            {
                                title: movie2.title,
                                released: movie2.released,
                            },
                        ],
                    },
                },
                {
                    node: {
                        name: person2.name,
                        actedInMovies: [
                            {
                                title: movie1.title,
                                released: movie1.released,
                            },
                        ],
                    },
                },
                {
                    node: {
                        name: person3.name,
                        actedInMovies: [
                            {
                                title: movie2.title,
                                released: movie2.released,
                            },
                        ],
                    },
                },
            ]);
        });

        test("Combined filter and sort", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a name", sort: { score: ASC }, where: { score: { min: 0.2 } }) {
                        edges {
                            score
                            node {
                                name
                                born
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node).toEqual(person2);
            expect((gqlResult.data?.[queryType] as any).edges[1].node).toEqual(person1);
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeLessThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]
            );
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(2);
        });

        test("Limiting is possible", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a name", first: 2) {
                        edges {
                            node {
                                name
                                born
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(2);
        });

        test("Sorting by score when the score is not returned", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", sort: { score: ASC }) {
                        edges {
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toEqual([
                {
                    node: {
                        name: person3.name,
                    },
                },
                {
                    node: {
                        name: person1.name,
                    },
                },
                {
                    node: {
                        name: person2.name,
                    },
                },
            ]);
        });

        test("Sort by node when node is not returned", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "this is", sort: { node: { born: ASC } }) {
                        edges {
                            score
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeNumber();
            expect((gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]).toBeNumber();
            expect((gqlResult.data?.[queryType] as any).edges[0].node).toBeUndefined();
            expect((gqlResult.data?.[queryType] as any).edges[1].node).toBeUndefined();
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(2);
        });

        test("Filters by node when node is not returned", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { node: { name_EQ: "${person1.name}" } }) {
                        edges {
                            score
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeNumber();
            expect((gqlResult.data?.[queryType] as any).edges[0].node).toBeUndefined();
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(1);
        });

        test("Filters by score when no score is returned", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { max: 0.5 } }) {
                        edges {
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toEqual([
                {
                    node: {
                        name: person1.name,
                    },
                },
                {
                    node: {
                        name: person3.name,
                    },
                },
            ]);
        });
    });
    describe("Query Tests - limit required", () => {
        let neoSchema: Neo4jGraphQL;
        let personType: UniqueType;
        let movieType: UniqueType;
        let queryType: string;

        const person1 = {
            name: "this is a name",
            born: 1984,
        };
        const person2 = {
            name: "This is a different name",
            born: 1985,
        };
        const person3 = {
            name: "Another name",
            born: 1986,
        };
        const movie1 = {
            title: "Some Title",
            description: "some other description",
            released: 2001,
        };
        const movie2 = {
            title: "Another Title",
            description: "this is a description",
            released: 2002,
        };

        beforeEach(async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            personType = testHelper.createUniqueType("Person");
            movieType = testHelper.createUniqueType("Movie");
            queryType = `${personType.plural}ByName`;

            const typeDefs = generatedTypeDefs(personType, movieType);

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    limitRequired: true,
                },
            });

            await testHelper.createFulltextIndex(`${personType.name}Index`, personType.name, ["name"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            await testHelper.executeCypher(
                `
                    CREATE (person1:${personType.name})-[:ACTED_IN]->(movie1:${movieType.name})
                    CREATE (person1)-[:ACTED_IN]->(movie2:${movieType.name})
                    CREATE (person2:${personType.name})-[:ACTED_IN]->(movie1)
                    CREATE (person3:${personType.name})-[:ACTED_IN]->(movie2)
                    SET person1 = $person1
                    SET person2 = $person2
                    SET person3 = $person3
                    SET movie1 = $movie1
                    SET movie2 = $movie2
                `,
                { person1, person2, person3, movie1, movie2 }
            );
        });

        test("Limit argument provided", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a different name", first: 2) {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node).toEqual({
                name: person2.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[1].node).toEqual({
                name: person1.name,
            });
        });

        test("Limit argument not provided", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "some name") {
                        edges {
                            score
                            node {
                                name
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "${queryType}" argument "first" of type "Int!" is required, but it was not provided.`),
             ]);
        });

        test("Limit not provided on nested field", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const query = /* GraphQL */ `
                query {
                    ${queryType}(phrase: "a name", first: 10) {
                        edges {
                            node {
                                name
                                actedInMovies(sort: [{ released: ASC }]) {
                                    title
                                    released
                                }
                            } 
                        }
                    }
                }
            `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toHaveLength(1);
            expect(gqlResult.errors).toIncludeSameMembers([
                new GraphQLError(`Field "actedInMovies" argument "limit" of type "Int!" is required, but it was not provided.`),
             ]);
         
        });
    });
    describe("Query tests with auth", () => {
        let neoSchema: Neo4jGraphQL;
        let personType: UniqueType;
        let movieType: UniqueType;
        let queryType: string;

        const person1 = {
            name: "this is a name",
            born: 1984,
        };
        const person2 = {
            name: "This is a different name",
            born: 1985,
        };
        const person3 = {
            name: "Another name",
            born: 1986,
        };
        const movie1 = {
            title: "Some Title",
            description: "some other description",
            released: 2001,
        };
        const movie2 = {
            title: "Another Title",
            description: "this is a description",
            released: 2002,
        };

        beforeEach(async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            personType = testHelper.createUniqueType("Person");
            movieType = testHelper.createUniqueType("Movie");
            queryType = `${personType.plural}ByName`;

            await testHelper.executeCypher(
                `
                    CREATE (person1:${personType.name})-[:ACTED_IN]->(movie1:${movieType.name})
                    CREATE (person1)-[:ACTED_IN]->(movie2:${movieType.name})
                    CREATE (person2:${personType.name})-[:ACTED_IN]->(movie1)
                    CREATE (person3:${personType.name})-[:ACTED_IN]->(movie2)
                    SET person1 = $person1
                    SET person2 = $person2
                    SET person3 = $person3
                    SET movie1 = $movie1
                    SET movie2 = $movie2
                `,
                { person1, person2, person3, movie1, movie2 }
            );
        });

        test("Works with @auth 'where' when authenticated", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const typeDefs = /* GraphQL */ `
                    type ${personType.name} @node @fulltext(indexes: [{ indexName: "${personType.name}Index", queryName: "${queryType}", fields: ["name"] }])
                    @authorization(filter: [{ where: { node: { name_EQ: "$jwt.name" } } }]) {
                        name: String!
                        born: Int!
                        actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }
    
                    type ${movieType.name} @node {
                        title: String!
                        released: Int!
                        actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
            const secret = "This is a secret";

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            await testHelper.createFulltextIndex(`${personType.name}Index`, personType.name, ["name"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            const query = /* GraphQL */ `
                    query {
                        ${queryType}(phrase: "a name") {
                            edges {
                                score
                                node {
                                    name
                                } 
                            }
                        }
                    }
                `;

            const token = createBearerToken(secret, { name: person1.name });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node).toEqual({
                name: person1.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeNumber();
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(1);
        });

        test("Works with @auth 'where' when unauthenticated", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const typeDefs = /* GraphQL */ `
                    type ${personType.name} @node @fulltext(indexes: [{ indexName: "${personType.name}Index", queryName: "${queryType}", fields: ["name"] }])
                    @authorization(filter: [{ where: { node: { name_EQ: "$jwt.name" } } }]) {
                        name: String!
                        born: Int!
                        actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }
    
                    type ${movieType.name} @node {
                        title: String!
                        released: Int!
                        actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
            const secret = "This is a secret";

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            await testHelper.createFulltextIndex(`${personType.name}Index`, personType.name, ["name"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            const query = /* GraphQL */ `
                    query {
                        ${queryType}(phrase: "a name") {
                            edges {
                                score
                                node {
                                    name
                                } 
                            }
                        }
                    }
                `;

            const token = createBearerToken(secret, { name: "Not a name" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(0);
        });

        test("Works with @auth 'roles' when authenticated", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const typeDefs = /* GraphQL */ `
                    type JWTPayload @jwt {
                        roles: [String!]!
                    }
    
                    type ${personType.name} @node @fulltext(indexes: [{ indexName: "${personType.name}Index", queryName: "${queryType}", fields: ["name"] }])
                    @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                        name: String!
                        born: Int!
                        actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }
    
                    type ${movieType.name} @node {
                        title: String!
                        released: Int!
                        actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
            const secret = "This is a secret";

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            await testHelper.createFulltextIndex(`${personType.name}Index`, personType.name, ["name"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            const query = /* GraphQL */ `
                    query {
                        ${queryType}(phrase: "a name") {
                            edges {
                                score
                                node {
                                    name
                                } 
                            }
                        }
                    }
                `;

            const token = createBearerToken(secret, { roles: ["admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node).toEqual({
                name: person1.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[1].node).toEqual({
                name: person2.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[2].node).toEqual({
                name: person3.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]
            );
            expect((gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[2][SCORE_FIELD]
            );
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(3);
        });

        test("Works with @auth 'roles' when unauthenticated", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const typeDefs = /* GraphQL */ `
                    type JWTPayload @jwt {
                        roles: [String!]!
                    }
    
                    type ${personType.name} @node @fulltext(indexes: [{ indexName: "${personType.name}Index", queryName: "${queryType}", fields: ["name"] }])
                    @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                        name: String!
                        born: Int!
                        actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }
    
                    type ${movieType.name} @node {
                        title: String!
                        released: Int!
                        actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
            const secret = "This is a secret";

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            await testHelper.createFulltextIndex(`${personType.name}Index`, personType.name, ["name"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            const query = /* GraphQL */ `
                    query {
                        ${queryType}(phrase: "a name") {
                            edges {
                                score
                                node {
                                    name
                                } 
                            }
                        }
                    }
                `;

            const token = createBearerToken(secret, { roles: ["not_admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("Works with @auth 'allow' when all match", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const typeDefs = /* GraphQL */ `
                    type ${personType.name} @node @fulltext(indexes: [{ indexName: "${personType.name}Index", queryName: "${queryType}", fields: ["name"] }])
                    @authorization(validate: [{ when: BEFORE, where: { node: { name_EQ: "$jwt.name" } } }]) {
                        name: String!
                        born: Int!
                        actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }
    
                    type ${movieType.name} @node {
                        title: String!
                        released: Int!
                        actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
            const secret = "This is a secret";

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            await testHelper.createFulltextIndex(`${personType.name}Index`, personType.name, ["name"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            const query = /* GraphQL */ `
                    query {
                        ${queryType}(phrase: "a name", where: { node: { name_EQ: "${person2.name}" } }) {
                            edges {
                                score
                                node {
                                    name
                                } 
                            }
                        }
                    }
                `;

            const token = createBearerToken(secret, { name: person2.name });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node.name).toBe(person2.name);
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeNumber();
            expect((gqlResult.data?.[queryType] as any).edges).toBeArrayOfSize(1);
        });

        test("Works with @auth 'allow' when one match", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const typeDefs = /* GraphQL */ `
                    type ${personType.name} @node @fulltext(indexes: [{ indexName: "${personType.name}Index", queryName: "${queryType}", fields: ["name"] }])
                    @authorization(validate: [{ when: BEFORE, where: { node: { name_EQ: "$jwt.name" } } }]) {
                        name: String!
                        born: Int!
                        actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }
    
                    type ${movieType.name} @node {
                        title: String!
                        released: Int!
                        actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
            const secret = "This is a secret";

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            await testHelper.createFulltextIndex(`${personType.name}Index`, personType.name, ["name"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            const query = /* GraphQL */ `
                    query {
                        ${queryType}(phrase: "a name") {
                            edges {
                                score
                                node {
                                    name
                                } 
                            }
                        }
                    }
                `;

            const token = createBearerToken(secret, { name: person2.name });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("Works with @auth 'roles' when only READ operation is specified", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const typeDefs = /* GraphQL */ `
                    type JWTPayload @jwt {
                        roles: [String!]!
                    }
    
                    type ${personType.name} @node @fulltext(indexes: [{ indexName: "${personType.name}Index", queryName: "${queryType}", fields: ["name"] }])
                    @authorization(validate: [{ operations: [READ], where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                        name: String!
                        born: Int!
                        actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }
    
                    type ${movieType.name} @node {
                        title: String!
                        released: Int!
                        actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
            const secret = "This is a secret";

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            await testHelper.createFulltextIndex(`${personType.name}Index`, personType.name, ["name"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            const query = /* GraphQL */ `
                    query {
                        ${queryType}(phrase: "a name") {
                            edges {
                                score
                                node {
                                    name
                                } 
                            }
                        }
                    }
                `;

            const token = createBearerToken(secret, { roles: ["not_admin"] });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("Multiple fulltext index fields", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            queryType = `${movieType.plural}Fulltext${upperFirst(movieType.name)}Index`;
            const typeDefs = /* GraphQL */ `
                    type ${personType.name} @node {
                        name: String!
                        born: Int!
                        actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }
    
                    type ${movieType.name} @node @fulltext(indexes: [{ indexName: "${movieType.name}Index", queryName: "${movieType.plural}ByTitleAndDescription", fields: ["title", "description"] }]) {
                        title: String!
                        description: String
                        released: Int!
                        actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await testHelper.createFulltextIndex(`${movieType.name}Index`, movieType.name, ["title", "description"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            const query = /* GraphQL */ `
                    query {
                        ${movieType.plural}ByTitleAndDescription(phrase: "some description") {
                            edges {
                                score
                                node {
                                    title
                                    description
                                } 
                            }
                        }
                    }
                `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[`${movieType.plural}ByTitleAndDescription`] as any).edges[0].node).toEqual({
                title: movie1.title,
                description: movie1.description,
            });
            expect((gqlResult.data?.[`${movieType.plural}ByTitleAndDescription`] as any).edges[1].node).toEqual({
                title: movie2.title,
                description: movie2.description,
            });
            expect(
                (gqlResult.data?.[`${movieType.plural}ByTitleAndDescription`] as any).edges[0][SCORE_FIELD]
            ).toBeGreaterThanOrEqual(
                (gqlResult.data?.[`${movieType.plural}ByTitleAndDescription`] as any).edges[1][SCORE_FIELD]
            );
        });

        test("Custom query name", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            personType = testHelper.createUniqueType("Person");
            queryType = "CustomQueryName";

            await testHelper.executeCypher(
                `
                        CREATE (person1:${personType.name})
                        CREATE (person2:${personType.name})
                        CREATE (person3:${personType.name})
                        SET person1 = $person1
                        SET person2 = $person2
                        SET person3 = $person3
                    `,
                { person1, person2, person3 }
            );

            const typeDefs = /* GraphQL */ `
                    type ${personType.name} @node @fulltext(indexes: [{ queryName: "${queryType}", indexName: "${personType.name}CustomIndex", fields: ["name"] }]) {
                        name: String!
                        born: Int!
                    }
                `;

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await testHelper.createFulltextIndex(`${personType.name}CustomIndex`, personType.name, ["name"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            const query = /* GraphQL */ `
                    query {
                        ${queryType}(phrase: "a different name") {
                            edges {
                                score
                                node {
                                    name
                                } 
                            }
                        }
                    }
                `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node).toEqual({
                name: person2.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[1].node).toEqual({
                name: person1.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[2].node).toEqual({
                name: person3.name,
            });
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]
            );
            expect((gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[2][SCORE_FIELD]
            );
        });

        test("Multiple index fields with custom query name", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            queryType = "SomeCustomQueryName";
            const typeDefs = /* GraphQL */ `
                    type ${movieType.name} @node @fulltext(indexes: [{ queryName: "${queryType}", indexName: "${movieType.name}Index", fields: ["title", "description"] }]) {
                        title: String!
                        description: String
                        released: Int!
                    }
                `;

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await testHelper.createFulltextIndex(`${movieType.name}Index`, movieType.name, ["title", "description"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            const query = /* GraphQL */ `
                    query {
                        ${queryType}(phrase: "some description") {
                            edges {
                                score
                                node {
                                    title
                                    description
                                } 
                            }
                        }
                    }
                `;
            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any).edges[0].node).toEqual({
                title: movie1.title,
                description: movie1.description,
            });
            expect((gqlResult.data?.[queryType] as any).edges[1].node).toEqual({
                title: movie2.title,
                description: movie2.description,
            });
            expect((gqlResult.data?.[queryType] as any).edges[0][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any).edges[1][SCORE_FIELD]
            );
        });

        test("Creating and querying multiple indexes", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            movieType = testHelper.createUniqueType("Movie");
            const queryType1 = "CustomQueryName";
            const queryType2 = "CustomQueryName2";

            await testHelper.executeCypher(
                `
                        CREATE (movie1:${movieType.name})
                        CREATE (movie2:${movieType.name})
                        SET movie1 = $movie1
                        SET movie2 = $movie2
                    `,
                { movie1, movie2 }
            );

            const typeDefs = /* GraphQL */ `
                    type ${movieType.name} @node @fulltext(indexes: [
                            { queryName: "${queryType1}", indexName: "${movieType.name}CustomIndex", fields: ["title"] },
                            { queryName: "${queryType2}", indexName: "${movieType.name}CustomIndex2", fields: ["description"] }
                        ]) {
                        title: String!
                        description: String!
                    }
                `;

            neoSchema = await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await testHelper.createFulltextIndex(`${movieType.name}CustomIndex`, movieType.name, ["title"]);
            await testHelper.createFulltextIndex(`${movieType.name}CustomIndex2`, movieType.name, ["description"]);

            await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                sessionConfig: { database: databaseName },
            });

            const query1 = /* GraphQL */ `
                    query {
                        ${queryType1}(phrase: "some title") {
                            edges {
                                score
                                node {
                                    title
                                } 
                            }
                        }
                    }
                `;
            const query2 = /* GraphQL */ `
                    query {
                        ${queryType2}(phrase: "some description") {
                            edges {
                                score
                                node {
                                    title
                                } 
                            }
                        }
                    }
                `;
            const gqlResult1 = await testHelper.executeGraphQL(query1);
            const gqlResult2 = await testHelper.executeGraphQL(query2);

            expect(gqlResult1.errors).toBeFalsy();
            expect((gqlResult1.data?.[queryType1] as any).edges[0].node).toEqual({
                title: movie1.title,
            });
            expect((gqlResult1.data?.[queryType1] as any).edges[1].node).toEqual({
                title: movie2.title,
            });
            expect((gqlResult1.data?.[queryType1] as any).edges[0][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult1.data?.[queryType1] as any).edges[1][SCORE_FIELD]
            );

            expect(gqlResult2.errors).toBeFalsy();
            expect((gqlResult2.data?.[queryType2] as any).edges[0].node).toEqual({
                title: movie1.title,
            });
            expect((gqlResult2.data?.[queryType2] as any).edges[1].node).toEqual({
                title: movie2.title,
            });
            expect((gqlResult2.data?.[queryType2] as any).edges[0][SCORE_FIELD]).toBeGreaterThanOrEqual(
                (gqlResult2.data?.[queryType2] as any).edges[1][SCORE_FIELD]
            );
        });
    });
    describe("Index Creation", () => {
        let type: UniqueType;

        const indexName1 = "indexCreationName1";
        const indexName2 = "indexCreationName2";
        const aliasName = "someFieldAlias";

        const deleteIndex1Cypher = `
            DROP INDEX ${indexName1} IF EXISTS
        `;
        const deleteIndex2Cypher = `
            DROP INDEX ${indexName2} IF EXISTS
        `;

        beforeEach(() => {
            type = testHelper.createUniqueType("Movie");
        });

        afterEach(async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            await testHelper.executeCypher(deleteIndex1Cypher);
            await testHelper.executeCypher(deleteIndex2Cypher);
        });

        test("Throws when missing index (create index and constraint option not true)", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const typeDefs = /* GraphQL */ `
                type ${type.name} @node @fulltext(indexes: [{ indexName: "${indexName1}", queryName: "${type.plural}ByTitle", fields: ["title"] }]) {
                    title: String!
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    sessionConfig: { database: databaseName },
                })
            ).rejects.toThrow(`Missing @fulltext index '${indexName1}' on Node '${type.name}'`);
        });

        test("Throws when an index is missing fields", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const typeDefs = /* GraphQL */ `
                type ${type.name} @node @fulltext(indexes: [{ indexName: "${indexName1}", queryName: "${type.plural}ByTitleAndDescription", fields: ["title", "description"] }]) {
                    title: String!
                    description: String!
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await testHelper.executeCypher(
                [`CREATE FULLTEXT INDEX ${indexName1}`, `IF NOT EXISTS FOR (n:${type.name})`, `ON EACH [n.title]`].join(
                    " "
                )
            );

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    sessionConfig: { database: databaseName },
                })
            ).rejects.toThrow(`@fulltext index '${indexName1}' on Node '${type.name}' is missing field 'description'`);
        });

        test("When using the field alias, throws when index is missing fields", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const typeDefs = /* GraphQL */ `
                type ${type.name} @node @fulltext(indexes: [{ indexName: "${indexName1}", queryName: "${type.plural}ByTitleAndDescription", fields: ["title", "description"] }]) {
                    title: String!
                    description: String! @alias(property: "${aliasName}")
                }
            `;

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await testHelper.executeCypher(
                [
                    `CREATE FULLTEXT INDEX ${indexName1}`,
                    `IF NOT EXISTS FOR (n:${type.name})`,
                    `ON EACH [n.title, n.description]`,
                ].join(" ")
            );

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    sessionConfig: { database: databaseName },
                })
            ).rejects.toThrow(
                `@fulltext index '${indexName1}' on Node '${type.name}' is missing field 'description' aliased to field '${aliasName}'`
            );
        });

        test("should not throw if index exists on an additional label", async () => {
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

            const baseType = testHelper.createUniqueType("Base");
            const additionalType = testHelper.createUniqueType("Additional");
            const typeDefs = /* GraphQL */ `
                type ${baseType.name} @node(labels: ["${baseType.name}", "${additionalType.name}"]) @fulltext(indexes: [{ indexName: "${indexName1}", queryName: "${type.plural}ByTitle", fields: ["title"] }]) {
                    title: String!
                }
            `;

            const createIndexCypher = `
                CREATE FULLTEXT INDEX ${indexName1}
                IF NOT EXISTS FOR (n:${additionalType.name})
                ON EACH [n.title]
            `;

            await testHelper.executeCypher(createIndexCypher);

            const neoSchema = await testHelper.initNeo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    sessionConfig: { database: databaseName },
                })
            ).resolves.not.toThrow();
        });
    });
});
