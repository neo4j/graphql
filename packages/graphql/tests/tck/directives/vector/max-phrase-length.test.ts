/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { graphql } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { Neo4jGraphQLError } from "../../../../src/classes/Error";
import { DriverBuilder } from "../../../utils/builders/driver-builder";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

const queryName = "moviesVectorQuery";

describe("@vector maxPhraseLength", () => {
    let verifyTCK;

    beforeAll(() => {
        // NOTE: tck verification is skipped for vector tests as vector is not supported on Neo4j 4.x
        if (process.env.VERIFY_TCK) {
            verifyTCK = process.env.VERIFY_TCK;
            delete process.env.VERIFY_TCK;
        }
    });

    afterAll(() => {
        if (verifyTCK) {
            process.env.VERIFY_TCK = verifyTCK;
        }
    });

    describe("phrase input", () => {
        const features = {
            vector: {
                OpenAI: {
                    token: "my-token",
                    model: "my-model",
                    dimensions: 256,
                },
            },
        };

        const makeTypeDefs = (maxPhraseLength?: number) => /* GraphQL */ `
            type Movie
                @node
                @vector(
                    indexes: [
                        {
                            indexName: "movie_index"
                            embeddingProperty: "movieVector"
                            queryName: "${queryName}"
                            provider: OPEN_AI
                            ${maxPhraseLength === undefined ? "" : `maxPhraseLength: ${maxPhraseLength}`}
                        }
                    ]
                ) {
                title: String!
            }
        `;

        const query = /* GraphQL */ `
            query MovieVectorQuery($phrase: String!) {
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

        let limitedSchema: Neo4jGraphQL;
        let unlimitedSchema: Neo4jGraphQL;

        beforeAll(() => {
            limitedSchema = new Neo4jGraphQL({ typeDefs: makeTypeDefs(100), features });
            unlimitedSchema = new Neo4jGraphQL({ typeDefs: makeTypeDefs(), features });
        });

        test("over-limit phrase is rejected with the limit and actual length in the message", async () => {
            await expect(
                translateQuery(limitedSchema, query, {
                    variableValues: {
                        phrase: "a".repeat(101),
                    },
                })
            ).rejects.toThrow(
                "Invalid vector query: phrase is 101 characters, but the maximum allowed length for this query is 100 characters."
            );
        });

        test("over-limit phrase throws a Neo4jGraphQLError", async () => {
            const { errors } = await graphql({
                schema: await limitedSchema.getSchema(),
                source: query,
                variableValues: {
                    phrase: "a".repeat(101),
                },
                contextValue: {
                    executionContext: new DriverBuilder().instance(),
                },
            });

            expect(errors).toHaveLength(1);
            expect(errors?.[0]?.originalError).toBeInstanceOf(Neo4jGraphQLError);
        });

        test("surrogate-pair phrase length is counted by code points, not UTF-16 code units", async () => {
            // "😀" is a single code point but two UTF-16 code units, so 101 emoji are 101 characters
            // (rejected) even though String.length would report 202.
            await expect(
                translateQuery(limitedSchema, query, {
                    variableValues: {
                        phrase: "😀".repeat(101),
                    },
                })
            ).rejects.toThrow(
                "Invalid vector query: phrase is 101 characters, but the maximum allowed length for this query is 100 characters."
            );
        });

        test("surrogate-pair phrase at the limit is accepted (code-point count equals the limit)", async () => {
            // 100 emoji are 100 code points (accepted) but 200 UTF-16 code units; the guard must not
            // reject based on the UTF-16 length.
            await expect(
                translateQuery(limitedSchema, query, {
                    variableValues: {
                        phrase: "😀".repeat(100),
                    },
                })
            ).resolves.toBeDefined();
        });

        test("at-limit phrase translates to the same Cypher as an unlimited index", async () => {
            const phrase = "a".repeat(100);

            const limitedResult = await translateQuery(limitedSchema, query, {
                variableValues: { phrase },
            });
            const unlimitedResult = await translateQuery(unlimitedSchema, query, {
                variableValues: { phrase },
            });

            expect(limitedResult.cypher).toBe(unlimitedResult.cypher);
            expect(limitedResult.params).toEqual(unlimitedResult.params);

            expect(formatCypher(limitedResult.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                WITH genai.vector.encode($param0, 'OpenAI', {token: $param1, model: $param2, dimensions: $param3}) AS var0
                CALL db.index.vector.queryNodes('movie_index', 4, var0) YIELD node AS this1, score AS var2
                WHERE $param4 IN labels(this1)
                WITH collect({node: this1, score: var2}) AS edges
                WITH edges, size(edges) AS totalCount
                CALL (edges) {
                  UNWIND edges AS edge
                  WITH edge.node AS this1, edge.score AS var2
                  RETURN collect({node: {title: this1.title, __resolveType: 'Movie'}, score: var2}) AS var3
                }
                RETURN {edges: var3} AS this"
            `);
        });
    });

    describe("vector (float list) input", () => {
        test("maxPhraseLength on a vector-only index (no provider) is rejected at schema build time", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @vector(
                        indexes: [
                            {
                                indexName: "movie_index"
                                embeddingProperty: "movieVector"
                                queryName: "${queryName}"
                                maxPhraseLength: 2
                            }
                        ]
                    ) {
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const errors = (await neoSchema.getSchema().then(
                () => [],
                (e) => e as Error[]
            )) as Error[];

            expect(errors).toHaveLength(1);
            expect(errors[0]).toHaveProperty(
                "message",
                "@vector.indexes maxPhraseLength can only be set on an index with a provider (used for query by phrase)."
            );
        });

        test("vector (float list) input passes through on a vector-only index", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie
                    @node
                    @vector(
                        indexes: [
                            {
                                indexName: "movie_index"
                                embeddingProperty: "movieVector"
                                queryName: "${queryName}"
                            }
                        ]
                    ) {
                    title: String!
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = /* GraphQL */ `
                query MovieVectorQuery($vector: [Float!]!) {
                    ${queryName}(vector: $vector) {
                        edges {
                            score
                            node {
                                title
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query, {
                variableValues: {
                    vector: [0.1, 0.2, 0.3, 0.4],
                },
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                CALL db.index.vector.queryNodes('movie_index', 4, $param0) YIELD node AS this0, score AS var1
                WHERE $param1 IN labels(this0)
                WITH collect({node: this0, score: var1}) AS edges
                WITH edges, size(edges) AS totalCount
                CALL (edges) {
                  UNWIND edges AS edge
                  WITH edge.node AS this0, edge.score AS var1
                  RETURN collect({node: {title: this0.title, __resolveType: 'Movie'}, score: var1}) AS var2
                }
                RETURN {edges: var2} AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": [
                        0.1,
                        0.2,
                        0.3,
                        0.4
                    ],
                    \\"param1\\": \\"Movie\\"
                }"
            `);
        });
    });
});
