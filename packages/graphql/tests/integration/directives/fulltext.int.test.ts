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
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";
import { upperFirst } from "../../../src/utils/upper-first";
import { delay } from "../../../src/utils/utils";
import { isMultiDbUnsupportedError } from "../../utils/is-multi-db-unsupported-error";

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
        let session: Session;
        let neoSchema: Neo4jGraphQL;
        let generatedSchema: GraphQLSchema;
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
            released: 2001,
        };
        const movie2 = {
            title: "Another Title",
            released: 2002,
        };

        beforeEach(async () => {
            personType = generateUniqueType("Person");
            movieType = generateUniqueType("Movie");
            queryType = `${personType.plural}Fulltext${upperFirst(personType.name)}Index`;

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
                        ${personType.name} {
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
                    score: 0.62690669298172,
                    [personType.name]: {
                        name: "This is a different name",
                    },
                },
                {
                    score: 0.26449739933013916,
                    [personType.name]: {
                        name: "this is a name",
                    },
                },
                {
                    score: 0.07456067204475403,
                    [personType.name]: {
                        name: "Another name",
                    },
                },
            ]);
        });
        test("Scores update when using a different phrase", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "some name") {
                        score
                        ${personType.name} {
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
                    score: 0.07456067204475403,
                    [personType.name]: {
                        name: "Another name",
                    },
                },
                {
                    score: 0.05851973593235016,
                    [personType.name]: {
                        name: "this is a name",
                    },
                },
                {
                    score: 0.052836157381534576,
                    [personType.name]: {
                        name: "This is a different name",
                    },
                },
            ]);
        });
        test("Score isn't returned if not requested", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "some name") {
                        ${personType.name} {
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
                    [personType.name]: {
                        name: "Another name",
                    },
                },
                {
                    [personType.name]: {
                        name: "this is a name",
                    },
                },
                {
                    [personType.name]: {
                        name: "This is a different name",
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
            expect(gqlResult.data?.[queryType]).toEqual([
                {
                    score: 0.07456067204475403,
                },
                {
                    score: 0.05851973593235016,
                },
                {
                    score: 0.052836157381534576,
                },
            ]);
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
                        ${personType.name} {
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
                        ${personType.name} {
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
                    ${queryType}(phrase: "a different name", where: { ${personType.name}: { name: "${person1.name}" } }) {
                        score
                        ${personType.name} {
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
                    score: 0.26449739933013916,
                    [personType.name]: {
                        name: person1.name,
                    },
                },
            ]);
        });
        test("Filters node to multiple results", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { ${personType.name}: { born_GTE: ${person2.born} } }) {
                        score
                        ${personType.name} {
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
                    score: 0.62690669298172,
                    [personType.name]: {
                        name: "This is a different name",
                    },
                },
                {
                    score: 0.07456067204475403,
                    [personType.name]: {
                        name: "Another name",
                    },
                },
            ]);
        });
        test("Filters node to no results", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { ${personType.name}: { name_CONTAINS: "not in anything!!" } }) {
                        score
                        ${personType.name} {
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
                        ${personType.name} {
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
                    score: 0.62690669298172,
                    [personType.name]: {
                        name: "This is a different name",
                    },
                },
            ]);
        });
        test("Filters score to multiple results", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { max: 0.5 } }) {
                        score
                        ${personType.name} {
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
                    score: 0.26449739933013916,
                    [personType.name]: {
                        name: "this is a name",
                    },
                },
                {
                    score: 0.07456067204475403,
                    [personType.name]: {
                        name: "Another name",
                    },
                },
            ]);
        });
        test("Filters score to no results", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { min: 100 } }) {
                        score
                        ${personType.name} {
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
                        ${personType.name} {
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
                    score: 0.26449739933013916,
                    [personType.name]: {
                        name: "this is a name",
                    },
                },
            ]);
        });
        test("Filters score with max score of 0", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { max: 0 } }) {
                        score
                        ${personType.name} {
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
                        ${personType.name} {
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
                    ${queryType}(phrase: "a different name", where: { ${personType.name}: { actedInMovies_SOME: { title: "${movie1.title}" } } }) {
                        score
                        ${personType.name} {
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
            expect(gqlResult.data?.[queryType]).toEqual([
                {
                    score: 0.62690669298172,
                    [personType.name]: {
                        name: "This is a different name",
                        actedInMovies: [
                            {
                                title: "Some Title",
                                released: 2001,
                            },
                        ],
                    },
                },
                {
                    score: 0.26449739933013916,
                    [personType.name]: {
                        name: "this is a name",
                        actedInMovies: [
                            {
                                title: "Another Title",
                                released: 2002,
                            },
                            {
                                title: "Some Title",
                                released: 2001,
                            },
                        ],
                    },
                },
            ]);
        });
        test("Filters a related node to a single value", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { ${personType.name}: { actedInMovies_ALL: { released: ${movie1.released} } } }) {
                        score
                        ${personType.name} {
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
                    score: 0.62690669298172,
                    [personType.name]: {
                        name: "This is a different name",
                        actedInMovies: [
                            {
                                title: "Some Title",
                                released: 2001,
                            },
                        ],
                    },
                },
            ]);
        });
        test("Filters a related node to no values", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { ${personType.name}: { actedInMovies_ALL: { released_NOT_IN: [${movie1.released}, ${movie2.released}] } } }) {
                        score
                        ${personType.name} {
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
                        ${personType.name} {
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
                    ${queryType}(phrase: "some name", where: { ${personType.name}: { not_a_field: "invalid" } }) {
                        score
                        ${personType.name} {
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
                        ${personType.name} {
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
                    score: 0.07456067204475403,
                    [personType.name]: {
                        name: "Another name",
                    },
                },
                {
                    score: 0.26449739933013916,
                    [personType.name]: {
                        name: "this is a name",
                    },
                },
                {
                    score: 0.62690669298172,
                    [personType.name]: {
                        name: "This is a different name",
                    },
                },
            ]);
        });
        test("Sorting by node", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", sort: [{ ${personType.name}: { name: ASC } }]) {
                        score
                        ${personType.name} {
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
                    score: 0.07456067204475403,
                    [personType.name]: {
                        name: "Another name",
                    },
                },
                {
                    score: 0.62690669298172,
                    [personType.name]: {
                        name: "This is a different name",
                    },
                },
                {
                    score: 0.26449739933013916,
                    [personType.name]: {
                        name: "this is a name",
                    },
                },
            ]);
        });
        test("Unordered sorting", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "this is", sort: { ${personType.name}: { born: ASC, name: DESC } }) {
                        score
                        ${personType.name} {
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
                    [personType.name]: {
                        born: 1984,
                        name: "this is a name",
                    },
                    score: 0.4119553565979004,
                },
                {
                    [personType.name]: {
                        born: 1985,
                        name: "This is a different name",
                    },
                    score: 0.37194526195526123,
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
                    ${queryType}(phrase: "b", sort: [{ ${personType.name}: { born: DESC } }, { ${personType.name}: { name: ASC } }]) {
                        ${personType.name} {
                            name
                            born
                        } 
                    }
                }
            `;
            const query2 = `
                query {
                    ${queryType}(phrase: "b", sort: [{ ${personType.name}: { name: ASC } }, { ${personType.name}: { born: DESC } }]) {
                        ${personType.name} {
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
                { [personType.name]: person2 },
                { [personType.name]: person1 },
            ]);
            expect(gqlResult2.data?.[queryType]).toEqual([
                { [personType.name]: person1 },
                { [personType.name]: person2 },
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
                    ${queryType}(phrase: "b d", sort: [{ score: DESC }, { ${personType.name}: { name: ASC } }]) {
                        score
                        ${personType.name} {
                            name
                            born
                        } 
                    }
                }
            `;
            const query2 = `
                query {
                    ${queryType}(phrase: "b d", sort: [{ ${personType.name}: { name: ASC } }, { score: DESC }]) {
                        score
                        ${personType.name} {
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
                {
                    score: 1.0800554752349854,
                    [personType.name]: person2,
                },
                {
                    score: 0.41806092858314514,
                    [personType.name]: person1,
                },
            ]);
            expect(gqlResult2.data?.[queryType]).toEqual([
                {
                    score: 0.41806092858314514,
                    [personType.name]: person1,
                },
                {
                    score: 1.0800554752349854,
                    [personType.name]: person2,
                },
            ]);
        });
        test("Sort on nested field", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a name") {
                        score
                        ${personType.name} {
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
                    score: 0.26449739933013916,
                    [personType.name]: {
                        name: "this is a name",
                        actedInMovies: [
                            {
                                title: "Some Title",
                                released: 2001,
                            },
                            {
                                title: "Another Title",
                                released: 2002,
                            },
                        ],
                    },
                },
                {
                    score: 0.2388087809085846,
                    [personType.name]: {
                        name: "This is a different name",
                        actedInMovies: [
                            {
                                title: "Some Title",
                                released: 2001,
                            },
                        ],
                    },
                },
                {
                    score: 0.07456067204475403,
                    [personType.name]: {
                        name: "Another name",
                        actedInMovies: [
                            {
                                title: "Another Title",
                                released: 2002,
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
                        ${personType.name} {
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
                    score: 0.2388087809085846,
                    [personType.name]: {
                        name: "This is a different name",
                        born: 1985,
                    },
                },
                {
                    score: 0.26449739933013916,
                    [personType.name]: {
                        name: "this is a name",
                        born: 1984,
                    },
                },
            ]);
        });
        test("Limiting is possible", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a name", limit: 2) {
                        score
                        ${personType.name} {
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
                        score
                        ${personType.name} {
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
                    score: 0.07456067204475403,
                    [personType.name]: {
                        name: "Another name",
                        born: 1986,
                    },
                },
            ]);
        });
        test("Combined limiting and offesetting is possible", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a name", limit: 1, offset: 1) {
                        score
                        ${personType.name} {
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
                    score: 0.2388087809085846,
                    [personType.name]: {
                        name: "This is a different name",
                        born: 1985,
                    },
                },
            ]);
        });
        test("Throws error if invalid sort", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a name", sort: { score: "not valid" }) {
                        score
                        ${personType.name} {
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
                        ${personType.name} {
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
                        ${personType.name} {
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
                        ${personType.name} {
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
                        ${personType.name} {
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
                    [personType.name]: {
                        name: "Another name",
                    },
                },
                {
                    [personType.name]: {
                        name: "this is a name",
                    },
                },
                {
                    [personType.name]: {
                        name: "This is a different name",
                    },
                },
            ]);
        });
        test("Sort by node when node is not returned", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "this is", sort: { ${personType.name}: { born: ASC } }) {
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
            expect(gqlResult.data?.[queryType]).toEqual([
                {
                    score: 0.4119553565979004,
                },
                {
                    score: 0.37194526195526123,
                },
            ]);
        });
        test("Filters by node when node is not returned", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { ${personType.name}: { name: "${person1.name}" } }) {
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
            expect(gqlResult.data?.[queryType]).toEqual([
                {
                    score: 0.26449739933013916,
                },
            ]);
        });
        test("Filters by score when no score is returned", async () => {
            const query = `
                query {
                    ${queryType}(phrase: "a different name", where: { score: { max: 0.5 } }) {
                        ${personType.name} {
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
                    [personType.name]: {
                        name: "this is a name",
                    },
                },
                {
                    [personType.name]: {
                        name: "Another name",
                    },
                },
            ]);
        });
    });
    describe("Index Creation", () => {
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
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

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
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

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
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

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
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

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
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

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
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

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
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

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
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

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
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

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
            // Skip if multi-db not supported
            if (!MULTIDB_SUPPORT) {
                console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
                return;
            }

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
