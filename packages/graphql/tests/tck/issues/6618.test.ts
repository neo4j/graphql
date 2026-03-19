/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/6618", () => {
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        const typeDefs = /* GraphQL */ `
            type ProductInstance @limit(max: 100, default: 2) @node {
                serialNumber: String!
            }

            type Asset @node {
                name: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    test("Connection totalCount for @limit type does not collect nodes", async () => {
        const query = /* GraphQL */ `
            query {
                productInstancesConnection {
                    totalCount
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this0:ProductInstance)
            WITH count(this0) AS totalCount
            RETURN {totalCount: totalCount} AS this"
        `);

        expect(formatCypher(result.cypher)).not.toContain("collect");
    });

    test("Connection totalCount for non-@limit type does not collect nodes", async () => {
        const query = /* GraphQL */ `
            query {
                assetsConnection {
                    totalCount
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this0:Asset)
            WITH count(this0) AS totalCount
            RETURN {totalCount: totalCount} AS this"
        `);
    });
});
