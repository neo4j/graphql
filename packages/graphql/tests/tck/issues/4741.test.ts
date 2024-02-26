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
            type Opportunity {
                country: String!
                listsOlis: [ListOli!]! @relationship(type: "HAS_LIST", direction: OUT)
            }

            type ListOli {
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
                opportunitiesConnection(first: 10, where: { listsOlisAggregate: { count_GT: 1 } }) {
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
            "MATCH (this0:Opportunity)
            CALL {
                WITH this0
                MATCH (this0)-[this1:HAS_LIST]->(this2:ListOli)
                RETURN count(this2) > $param0 AS var3
            }
            WITH *
            WHERE var3 = true
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH *
                LIMIT $param1
                CALL {
                    WITH this0
                    MATCH (this0)-[this4:HAS_LIST]->(this5:ListOli)
                    WITH collect({ node: this5, relationship: this4 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this5, edge.relationship AS this4
                        RETURN collect({ node: { __id: id(this5), __resolveType: \\"ListOli\\" } }) AS var6
                    }
                    RETURN { edges: var6, totalCount: totalCount } AS var7
                }
                RETURN collect({ node: { country: this0.country, listsOlisConnection: var7, __resolveType: \\"Opportunity\\" } }) AS var8
            }
            RETURN { edges: var8, totalCount: totalCount } AS this"
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
