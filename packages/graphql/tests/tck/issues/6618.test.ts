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
            RETURN { totalCount: totalCount } AS this"
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
            RETURN { totalCount: totalCount } AS this"
        `);
    });
});
