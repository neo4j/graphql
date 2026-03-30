/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import console from "console";
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

        const typeDefs = /* GraphQL */ `
        type ${Movie.name} @vector(indexes: [{ indexName: "${Movie}Index", embeddingProperty: "embedding", queryName: "${queryName}" }]) @node {
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

        const query = /* GraphQL */ `
                query($vector: [Float!]) {
                    ${queryName}(vector: $vector, sort: {score: DESC} ) {
                        edges {
                            score
                            node {
                                title
                            }
                        }
                    }
                }
            `;
        const gqlResult = await testHelper.executeGraphQL(query, { variableValues: { vector: testVectors[0] } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [queryName]: {
                edges: [
                    {
                        node: {
                            title: "Some Title",
                        },
                        score: expect.closeTo(1),
                    },
                    {
                        node: {
                            title: "Another Title",
                        },
                        score: expect.closeTo(0.56),
                    },
                ],
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

        const query = /* GraphQL */ `
                query($vector: [Float!]) {
                    ${queryName}(vector: $vector, sort: {score: ASC} ) {
                        edges {
                            score
                            node {
                                title
                            }
                        }
                    }
                }
            `;
        const gqlResult = await testHelper.executeGraphQL(query, { variableValues: { vector: testVectors[0] } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [queryName]: {
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
                        score: expect.closeTo(1),
                    },
                ],
            },
        });
    });

    test("Retrieve nodes ordered by score DESC without score in selection set", async () => {
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

        const query = /* GraphQL */ `
                query($vector: [Float!]) {
                    ${queryName}(vector: $vector, sort: {score: DESC} ) {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            `;
        const gqlResult = await testHelper.executeGraphQL(query, { variableValues: { vector: testVectors[0] } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [queryName]: {
                edges: [
                    {
                        node: {
                            title: "Some Title",
                        },
                    },
                    {
                        node: {
                            title: "Another Title",
                        },
                    },
                ],
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

        const query = /* GraphQL */ `
                query($vector: [Float!]) {
                    ${queryName}(vector: $vector, sort: {node: {title: ASC}} ) {
                        edges {
                            score
                            node {
                                title
                            }
                        }
                    }
                }
            `;
        const gqlResult = await testHelper.executeGraphQL(query, { variableValues: { vector: testVectors[0] } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [queryName]: {
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
                        score: expect.closeTo(1),
                    },
                ],
            },
        });
    });

    test("Retrieve nodes ordered by node property first and score second", async () => {
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

        const query = /* GraphQL */ `
                query($vector: [Float!]) {
                    ${queryName}(vector: $vector, sort: [{node: {title: DESC}}, { score: ASC }] ) {
                        edges {
                            score
                            node {
                                title
                            }
                        }
                    }
                }
            `;
        const gqlResult = await testHelper.executeGraphQL(query, { variableValues: { vector: testVectors[0] } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [queryName]: {
                edges: [
                    {
                        node: {
                            title: "Some Title",
                        },
                        score: expect.closeTo(1),
                    },
                    {
                        node: {
                            title: "Another Title",
                        },
                        score: expect.closeTo(0.56),
                    },
                ],
            },
        });
    });

    test("Retrieve nodes ordered by score first and node property second", async () => {
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

        const query = /* GraphQL */ `
                query($vector: [Float!]) {
                    ${queryName}(vector: $vector, sort: [{ score: ASC }, {node: {title: DESC}}] ) {
                        edges {
                            score
                            node {
                                title
                            }
                        }
                    }
                }
            `;
        const gqlResult = await testHelper.executeGraphQL(query, { variableValues: { vector: testVectors[0] } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [queryName]: {
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
                        score: expect.closeTo(1),
                    },
                ],
            },
        });
    });
});
