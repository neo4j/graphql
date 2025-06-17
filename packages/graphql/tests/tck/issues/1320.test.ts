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

describe("https://github.com/neo4j/graphql/issues/1320", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Risk @node {
                code: String!
                ownedBy: [Team!]! @relationship(type: "OWNS_RISK", direction: IN)
                mitigationState: [MitigationState!]
            }

            type Team @node {
                code: String!
                ownsRisks: [Risk!]! @relationship(type: "OWNS_RISK", direction: OUT)
            }

            enum MitigationState {
                Deferred
                Identified
                Accepted
                Complete
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("multiple aggregations in the same query should return the same results as if were written separately", async () => {
        const query = /* GraphQL */ `
            query getAggreationOnTeams {
                stats: teams {
                    accepted: ownsRisksConnection(where: { node: { mitigationState: { includes: Accepted } } }) {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                    identified: ownsRisksConnection(where: { node: { mitigationState: { includes: Identified } } }) {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Team)
            CALL (this) {
                CALL (this) {
                    MATCH (this)-[this0:OWNS_RISK]->(this1:Risk)
                    WHERE $param0 IN this1.mitigationState
                    RETURN { nodes: count(DISTINCT this1) } AS var2
                }
                RETURN { aggregate: { count: var2 } } AS var3
            }
            CALL (this) {
                CALL (this) {
                    MATCH (this)-[this4:OWNS_RISK]->(this5:Risk)
                    WHERE $param1 IN this5.mitigationState
                    RETURN { nodes: count(DISTINCT this5) } AS var6
                }
                RETURN { aggregate: { count: var6 } } AS var7
            }
            RETURN this { accepted: var3, identified: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Accepted\\",
                \\"param1\\": \\"Identified\\"
            }"
        `);
    });
});
