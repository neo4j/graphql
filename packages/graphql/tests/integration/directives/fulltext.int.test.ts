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

import { gql } from "apollo-server";
import type { Driver, Session } from "neo4j-driver";
import { graphql, GraphQLSchema } from "graphql";
import { generate } from "randomstring";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";
import { lowerFirst } from "../../../src/utils/lower-first";
import { upperFirst } from "../../../src/utils/upper-first";
import { delay } from "../../../src/utils/utils";
import { isMultiDbUnsupportedError } from "../../utils/is-multi-db-unsupported-error";
import { createJwtRequest } from "../../utils/create-jwt-request";

function generatedTypeDefs(personType: UniqueType, movieType: UniqueType): string {
    return `
        type ${personType.name} @fulltext(indexes: [{ name: "${personType.name}Index", fields: ["name"] }]) {
            name: String!
            born: Int!
            actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
        }

        type ${movieType.name} {
            title: String!
            released: Int!
            actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    `;
}

describe("@fulltext directive", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let databaseName: string;
    let MULTIDB_SUPPORT = true;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        databaseName = generate({ readable: true, charset: "alphabetic" });

        const cypher = `CREATE DATABASE ${databaseName}`;
        const session = driver.session();

        try {
            await session.run(cypher);
        } catch (e) {
            if (e instanceof Error) {
                if (isMultiDbUnsupportedError(e)) {
                    // No multi-db support, so we skip tests
                    MULTIDB_SUPPORT = false;
                } else {
                    throw e;
                }
            }
        } finally {
            await session.close();
        }

        await delay(5000);
    });

    afterAll(async () => {
        if (MULTIDB_SUPPORT) {
            const cypher = `DROP DATABASE ${databaseName}`;

            const session = await neo4j.getSession();
            try {
                await session.run(cypher);
            } finally {
                await session.close();
            }
        }

        await driver.close();
    });
    describe("Functionality", () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        let session: Session;
        let neoSchema: Neo4jGraphQL;
        let generatedSchema: GraphQLSchema;
        let personType: UniqueType;
        let movieType: UniqueType;
        let personTypeLowerFirst: string;
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
            personType = generateUniqueType("Person");
            movieType = generateUniqueType("Movie");
            queryType = `${personType.plural}Fulltext${upperFirst(personType.name)}Index`;
            personTypeLowerFirst = lowerFirst(personType.name);

            const typeDefs = generatedTypeDefs(personType, movieType);

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
            });
            generatedSchema = await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            });

            session = driver.session({ database: databaseName });

            try {
                await session.run(
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
            } finally {
                await session.close();
            }
        });
        test("Orders by score DESC as default", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name") {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst]).toEqual({
                name: person2.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[1][personTypeLowerFirst]).toEqual({
                name: person1.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[2][personTypeLowerFirst]).toEqual({
                name: person3.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[1].score
            );
            expect((gqlResult.data?.[queryType] as any[])[1].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[2].score
            );
        });
        test("Order updates when using a different phrase", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "some name") {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst]).toEqual({
                name: person3.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[1][personTypeLowerFirst]).toEqual({
                name: person1.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[2][personTypeLowerFirst]).toEqual({
                name: person2.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[1].score
            );
            expect((gqlResult.data?.[queryType] as any[])[1].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[2].score
            );
        });
        test("Score isn't returned if not requested", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "some name") {
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([
                {
                    [personTypeLowerFirst]: {
                        name: person3.name,
                    },
                },
                {
                    [personTypeLowerFirst]: {
                        name: person1.name,
                    },
                },
                {
                    [personTypeLowerFirst]: {
                        name: person2.name,
                    },
                },
            ]);
        });
        test("Nodes aren't returned if not requested", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "some name") {
                        score
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst]).toBeUndefined();
            expect((gqlResult.data?.[queryType] as any[])[1][personTypeLowerFirst]).toBeUndefined();
            expect((gqlResult.data?.[queryType] as any[])[2][personTypeLowerFirst]).toBeUndefined();
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[1].score
            );
            expect((gqlResult.data?.[queryType] as any[])[1].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[2].score
            );
        });
        test("Throws error if no return is requested", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "some name") {}
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeDefined();
        });
        test("Throws error if no phrase argument", async () => {
            const query = `
                query {
                    ${queryType} {
                        ${personTypeLowerFirst} {
                            name
                        }
                    } 
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeDefined();
        });
        test("No results if phrase doesn't match", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "should not match") {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([]);
        });
        test("Filters node to single result", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { ${personTypeLowerFirst}: { name: "${person1.name}" } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst].name).toBe(person1.name);
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeNumber();
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(1);
        });
        test("Filters node to multiple results", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { ${personTypeLowerFirst}: { born_GTE: ${person2.born} } }) {
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([
                {
                    [personTypeLowerFirst]: {
                        name: person2.name,
                    },
                },
                {
                    [personTypeLowerFirst]: {
                        name: person3.name,
                    },
                },
            ]);
        });
        test("Filters node to no results", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { ${lowerFirst(
                personType.name
            )}: { name_CONTAINS: "not in anything!!" } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([]);
        });
        test("Filters score to single result", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { min: 0.5 } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst].name).toBe(
                person2.name
            );
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeNumber();
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(1);
        });
        test("Filters score to multiple results", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { max: 0.5 } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst].name).toBe(person1.name);
            expect((gqlResult.data?.[queryType] as any[])[1][personTypeLowerFirst].name).toBe(person3.name);
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[1].score
            );
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(2);
        });
        test("Filters score to no results", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { min: 100 } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([]);
        });
        test("Filters score with combined min and max", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { min: 0.201, max: 0.57 } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst].name).toBe(person1.name);
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeNumber();
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(1);
        });
        test("Filters score with max score of 0", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { max: 0 } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([]);
        });
        test("Throws error if score filtered with a non-number", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { max: "not a number" } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeDefined();
        });
        test("Filters a related node to multiple values", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { ${lowerFirst(
                personType.name
            )}: { actedInMovies_SOME: { title: "${movie1.title}" } } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                            actedInMovies(options: { sort: [{ released: DESC }] }) {
                                title
                                released
                            }
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst].name).toBe(
                person2.name
            );
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst].actedInMovies).toEqual([
                {
                    title: movie1.title,
                    released: movie1.released,
                },
            ]);
            expect((gqlResult.data?.[queryType] as any[])[1][personTypeLowerFirst].name).toBe(person1.name);
            expect((gqlResult.data?.[queryType] as any[])[1][personTypeLowerFirst].actedInMovies).toEqual([
                {
                    title: movie2.title,
                    released: movie2.released,
                },
                {
                    title: movie1.title,
                    released: movie1.released,
                },
            ]);
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[1].score
            );
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(2);
        });
        test("Filters a related node to a single value", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { ${lowerFirst(
                personType.name
            )}: { actedInMovies_ALL: { released: ${movie1.released} } } }) {
                        ${personTypeLowerFirst} {
                            name
                            actedInMovies {
                                title
                                released
                            }
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([
                {
                    [personTypeLowerFirst]: {
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
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { ${lowerFirst(
                personType.name
            )}: { actedInMovies_ALL: { released_NOT_IN: [${movie1.released}, ${movie2.released}] } } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                            actedInMovies {
                                title
                                released
                            }
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([]);
        });
        test("Throws an error for a non-string phrase", async () => {
            const query = `
                query {
                    ${queryType}(phrase: ["not", "a", "string"]) {
                        score
                        ${personTypeLowerFirst} {
                            name
                            actedInMovies {
                                title
                                released
                            }
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeDefined();
        });
        test("Throws an error for an invalid where", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "some name", where: { ${lowerFirst(
                personType.name
            )}: { not_a_field: "invalid" } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                            actedInMovies {
                                title
                                released
                            }
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeDefined();
        });
        test("Sorting by score ascending", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", sort: { score: ASC }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst].name).toBe(person3.name);
            expect((gqlResult.data?.[queryType] as any[])[1][personTypeLowerFirst].name).toBe(person1.name);
            expect((gqlResult.data?.[queryType] as any[])[2][personTypeLowerFirst].name).toBe(
                person2.name
            );
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeLessThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[1].score
            );
            expect((gqlResult.data?.[queryType] as any[])[1].score).toBeLessThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[2].score
            );
        });
        test("Sorting by node", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", sort: [{ ${lowerFirst(
                personType.name
            )}: { name: ASC } }]) {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst].name).toBe(person3.name);
            expect((gqlResult.data?.[queryType] as any[])[1][personTypeLowerFirst].name).toBe(
                person2.name
            );
            expect((gqlResult.data?.[queryType] as any[])[2][personTypeLowerFirst].name).toBe(person1.name);
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeNumber();
            expect((gqlResult.data?.[queryType] as any[])[1].score).toBeNumber();
            expect((gqlResult.data?.[queryType] as any[])[2].score).toBeNumber();
        });
        test("Unordered sorting", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "this is", sort: { ${lowerFirst(
                personType.name
            )}: { born: ASC, name: DESC } }) {
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([
                {
                    [personTypeLowerFirst]: person1,
                },
                {
                    [personTypeLowerFirst]: person2,
                },
            ]);
        });
        test("Ordered sorting, no score", async () => {
            const person1 = {
                name: "a b c",
                born: 123,
            };
            const person2 = {
                name: "b c d",
                born: 234,
            };

            session = driver.session({ database: databaseName });

            try {
                await session.run(
                    `
                CREATE (person1:${personType.name})
                CREATE (person2:${personType.name})
                SET person1 = $person1
                SET person2 = $person2
            `,
                    { person1, person2 }
                );
            } finally {
                await session.close();
            }

            const query1 = `
                query {
                    ${queryType}(phrase: "b", sort: [{ ${personTypeLowerFirst}: { born: DESC } }, { ${lowerFirst(
                personType.name
            )}: { name: ASC } }]) {
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const query2 = `
                query {
                    ${queryType}(phrase: "b", sort: [{ ${personTypeLowerFirst}: { name: ASC } }, { ${lowerFirst(
                personType.name
            )}: { born: DESC } }]) {
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const gqlResult1 = await graphql({
                schema: generatedSchema,
                source: query1,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });
            const gqlResult2 = await graphql({
                schema: generatedSchema,
                source: query2,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult1.errors).toBeFalsy();
            expect(gqlResult2.errors).toBeFalsy();
            expect(gqlResult1.data?.[queryType]).toEqual([
                { [personTypeLowerFirst]: person2 },
                { [personTypeLowerFirst]: person1 },
            ]);
            expect(gqlResult2.data?.[queryType]).toEqual([
                { [personTypeLowerFirst]: person1 },
                { [personTypeLowerFirst]: person2 },
            ]);
        });
        test("Ordered sorting, with score", async () => {
            const person1 = {
                name: "a b c",
                born: 123,
            };
            const person2 = {
                name: "b c d",
                born: 234,
            };

            session = driver.session({ database: databaseName });

            try {
                await session.run(
                    `
                CREATE (person1:${personType.name})
                CREATE (person2:${personType.name})
                SET person1 = $person1
                SET person2 = $person2
            `,
                    { person1, person2 }
                );
            } finally {
                await session.close();
            }

            const query1 = `
                query {
                    ${queryType}(phrase: "b d", sort: [{ score: DESC }, { ${lowerFirst(
                personType.name
            )}: { name: ASC } }]) {
                        score
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const query2 = `
                query {
                    ${queryType}(phrase: "b d", sort: [{ ${lowerFirst(
                personType.name
            )}: { name: ASC } }, { score: DESC }]) {
                        score
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const gqlResult1 = await graphql({
                schema: generatedSchema,
                source: query1,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });
            const gqlResult2 = await graphql({
                schema: generatedSchema,
                source: query2,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult1.errors).toBeFalsy();
            expect(gqlResult2.errors).toBeFalsy();
            expect((gqlResult1.data?.[queryType] as any[])[0][personTypeLowerFirst]).toEqual(person2);
            expect((gqlResult1.data?.[queryType] as any[])[0].score).toBeNumber();
            expect((gqlResult1.data?.[queryType] as any[])[1][personTypeLowerFirst]).toEqual(person1);
            expect((gqlResult1.data?.[queryType] as any[])[1].score).toBeNumber();
            expect((gqlResult2.data?.[queryType] as any[])[0][personTypeLowerFirst]).toEqual(person1);
            expect((gqlResult2.data?.[queryType] as any[])[0].score).toBeNumber();
            expect((gqlResult2.data?.[queryType] as any[])[1][personTypeLowerFirst]).toEqual(person2);
            expect((gqlResult2.data?.[queryType] as any[])[1].score).toBeNumber();
        });
        test("Sort on nested field", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a name") {
                        ${personTypeLowerFirst} {
                            name
                            actedInMovies(options: { sort: [{ released: ASC }] }) {
                                title
                                released
                            }
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([
                {
                    [personTypeLowerFirst]: {
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
                    [personTypeLowerFirst]: {
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
                    [personTypeLowerFirst]: {
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
            const query = `
                query {
                    ${queryType}(phrase: "a name", sort: { score: ASC }, where: { score: { min: 0.2 } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst]).toEqual(person2);
            expect((gqlResult.data?.[queryType] as any[])[1][personTypeLowerFirst]).toEqual(person1);
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeLessThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[1].score
            );
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(2);
        });
        test("Limiting is possible", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a name", limit: 2) {
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toBeArrayOfSize(2);
        });
        test("Offesetting is possible", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a name", offset: 2) {
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([
                {
                    [personTypeLowerFirst]: person3,
                },
            ]);
        });
        test("Combined limiting and offesetting is possible", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a name", limit: 1, offset: 1) {
                        score
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst]).toEqual(person2);
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeNumber();
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(1);
        });
        test("Throws error if invalid sort", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a name", sort: { score: "not valid" }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeDefined();
        });
        test("Throws error if invalid offset", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a name", offset: 0.5) {
                        score
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeDefined();
        });
        test("Throws error if invalid limit", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a name", limit: 0.5) {
                        score
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeDefined();
        });
        test("Throws error if if invalid argument is suplied", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a name", not_a_valid_argument: [1, 2, 3]) {
                        score
                        ${personTypeLowerFirst} {
                            name
                            born
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeDefined();
        });
        test("Sorting by score when the score is not returned", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", sort: { score: ASC }) {
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([
                {
                    [personTypeLowerFirst]: {
                        name: person3.name,
                    },
                },
                {
                    [personTypeLowerFirst]: {
                        name: person1.name,
                    },
                },
                {
                    [personTypeLowerFirst]: {
                        name: person2.name,
                    },
                },
            ]);
        });
        test("Sort by node when node is not returned", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "this is", sort: { ${personTypeLowerFirst}: { born: ASC } }) {
                        score
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeNumber();
            expect((gqlResult.data?.[queryType] as any[])[1].score).toBeNumber();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst]).toBeUndefined();
            expect((gqlResult.data?.[queryType] as any[])[1][personTypeLowerFirst]).toBeUndefined();
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(2);
        });
        test("Filters by node when node is not returned", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { ${personTypeLowerFirst}: { name: "${person1.name}" } }) {
                        score
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeNumber();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst]).toBeUndefined();
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(1);
        });
        test("Filters by score when no score is returned", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { max: 0.5 } }) {
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType]).toEqual([
                {
                    [personTypeLowerFirst]: {
                        name: person1.name,
                    },
                },
                {
                    [personTypeLowerFirst]: {
                        name: person3.name,
                    },
                },
            ]);
        });
        test("Works with @auth 'where' when authenticated", async () => {
            const typeDefs = `
                type ${personType.name} @fulltext(indexes: [{ name: "${personType.name}Index", fields: ["name"] }])
                @auth(rules: [{ where: { name: "$jwt.name" } }]) {
                    name: String!
                    born: Int!
                    actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type ${movieType.name} {
                    title: String!
                    released: Int!
                    actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const secret = "This is a secret";

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });
            generatedSchema = await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            });

            const query = `
                query {
                    ${queryType}(phrase: "a name") {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;

            const req = createJwtRequest(secret, { name: person1.name });

            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    req,
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst]).toEqual({
                name: person1.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeNumber();
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(1);
        });
        test("Works with @auth 'where' when unauthenticated", async () => {
            const typeDefs = `
                type ${personType.name} @fulltext(indexes: [{ name: "${personType.name}Index", fields: ["name"] }])
                @auth(rules: [{ where: { name: "$jwt.name" } }]) {
                    name: String!
                    born: Int!
                    actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type ${movieType.name} {
                    title: String!
                    released: Int!
                    actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const secret = "This is a secret";

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });
            generatedSchema = await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            });

            const query = `
                query {
                    ${queryType}(phrase: "a name") {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;

            const req = createJwtRequest(secret, { name: "Not a name" });

            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    req,
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(0);
        });
        test("Works with @auth 'roles' when authenticated", async () => {
            const typeDefs = `
                type ${personType.name} @fulltext(indexes: [{ name: "${personType.name}Index", fields: ["name"] }])
                @auth(rules: [{ roles: ["admin"] }]) {
                    name: String!
                    born: Int!
                    actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type ${movieType.name} {
                    title: String!
                    released: Int!
                    actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const secret = "This is a secret";

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });
            generatedSchema = await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            });

            const query = `
                query {
                    ${queryType}(phrase: "a name") {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;

            const req = createJwtRequest(secret, { roles: ["admin"] });

            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    req,
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst]).toEqual({
                name: person1.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[1][personTypeLowerFirst]).toEqual({
                name: person2.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[2][personTypeLowerFirst]).toEqual({
                name: person3.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[1].score
            );
            expect((gqlResult.data?.[queryType] as any[])[1].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[2].score
            );
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(3);
        });
        test("Works with @auth 'roles' when unauthenticated", async () => {
            const typeDefs = `
                type ${personType.name} @fulltext(indexes: [{ name: "${personType.name}Index", fields: ["name"] }])
                @auth(rules: [{ roles: ["admin"] }]) {
                    name: String!
                    born: Int!
                    actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type ${movieType.name} {
                    title: String!
                    released: Int!
                    actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const secret = "This is a secret";

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });
            generatedSchema = await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            });

            const query = `
                query {
                    ${queryType}(phrase: "a name") {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;

            const req = createJwtRequest(secret, { roles: ["not_admin"] });

            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    req,
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeDefined();
        });
        test("Works with @auth 'allow' when all match", async () => {
            const typeDefs = `
                type ${personType.name} @fulltext(indexes: [{ name: "${personType.name}Index", fields: ["name"] }])
                @auth(rules: [{ allow: { name: "$jwt.name" } }]) {
                    name: String!
                    born: Int!
                    actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type ${movieType.name} {
                    title: String!
                    released: Int!
                    actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const secret = "This is a secret";

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });
            generatedSchema = await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            });

            const query = `
                query {
                    ${queryType}(phrase: "a name", where: { ${personTypeLowerFirst}: { name: "${person2.name}" } }) {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;

            const req = createJwtRequest(secret, { name: person2.name });

            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    req,
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst].name).toBe(person2.name);
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeNumber();
            expect(gqlResult.data?.[queryType] as any[]).toBeArrayOfSize(1);
        });
        test("Works with @auth 'allow' when one match", async () => {
            const typeDefs = `
                type ${personType.name} @fulltext(indexes: [{ name: "${personType.name}Index", fields: ["name"] }])
                @auth(rules: [{ allow: { name: "$jwt.name" } }]) {
                    name: String!
                    born: Int!
                    actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type ${movieType.name} {
                    title: String!
                    released: Int!
                    actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const secret = "This is a secret";

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });
            generatedSchema = await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            });

            const query = `
                query {
                    ${queryType}(phrase: "a name") {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;

            const req = createJwtRequest(secret, { name: person2.name });

            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    req,
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeDefined();
        });
        test("Works with @auth 'roles' when only READ operation is specified", async () => {
            const typeDefs = `
                type ${personType.name} @fulltext(indexes: [{ name: "${personType.name}Index", fields: ["name"] }])
                @auth(rules: [{ roles: ["admin"], operations: [READ] }]) {
                    name: String!
                    born: Int!
                    actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type ${movieType.name} {
                    title: String!
                    released: Int!
                    actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const secret = "This is a secret";

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });
            generatedSchema = await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            });

            const query = `
                query {
                    ${queryType}(phrase: "a name") {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;

            const req = createJwtRequest(secret, { roles: ["not_admin"] });

            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    req,
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeDefined();
        });
        test("Multiple fulltext index fields", async () => {
            const moveTypeLowerFirst = lowerFirst(movieType.name);
            queryType = `${movieType.plural}Fulltext${upperFirst(movieType.name)}Index`;
            const typeDefs = `
                type ${personType.name} {
                    name: String!
                    born: Int!
                    actedInMovies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type ${movieType.name} @fulltext(indexes: [{ name: "${movieType.name}Index", fields: ["title", "description"] }]) {
                    title: String!
                    description: String
                    released: Int!
                    actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
            });
            generatedSchema = await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            });

            const query = `
                query {
                    ${queryType}(phrase: "some description") {
                        score
                        ${moveTypeLowerFirst} {
                            title
                            description
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][moveTypeLowerFirst]).toEqual({
                title: movie1.title,
                description: movie1.description,
            });
            expect((gqlResult.data?.[queryType] as any[])[1][moveTypeLowerFirst]).toEqual({
                title: movie2.title,
                description: movie2.description,
            });
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[1].score
            );
        });
        test("Custom query name", async () => {
            personType = generateUniqueType("Person");
            personTypeLowerFirst = lowerFirst(personType.name);
            queryType = "CustomQueryName";

            session = driver.session({ database: databaseName });

            try {
                await session.run(
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
            } finally {
                await session.close();
            }

            const typeDefs = `
                type ${personType.name} @fulltext(indexes: [{ queryName: "${queryType}", name: "${personType.name}CustomIndex", fields: ["name"] }]) {
                    name: String!
                    born: Int!
                }
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
            });
            generatedSchema = await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            });

            const query = `
                query {
                    ${queryType}(phrase: "a different name") {
                        score
                        ${personTypeLowerFirst} {
                            name
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][personTypeLowerFirst]).toEqual({
                name: person2.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[1][personTypeLowerFirst]).toEqual({
                name: person1.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[2][personTypeLowerFirst]).toEqual({
                name: person3.name,
            });
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[1].score
            );
            expect((gqlResult.data?.[queryType] as any[])[1].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[2].score
            );
        });
        test("Multiple index fields with custom query name", async () => {
            const moveTypeLowerFirst = lowerFirst(movieType.name);
            queryType = "SomeCustomQueryName";
            const typeDefs = `
                type ${movieType.name} @fulltext(indexes: [{ queryName: "${queryType}", name: "${movieType.name}Index", fields: ["title", "description"] }]) {
                    title: String!
                    description: String
                    released: Int!
                }
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                driver,
            });
            generatedSchema = await neoSchema.getSchema();
            await neoSchema.assertIndexesAndConstraints({
                driver,
                driverConfig: { database: databaseName },
                options: { create: true },
            });

            const query = `
                query {
                    ${queryType}(phrase: "some description") {
                        score
                        ${moveTypeLowerFirst} {
                            title
                            description
                        } 
                    }
                }
            `;
            const gqlResult = await graphql({
                schema: generatedSchema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: { database: databaseName },
                },
            });

            expect(gqlResult.errors).toBeFalsy();
            expect((gqlResult.data?.[queryType] as any[])[0][moveTypeLowerFirst]).toEqual({
                title: movie1.title,
                description: movie1.description,
            });
            expect((gqlResult.data?.[queryType] as any[])[1][moveTypeLowerFirst]).toEqual({
                title: movie2.title,
                description: movie2.description,
            });
            expect((gqlResult.data?.[queryType] as any[])[0].score).toBeGreaterThanOrEqual(
                (gqlResult.data?.[queryType] as any[])[1].score
            );
        });
    });
    describe("Index Creation", () => {
        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        let type: UniqueType;

        const indexName1 = "indexCreationName1";
        const indexName2 = "indexCreationName2";
        const label = "someCustomLabel";
        const aliasName = "someFieldAlias";

        const indexQueryCypher = `
            SHOW INDEXES yield
                name AS name,
                type AS type,
                entityType AS entityType,
                labelsOrTypes AS labelsOrTypes,
                properties AS properties
            WHERE name = "${indexName1}" OR name = "${indexName2}"
            RETURN {
                name: name,
                type: type,
                entityType: entityType,
                labelsOrTypes: labelsOrTypes,
                properties: properties
            } as result
            ORDER BY result.name ASC
        `;

        const deleteIndex1Cypher = `
            DROP INDEX ${indexName1} IF EXISTS
        `;
        const deleteIndex2Cypher = `
            DROP INDEX ${indexName2} IF EXISTS
        `;

        beforeEach(() => {
            type = generateUniqueType("Movie");
        });

        afterEach(async () => {
            const session = driver.session({ database: databaseName });

            try {
                await session.run(deleteIndex1Cypher);
                await session.run(deleteIndex2Cypher);
            } finally {
                await session.close();
            }
        });

        test("Creates index if it doesn't exist", async () => {
            const typeDefs = gql`
            type ${type.name} @fulltext(indexes: [{ name: "${indexName1}", fields: ["title"] }]) {
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            try {
                const result = await session.run(indexQueryCypher);

                expect(result.records[0].get("result")).toEqual({
                    name: indexName1,
                    type: "FULLTEXT",
                    entityType: "NODE",
                    labelsOrTypes: [type.name],
                    properties: ["title"],
                });
            } finally {
                await session.close();
            }
        });
        test("Creates two index's if they dont exist", async () => {
            const typeDefs = gql`
                type ${type.name} @fulltext(indexes: [{ name: "${indexName1}", fields: ["title"] }, { name: "${indexName2}", fields: ["description"] }]) {
                    title: String!
                    description: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            try {
                const result = await session.run(indexQueryCypher);

                expect(result.records[0].get("result")).toEqual({
                    name: indexName1,
                    type: "FULLTEXT",
                    entityType: "NODE",
                    labelsOrTypes: [type.name],
                    properties: ["title"],
                });
                expect(result.records[1].get("result")).toEqual({
                    name: indexName2,
                    type: "FULLTEXT",
                    entityType: "NODE",
                    labelsOrTypes: [type.name],
                    properties: ["description"],
                });
            } finally {
                await session.close();
            }
        });
        test("When using the node label, creates index if it doesn't exist", async () => {
            const typeDefs = gql`
                type ${type.name} @fulltext(indexes: [{ name: "${indexName1}", fields: ["title"] }]) @node(label: "${label}") {
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            try {
                const result = await session.run(indexQueryCypher);

                expect(result.records[0].get("result")).toEqual({
                    name: indexName1,
                    type: "FULLTEXT",
                    entityType: "NODE",
                    labelsOrTypes: [label],
                    properties: ["title"],
                });
            } finally {
                await session.close();
            }
        });
        test("When using the field alias, creates index if it doesn't exist", async () => {
            const typeDefs = gql`
                type ${type.name} @fulltext(indexes: [{ name: "${indexName1}", fields: ["title"] }]) @node(label: "${label}") {
                    title: String! @alias(property: "${aliasName}")
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            try {
                const result = await session.run(indexQueryCypher);

                expect(result.records[0].get("result")).toEqual({
                    name: indexName1,
                    type: "FULLTEXT",
                    entityType: "NODE",
                    labelsOrTypes: [label],
                    properties: [aliasName],
                });
            } finally {
                await session.close();
            }
        });
        test("Throws when missing index (create index and constraint option not true)", async () => {
            const typeDefs = gql`
                type ${type.name} @fulltext(indexes: [{ name: "${indexName1}", fields: ["title"] }]) {
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                })
            ).rejects.toThrow(`Missing @fulltext index '${indexName1}' on Node '${type.name}'`);
        });
        test("Throws when an index is missing fields", async () => {
            const typeDefs = gql`
                type ${type.name} @fulltext(indexes: [{ name: "${indexName1}", fields: ["title", "description"] }]) {
                    title: String!
                    description: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            const session = driver.session({ database: databaseName });

            try {
                await session.run(
                    [
                        `CREATE FULLTEXT INDEX ${indexName1}`,
                        `IF NOT EXISTS FOR (n:${type.name})`,
                        `ON EACH [n.title]`,
                    ].join(" ")
                );
            } finally {
                await session.close();
            }

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                })
            ).rejects.toThrow(`@fulltext index '${indexName1}' on Node '${type.name}' is missing field 'description'`);
        });
        test("When using the field alias, throws when index is missing fields", async () => {
            const typeDefs = gql`
                type ${type.name} @fulltext(indexes: [{ name: "${indexName1}", fields: ["title", "description"] }]) {
                    title: String!
                    description: String! @alias(property: "${aliasName}")
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            const session = driver.session({ database: databaseName });

            try {
                await session.run(
                    [
                        `CREATE FULLTEXT INDEX ${indexName1}`,
                        `IF NOT EXISTS FOR (n:${type.name})`,
                        `ON EACH [n.title, n.description]`,
                    ].join(" ")
                );
            } finally {
                await session.close();
            }

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                })
            ).rejects.toThrow(
                `@fulltext index '${indexName1}' on Node '${type.name}' is missing field 'description' aliased to field '${aliasName}'`
            );
        });
        test("Doesn't throw if an index exists", async () => {
            const typeDefs = gql`
                type ${type.name} @fulltext(indexes: [{ name: "${indexName1}", fields: ["title"] }]) {
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                })
            ).resolves.not.toThrow();
        });
        test("Throws when index is missing fields when used with create option", async () => {
            const typeDefs = gql`
                type ${type.name} @fulltext(indexes: [{ name: "${indexName1}", fields: ["title", "description"] }]) {
                    title: String!
                    description: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            const session = driver.session({ database: databaseName });

            try {
                await session.run(
                    [
                        `CREATE FULLTEXT INDEX ${indexName1}`,
                        `IF NOT EXISTS FOR (n:${type.name})`,
                        `ON EACH [n.title]`,
                    ].join(" ")
                );
            } finally {
                await session.close();
            }

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).rejects.toThrow(
                `@fulltext index '${indexName1}' on Node '${type.name}' already exists, but is missing field 'description'`
            );
        });
        test("Create index for ID field if it doesn't exist", async () => {
            const typeDefs = gql`
                type ${type.name} @fulltext(indexes: [{ name: "${indexName1}", fields: ["id"] }]) {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await neoSchema.getSchema();

            await expect(
                neoSchema.assertIndexesAndConstraints({
                    driver,
                    driverConfig: { database: databaseName },
                    options: { create: true },
                })
            ).resolves.not.toThrow();

            const session = driver.session({ database: databaseName });

            try {
                const result = await session.run(indexQueryCypher);

                expect(result.records[0].get("result")).toEqual({
                    name: indexName1,
                    type: "FULLTEXT",
                    entityType: "NODE",
                    labelsOrTypes: [type.name],
                    properties: ["id"],
                });
            } finally {
                await session.close();
            }
        });
    });
});
