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

import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2437", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = `
            type Agent @exclude(operations: [DELETE]) {
                uuid: ID! @id
                archivedAt: DateTime

                valuations: [Valuation!]! @relationship(type: "IS_VALUATION_AGENT", direction: OUT)
            }
            extend type Agent
                @auth(rules: [{ operations: [CREATE], roles: ["Admin"] }, { where: { archivedAt: null } }])

            type Valuation @exclude(operations: [DELETE]) {
                uuid: ID! @id
                archivedAt: DateTime

                agent: Agent! @relationship(type: "IS_VALUATION_AGENT", direction: IN)
            }
            extend type Valuation @auth(rules: [{ where: { archivedAt: null } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("query and limits nested connections", async () => {
        const query = gql`
            query Agents {
                agents(where: { uuid: "a1" }) {
                    uuid
                    valuationsConnection(first: 10) {
                        edges {
                            node {
                                uuid
                            }
                        }
                        pageInfo {
                            hasNextPage
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Agent\`)
            WHERE (this.uuid = $param0 AND this.archivedAt IS NULL)
            CALL {
                WITH this
                MATCH (this)-[this0:\`IS_VALUATION_AGENT\`]->(this1:\`Valuation\`)
                WHERE this1.archivedAt IS NULL
                WITH { node: { uuid: this1.uuid } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge
                    LIMIT $param1
                    RETURN collect(edge) AS var2
                }
                WITH var2 AS edges, totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            RETURN this { .uuid, valuationsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a1\\",
                \\"param1\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
