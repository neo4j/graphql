/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

const queryName = "moviesVectorQuery";

describe("provider settings - genAI plugin", () => {
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

    test("OpenAI provider settings", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @vector(indexes: [{ indexName: "movie_index", embeddingProperty: "movieVector", queryName: "${queryName}", provider: OPEN_AI }]) {
                title: String!
                released: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                vector: {
                    OpenAI: {
                        token: "my-token",
                        model: "my-model",
                        dimensions: 256,
                    },
                },
            },
        });

        const query = /* GraphQL */ `
            query MovieVectorQuery($phrase: String!) {
                ${queryName}(phrase: $phrase) {
                    edges {
                        cursor
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
                phrase: "test phrase",
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "WITH genai.vector.encode($param0, \\"OpenAI\\", { token: $param1, model: $param2, dimensions: $param3 }) AS var0
            CALL db.index.vector.queryNodes(\\"movie_index\\", 4, var0) YIELD node AS this1, score AS var2
            WHERE $param4 IN labels(this1)
            WITH collect({ node: this1, score: var2 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this1, edge.score AS var2
                RETURN collect({ node: { title: this1.title, __resolveType: \\"Movie\\" }, score: var2 }) AS var3
            }
            RETURN { edges: var3, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test phrase\\",
                \\"param1\\": \\"my-token\\",
                \\"param2\\": \\"my-model\\",
                \\"param3\\": 256,
                \\"param4\\": \\"Movie\\"
            }"
        `);
    });
    test("VertexAI provider settings", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @vector(indexes: [{ indexName: "movie_index", embeddingProperty: "movieVector", queryName: "${queryName}", provider: VERTEX_AI }]) {
                title: String!
                released: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                vector: {
                    VertexAI: {
                        token: "my-token",
                        projectId: "my-project-id",
                        model: "my-model",
                        region: "my-region",
                    },
                },
            },
        });

        const query = /* GraphQL */ `
            query MovieVectorQuery($phrase: String!) {
                ${queryName}(phrase: $phrase) {
                    edges {
                        cursor
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
                phrase: "test phrase",
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "WITH genai.vector.encode($param0, \\"VertexAI\\", { token: $param1, projectId: $param2, model: $param3, region: $param4 }) AS var0
            CALL db.index.vector.queryNodes(\\"movie_index\\", 4, var0) YIELD node AS this1, score AS var2
            WHERE $param5 IN labels(this1)
            WITH collect({ node: this1, score: var2 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this1, edge.score AS var2
                RETURN collect({ node: { title: this1.title, __resolveType: \\"Movie\\" }, score: var2 }) AS var3
            }
            RETURN { edges: var3, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test phrase\\",
                \\"param1\\": \\"my-token\\",
                \\"param2\\": \\"my-project-id\\",
                \\"param3\\": \\"my-model\\",
                \\"param4\\": \\"my-region\\",
                \\"param5\\": \\"Movie\\"
            }"
        `);
    });
    test("AzureOpenAI provider settings", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @vector(indexes: [{ indexName: "movie_index", embeddingProperty: "movieVector", queryName: "${queryName}", provider: AZURE_OPEN_AI }]) {
                title: String!
                released: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                vector: {
                    AzureOpenAI: {
                        token: "my-token",
                        resource: "my-resource",
                        deployment: "my-deployment",
                    },
                },
            },
        });

        const query = /* GraphQL */ `
            query MovieVectorQuery($phrase: String!) {
                ${queryName}(phrase: $phrase) {
                    edges {
                        cursor
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
                phrase: "test phrase",
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "WITH genai.vector.encode($param0, \\"AzureOpenAI\\", { token: $param1, resource: $param2, deployment: $param3 }) AS var0
            CALL db.index.vector.queryNodes(\\"movie_index\\", 4, var0) YIELD node AS this1, score AS var2
            WHERE $param4 IN labels(this1)
            WITH collect({ node: this1, score: var2 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this1, edge.score AS var2
                RETURN collect({ node: { title: this1.title, __resolveType: \\"Movie\\" }, score: var2 }) AS var3
            }
            RETURN { edges: var3, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test phrase\\",
                \\"param1\\": \\"my-token\\",
                \\"param2\\": \\"my-resource\\",
                \\"param3\\": \\"my-deployment\\",
                \\"param4\\": \\"Movie\\"
            }"
        `);
    });
    test("Bedrock provider settings", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @vector(indexes: [{ indexName: "movie_index", embeddingProperty: "movieVector", queryName: "${queryName}", provider: BEDROCK }]) {
                title: String!
                released: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                vector: {
                    Bedrock: {
                        accessKeyId: "my-access-key-id",
                        secretAccessKey: "my-secret-access-key",
                        model: "my-model",
                        region: "my-region",
                    },
                },
            },
        });

        const query = /* GraphQL */ `
            query MovieVectorQuery($phrase: String!) {
                ${queryName}(phrase: $phrase) {
                    edges {
                        cursor
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
                phrase: "test phrase",
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "WITH genai.vector.encode($param0, \\"Bedrock\\", { accessKeyId: $param1, secretAccessKey: $param2, model: $param3, region: $param4 }) AS var0
            CALL db.index.vector.queryNodes(\\"movie_index\\", 4, var0) YIELD node AS this1, score AS var2
            WHERE $param5 IN labels(this1)
            WITH collect({ node: this1, score: var2 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this1, edge.score AS var2
                RETURN collect({ node: { title: this1.title, __resolveType: \\"Movie\\" }, score: var2 }) AS var3
            }
            RETURN { edges: var3, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test phrase\\",
                \\"param1\\": \\"my-access-key-id\\",
                \\"param2\\": \\"my-secret-access-key\\",
                \\"param3\\": \\"my-model\\",
                \\"param4\\": \\"my-region\\",
                \\"param5\\": \\"Movie\\"
            }"
        `);
    });
});
