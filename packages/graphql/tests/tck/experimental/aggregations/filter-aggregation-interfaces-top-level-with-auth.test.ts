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

import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Top level filter on aggregation interfaces with Auth", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type JWT @jwt {
                roles: [String!]!
            }

            interface Production {
                title: String!
                cost: Float!
            }

            type Movie implements Production
                @authorization(filter: [{ where: { jwt: { roles_INCLUDES: "movie_aggregator" } } }]) {
                title: String!
                cost: Float!
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                cost: Float!
                episodes: Int!
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor
                @authorization(
                    filter: [{ operations: [AGGREGATE], where: { jwt: { roles_INCLUDES: "actor_aggregator" } } }]
                ) {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("top level count", async () => {
        const query = gql`
            {
                productionsAggregate(where: { title: "The Matrix" }) {
                    count
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                CALL {
                    MATCH (this0:Movie)
                    RETURN this0 AS node
                    UNION
                    MATCH (this1:Series)
                    RETURN this1 AS node
                }
                WITH *
                WHERE node.title = $param0
                RETURN count(node) AS this2
            }
            RETURN { count: this2 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top level count and string fields", async () => {
        const query = gql`
            {
                productionsAggregate(where: { title: "The Matrix" }) {
                    count
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                CALL {
                    MATCH (this0:Movie)
                    RETURN this0 AS node
                    UNION
                    MATCH (this1:Series)
                    RETURN this1 AS node
                }
                WITH *
                WHERE node.title = $param0
                RETURN count(node) AS this2
            }
            RETURN { count: this2 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top level count and string fields with AND operation", async () => {
        const query = gql`
            {
                productionsAggregate(where: { AND: [{ cost_GTE: 10 }, { title: "The Matrix" }] }) {
                    count
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                CALL {
                    MATCH (this0:Movie)
                    RETURN this0 AS node
                    UNION
                    MATCH (this1:Series)
                    RETURN this1 AS node
                }
                WITH *
                WHERE (node.cost >= $param0 AND node.title = $param1)
                RETURN count(node) AS this2
            }
            RETURN { count: this2 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10,
                \\"param1\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top level count and string fields with OR operation", async () => {
        const query = gql`
            {
                productionsAggregate(where: { OR: [{ cost_GTE: 10 }, { title: "The Matrix" }] }) {
                    count
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                CALL {
                    MATCH (this0:Movie)
                    RETURN this0 AS node
                    UNION
                    MATCH (this1:Series)
                    RETURN this1 AS node
                }
                WITH *
                WHERE (node.cost >= $param0 OR node.title = $param1)
                RETURN count(node) AS this2
            }
            RETURN { count: this2 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10,
                \\"param1\\": \\"The Matrix\\"
            }"
        `);
    });
});
