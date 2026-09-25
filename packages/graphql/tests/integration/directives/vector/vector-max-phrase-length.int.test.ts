/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Record as Neo4jRecord, type Driver, type Transaction } from "neo4j-driver";
import { generate } from "randomstring";
import type { Neo4jGraphQL } from "../../../../src/classes";
import { Neo4jGraphQLError } from "../../../../src/classes/Error";
import { DBMS_COMPONENTS_QUERY } from "../../../../src/constants";
import type { UniqueType } from "../../../utils/graphql-types";
import { isMultiDbUnsupportedError } from "../../../utils/is-multi-db-unsupported-error";
import { TestHelper } from "../../../utils/tests-helper";
import { testVectors } from "./shared-vector";

describe("@vector directive - maxPhraseLength", () => {
    const shortLimit = 10;
    const longLimit = 25;
    const shortLimitQueryName = "myVectorQueryShortLimit";
    const longLimitQueryName = "myVectorQueryLongLimit";
    const floatListQueryName = "myVectorQueryFloatList";
    const testHelper = new TestHelper();

    let driver: Driver;
    let MULTIDB_SUPPORT = true;
    let VECTOR_SUPPORT = true;
    let neoSchema: Neo4jGraphQL;

    let Movie: UniqueType;

    const movie1 = {
        title: "Some Title",
        embedding: testVectors[0],
    };
    const movie2 = {
        title: "Another Title",
        embedding: testVectors[1],
    };

    const fakeResultSummary = {
        counters: {
            updates: () => ({}),
        },
    };

    // Phrase queries invoke genai.vector.encode against the configured embedding provider inside the
    // generated Cypher, and no real provider credentials exist in tests. Accepted-phrase cases therefore
    // run against a stubbed transaction so the query can be observed succeeding end-to-end without a
    // live provider call. Rejected-phrase cases use the real driver, as they throw before any execution.
    function fakeExecutionContext(): Transaction {
        return {
            run: (cypher: string) => {
                if (cypher.includes(DBMS_COMPONENTS_QUERY)) {
                    return {
                        records: [new Neo4jRecord(["version", "edition"], ["5.15.0", "enterprise"])],
                        summary: fakeResultSummary,
                    };
                }
                return {
                    records: [new Neo4jRecord(["this"], [{ edges: [], totalCount: 0 }])],
                    summary: fakeResultSummary,
                };
            },
        } as unknown as Transaction;
    }

    function phraseQuery(queryName: string): string {
        return /* GraphQL */ `
            query ($phrase: String!) {
                ${queryName}(phrase: $phrase) {
                    edges {
                        score
                        node {
                            title
                        }
                    }
                }
            }
        `;
    }

    function expectedLimitError(phraseLength: number, limit: number): string {
        return `Invalid vector query: phrase is ${phraseLength} characters, but the maximum allowed length for this query is ${limit} characters.`;
    }

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
            type ${Movie}
                @vector(
                    indexes: [
                        {
                            indexName: "${Movie.name}FloatListIndex"
                            embeddingProperty: "embedding"
                            queryName: "${floatListQueryName}"
                        }
                        {
                            indexName: "${Movie.name}ShortIndex"
                            embeddingProperty: "embeddingShort"
                            queryName: "${shortLimitQueryName}"
                            provider: OPEN_AI
                            maxPhraseLength: ${shortLimit}
                        }
                        {
                            indexName: "${Movie.name}LongIndex"
                            embeddingProperty: "embeddingLong"
                            queryName: "${longLimitQueryName}"
                            provider: OPEN_AI
                            maxPhraseLength: ${longLimit}
                        }
                    ]
                )
                @node {
                title: String!
            }
        `;

        neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                vector: {
                    OpenAI: {
                        token: "my-token",
                        model: "my-model",
                        dimensions: 128,
                    },
                },
            },
        });
        await neoSchema.getSchema();

        for (const [indexName, embeddingProperty] of [
            [`${Movie.name}FloatListIndex`, "embedding"],
            [`${Movie.name}ShortIndex`, "embeddingShort"],
            [`${Movie.name}LongIndex`, "embeddingLong"],
        ]) {
            await testHelper.executeCypher(
                `CREATE VECTOR INDEX ${indexName}
                    IF NOT EXISTS FOR (n:${Movie.name})
                    ON n.${embeddingProperty}
                    OPTIONS {
                        indexConfig: {
                            \`vector.dimensions\`: 128,
                            \`vector.similarity_function\`: 'cosine'
                        }
                    }
                    `
            );
        }

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

    test("over-limit phrase returns an error with the limit and phrase length, and no data", async () => {
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

        const phrase = "a".repeat(shortLimit + 1);
        const query = /* GraphQL */ `
            query {
                ${shortLimitQueryName}(phrase: "${phrase}") {
                    edges {
                        score
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.data).toBeNull();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0]?.message).toBe(expectedLimitError(shortLimit + 1, shortLimit));
        expect(gqlResult.errors?.[0]?.originalError).toBeInstanceOf(Neo4jGraphQLError);
    });

    test("surrogate-pair phrase length is counted by code points, not UTF-16 code units", async () => {
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

        // "😀" is a single code point but two UTF-16 code units, so a phrase one code point over the
        // limit is rejected even though String.length would report double that.
        const overLimitResult = await testHelper.executeGraphQL(phraseQuery(shortLimitQueryName), {
            variableValues: { phrase: "😀".repeat(shortLimit + 1) },
        });

        expect(overLimitResult.data).toBeNull();
        expect(overLimitResult.errors).toHaveLength(1);
        expect(overLimitResult.errors?.[0]?.message).toBe(expectedLimitError(shortLimit + 1, shortLimit));

        // A phrase at the code-point limit is accepted, even though its UTF-16 length is double that.
        const atLimitResult = await testHelper.executeGraphQL(phraseQuery(shortLimitQueryName), {
            variableValues: { phrase: "😀".repeat(shortLimit) },
            contextValue: { executionContext: fakeExecutionContext() },
        });

        expect(atLimitResult.errors).toBeFalsy();
        expect(atLimitResult.data).toEqual({
            [shortLimitQueryName]: {
                edges: [],
            },
        });
    });

    test("over-limit phrase supplied via variables is enforced identically to an inline literal", async () => {
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

        const phrase = "b".repeat(shortLimit + 5);
        const inlineQuery = /* GraphQL */ `
            query {
                ${shortLimitQueryName}(phrase: "${phrase}") {
                    edges {
                        score
                    }
                }
            }
        `;

        const inlineResult = await testHelper.executeGraphQL(inlineQuery);
        const variableResult = await testHelper.executeGraphQL(phraseQuery(shortLimitQueryName), {
            variableValues: { phrase },
        });

        expect(inlineResult.data).toBeNull();
        expect(inlineResult.errors).toHaveLength(1);
        expect(variableResult.data).toBeNull();
        expect(variableResult.errors).toHaveLength(1);
        expect(variableResult.errors?.[0]?.message).toBe(expectedLimitError(shortLimit + 5, shortLimit));
        expect(variableResult.errors?.[0]?.message).toBe(inlineResult.errors?.[0]?.message);
    });

    test("at-limit phrase succeeds", async () => {
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

        const gqlResult = await testHelper.executeGraphQL(phraseQuery(shortLimitQueryName), {
            variableValues: { phrase: "c".repeat(shortLimit) },
            contextValue: { executionContext: fakeExecutionContext() },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [shortLimitQueryName]: {
                edges: [],
            },
        });
    });

    test("under-limit phrase succeeds", async () => {
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

        const gqlResult = await testHelper.executeGraphQL(phraseQuery(shortLimitQueryName), {
            variableValues: { phrase: "short" },
            contextValue: { executionContext: fakeExecutionContext() },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [shortLimitQueryName]: {
                edges: [],
            },
        });
    });

    test("indexes on the same type enforce their limits independently", async () => {
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

        const phrase = "d".repeat(shortLimit + 5);

        const shortResult = await testHelper.executeGraphQL(phraseQuery(shortLimitQueryName), {
            variableValues: { phrase },
        });

        expect(shortResult.data).toBeNull();
        expect(shortResult.errors).toHaveLength(1);
        expect(shortResult.errors?.[0]?.message).toBe(expectedLimitError(shortLimit + 5, shortLimit));

        const longResult = await testHelper.executeGraphQL(phraseQuery(longLimitQueryName), {
            variableValues: { phrase },
            contextValue: { executionContext: fakeExecutionContext() },
        });

        expect(longResult.errors).toBeFalsy();
        expect(longResult.data).toEqual({
            [longLimitQueryName]: {
                edges: [],
            },
        });

        const overLongPhrase = "e".repeat(longLimit + 1);
        const longOverResult = await testHelper.executeGraphQL(phraseQuery(longLimitQueryName), {
            variableValues: { phrase: overLongPhrase },
        });

        expect(longOverResult.data).toBeNull();
        expect(longOverResult.errors).toHaveLength(1);
        expect(longOverResult.errors?.[0]?.message).toBe(expectedLimitError(longLimit + 1, longLimit));
    });

    test("vector (float list) query is not subject to a phrase limit and queries the database normally", async () => {
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
            query ($vector: [Float!]) {
                ${floatListQueryName}(vector: $vector) {
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
            [floatListQueryName]: {
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
});
