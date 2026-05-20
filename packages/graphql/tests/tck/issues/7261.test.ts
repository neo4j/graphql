/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/7261", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface HasFile {
                id: String
            }

            interface DigitalAssetDerivative implements HasFile {
                id: String
            }

            type Something @node {
                id: String
            }

            type AssetA implements DigitalAssetDerivative & HasFile
                @node(labels: ["AssetA ", "DigitalAssetDerivative", "HasFile"]) {
                id: String
            }
            type AssetB implements DigitalAssetDerivative & HasFile
                @node(labels: ["AssetB ", "DigitalAssetDerivative", "HasFile"]) {
                id: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Should only return totalCount when edges are not requested", async () => {
        const query = /* GraphQL */ `
            query {
                hasFilesConnection {
                    totalCount
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL () {
              CALL () {
                MATCH (this0:\`AssetA \`&DigitalAssetDerivative&HasFile)
                WITH {node: {__resolveType: 'AssetA', __id: elementId(this0)}} AS edge
                RETURN edge
                UNION
                MATCH (this1:\`AssetB \`&DigitalAssetDerivative&HasFile)
                WITH {node: {__resolveType: 'AssetB', __id: elementId(this1)}} AS edge
                RETURN edge
              }
              RETURN collect(edge) AS edges
            }
            WITH edges
            WITH edges, size(edges) AS totalCount
            RETURN {totalCount: totalCount} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Should return only edges", async () => {
        const query = /* GraphQL */ `
            query {
                hasFilesConnection {
                    edges {
                        node {
                            id
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL () {
              CALL () {
                MATCH (this0:\`AssetA \`&DigitalAssetDerivative&HasFile)
                WITH {node: {__resolveType: 'AssetA', __id: elementId(this0), id: this0.id}} AS edge
                RETURN edge
                UNION
                MATCH (this1:\`AssetB \`&DigitalAssetDerivative&HasFile)
                WITH {node: {__resolveType: 'AssetB', __id: elementId(this1), id: this1.id}} AS edge
                RETURN edge
              }
              RETURN collect(edge) AS edges
            }
            WITH edges
            WITH edges, size(edges) AS totalCount
            RETURN {edges: edges} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Should return both totalCount and edges", async () => {
        const query = /* GraphQL */ `
            query {
                hasFilesConnection {
                    totalCount
                    edges {
                        node {
                            id
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL () {
              CALL () {
                MATCH (this0:\`AssetA \`&DigitalAssetDerivative&HasFile)
                WITH {node: {__resolveType: 'AssetA', __id: elementId(this0), id: this0.id}} AS edge
                RETURN edge
                UNION
                MATCH (this1:\`AssetB \`&DigitalAssetDerivative&HasFile)
                WITH {node: {__resolveType: 'AssetB', __id: elementId(this1), id: this1.id}} AS edge
                RETURN edge
              }
              RETURN collect(edge) AS edges
            }
            WITH edges
            WITH edges, size(edges) AS totalCount
            RETURN {edges: edges, totalCount: totalCount} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
