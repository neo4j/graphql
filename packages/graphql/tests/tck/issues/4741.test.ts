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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4741", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = /* GraphQL */ `
            type Opportunity @node {
                country: String!
                listsOlis: [ListOli!]! @relationship(type: "HAS_LIST", direction: OUT)
            }

            type ListOli @node {
                name: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {},
        });
    });

    test("Filters by relationship aggregation", async () => {
        const query = /* GraphQL */ `
            query {
                opportunitiesConnection(first: 10, where: { listsOlisAggregate: { count: { gt: 1 } } }) {
                    edges {
                        node {
                            country
                            listsOlisConnection {
                                totalCount
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this0:Opportunity)
            CALL (this0) {
                MATCH (this0)-[this1:HAS_LIST]->(this2:ListOli)
                RETURN count(this2) > $param0 AS var3
            }
            WITH *
            WHERE var3 = true
            WITH collect({ node: this0 }) AS edges
            CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH *
                LIMIT $param1
                CALL (this0) {
                    MATCH (this0)-[this4:HAS_LIST]->(this5:ListOli)
                    WITH count(this5) AS totalCount
                    RETURN { totalCount: totalCount } AS var6
                }
                RETURN collect({ node: { country: this0.country, listsOlisConnection: var6, __resolveType: \\"Opportunity\\" } }) AS var7
            }
            RETURN { edges: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
