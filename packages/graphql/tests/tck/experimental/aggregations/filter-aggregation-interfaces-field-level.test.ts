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

describe("Interface Field Level Aggregations", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Production {
                title: String!
                cost: Float!
            }

            type Movie implements Production {
                title: String!
                cost: Float!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production {
                title: String!
                cost: Float!
                episodes: Int!
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            experimental: true,
        });
    });

    test("Count with where", async () => {
        const query = gql`
            {
                actors {
                    actedInAggregate(where: { title: "The Matrix" }) {
                        count
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    RETURN this1 AS node, this0 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    RETURN this3 AS node, this2 AS edge
                }
                WITH *
                WHERE node.title = $param0
                RETURN count(node) AS this4
            }
            RETURN this { actedInAggregate: { count: this4 } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("Count with where and string aggregation", async () => {
        const query = gql`
            {
                actors {
                    actedInAggregate(where: { title_STARTS_WITH: "The" }) {
                        count
                        edge {
                            screenTime {
                                min
                                max
                            }
                        }
                        node {
                            title {
                                longest
                                shortest
                            }
                        }
                    }
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    RETURN this1 AS node, this0 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:ACTED_IN]->(this3:Series)
                    RETURN this3 AS node, this2 AS edge
                }
                WITH *
                WHERE node.title STARTS WITH $param0
                RETURN count(node) AS this4
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this5:ACTED_IN]->(this6:Movie)
                    RETURN this6 AS node, this5 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this7:ACTED_IN]->(this8:Series)
                    RETURN this8 AS node, this7 AS edge
                }
                WITH *
                WHERE node.title STARTS WITH $param1
                WITH node
                ORDER BY size(node.title) DESC
                WITH collect(node.title) AS list
                RETURN { longest: head(list), shortest: last(list) } AS this9
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this10:ACTED_IN]->(this11:Movie)
                    RETURN this11 AS node, this10 AS edge
                    UNION
                    WITH this
                    MATCH (this)-[this12:ACTED_IN]->(this13:Series)
                    RETURN this13 AS node, this12 AS edge
                }
                WITH *
                WHERE node.title STARTS WITH $param2
                RETURN { min: min(edge.screenTime), max: max(edge.screenTime) } AS this14
            }
            RETURN this { .name, actedInAggregate: { count: this4, node: { title: this9 }, edge: { screenTime: this14 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The\\",
                \\"param1\\": \\"The\\",
                \\"param2\\": \\"The\\"
            }"
        `);
    });
});
