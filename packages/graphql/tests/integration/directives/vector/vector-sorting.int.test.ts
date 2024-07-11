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
import type { UniqueType } from "../../../utils/graphql-types";
import { isMultiDbUnsupportedError } from "../../../utils/is-multi-db-unsupported-error";
import { TestHelper } from "../../../utils/tests-helper";
import { testVectors } from "./shared-vector";

describe("@vector directive - Query", () => {
    const queryName = "myQueryName";
    const testHelper = new TestHelper();

    let driver: Driver;
    let MULTIDB_SUPPORT = true;
    let VECTOR_SUPPORT = true;
    let neoSchema: Neo4jGraphQL;

    let Movie: UniqueType;

    const movie1 = {
        title: "Some Title",
        released: 2001,
        embedding: testVectors[0],
    };
    const movie2 = {
        title: "Another Title",
        released: 2002,
        embedding: testVectors[1],
    };

    beforeAll(async () => {
        const dbInfo = await testHelper.getDatabaseInfo();
        // No vector support, so we skip tests
        if (!dbInfo.gte("5.15")) {
            VECTOR_SUPPORT = false;
            await testHelper.close();
            return;
        }

        const databaseName = generate({ readable: true, charset: "alphabetic" });

        try {
            await testHelper.createDatabase(databaseName);
            driver = await testHelper.getDriver();
        } catch (e) {
            if (e instanceof Error) {
                if (isMultiDbUnsupportedError(e)) {
                    // No multi-db support, so we skip tests
                    MULTIDB_SUPPORT = false;
                    await testHelper.close();
                    return;
                } else {
                    throw e;
                }
            }
        }

        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = `
        type ${Movie.name}  @vector(indexes: [{ indexName: "${Movie}Index", embeddingProperty: "embedding", queryName: "${queryName}" }]) {
            title: String!
            released: Int!
        }`;

        neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
        await neoSchema.getSchema();

        await testHelper.executeCypher(
            `CREATE VECTOR INDEX ${Movie.name}Index
                IF NOT EXISTS FOR (n:${Movie.name})
                ON n.embedding
                OPTIONS {
                    indexConfig: {
                        \`vector.dimensions\`: 128,
                        \`vector.similarity_function\`: 'cosine'    
                    }
                }
                `
        );

        await testHelper.executeCypher(
            `
                CREATE (movie1:${Movie})
                CREATE (movie2:${Movie})
                SET movie1 = $movie1
                SET movie2 = $movie2
                        `,
            { movie1, movie2 }
        );

        await neoSchema.assertIndexesAndConstraints({
            driver,
            sessionConfig: { database: databaseName },
            options: { create: true },
        });
    });

    afterAll(async () => {
        if (MULTIDB_SUPPORT && VECTOR_SUPPORT) {
            await testHelper.dropDatabase();
            await testHelper.close();
        }
    });

    test("Retrieve nodes ordered by score DESC", async () => {
        // Skip if vector not supported
        if (!VECTOR_SUPPORT) {
            console.log("VECTOR SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const query = `
                query($vector: [Float!]) {
                    ${queryName}(vector: $vector, sort: {score: DESC} ) {
                        ${Movie.operations.connection}{
                            edges {
                                score
                                node {
                                    title
                                }
                            }
                        }
                    }
                }
            `;
        const gqlResult = await testHelper.executeGraphQL(query, { variableValues: { vector: testVectors[0] } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [queryName]: {
                [Movie.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "Some Title",
                            },
                            score: 1,
                        },
                        {
                            node: {
                                title: "Another Title",
                            },
                            score: expect.closeTo(0.56),
                        },
                    ],
                },
            },
        });
    });

    test("Retrieve nodes ordered by score ASC", async () => {
        // Skip if vector not supported
        if (!VECTOR_SUPPORT) {
            console.log("VECTOR SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const query = `
                query($vector: [Float!]) {
                    ${queryName}(vector: $vector, sort: {score: ASC} ) {
                        ${Movie.operations.connection}{
                            edges {
                                score
                                node {
                                    title
                                }
                            }
                        }
                    }
                }
            `;
        const gqlResult = await testHelper.executeGraphQL(query, { variableValues: { vector: testVectors[0] } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [queryName]: {
                [Movie.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "Another Title",
                            },
                            score: expect.closeTo(0.56),
                        },
                        {
                            node: {
                                title: "Some Title",
                            },
                            score: 1,
                        },
                    ],
                },
            },
        });
    });

    test("Retrieve nodes ordered by node property", async () => {
        // Skip if vector not supported
        if (!VECTOR_SUPPORT) {
            console.log("VECTOR SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        // Skip if multi-db not supported
        if (!MULTIDB_SUPPORT) {
            console.log("MULTIDB_SUPPORT NOT AVAILABLE - SKIPPING");
            return;
        }

        const query = `
                query($vector: [Float!]) {
                    ${queryName}(vector: $vector, sort: {node: {title: ASC}} ) {
                        ${Movie.operations.connection}{
                            edges {
                                score
                                node {
                                    title
                                }
                            }
                        }
                    }
                }
            `;
        const gqlResult = await testHelper.executeGraphQL(query, { variableValues: { vector: testVectors[0] } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [queryName]: {
                [Movie.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "Another Title",
                            },
                            score: expect.closeTo(0.56),
                        },
                        {
                            node: {
                                title: "Some Title",
                            },
                            score: 1,
                        },
                    ],
                },
            },
        });
    });
});
