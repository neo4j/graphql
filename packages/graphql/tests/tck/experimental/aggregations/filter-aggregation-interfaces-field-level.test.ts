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
            WHERE this.name = $param0
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                    RETURN this1 AS this2
                    UNION
                    WITH this
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    RETURN this4 AS this2
                }
                RETURN count(this2) AS this2
            }
            RETURN this { actedInAggregate: { count: this2 } } AS this"
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
                    RETURN this1 AS this2
                    UNION
                    WITH this
                    MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                    RETURN this4 AS this2
                }
                WITH *
                WHERE this2.title STARTS WITH $param0
                RETURN count(this2) AS this2
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this5:ACTED_IN]->(this6:Movie)
                    RETURN this6 AS this7
                    UNION
                    WITH this
                    MATCH (this)-[this8:ACTED_IN]->(this9:Series)
                    RETURN this9 AS this7
                }
                WITH *
                WHERE this7.title STARTS WITH $param1
                WITH this7
                ORDER BY size(this7.title) DESC
                WITH collect(this7.title) AS list
                RETURN { longest: head(list), shortest: last(list) } AS this7
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this10:ACTED_IN]->(this11:Movie)
                    RETURN this10 AS this12, this11 AS node
                    UNION
                    WITH this
                    MATCH (this)-[this13:ACTED_IN]->(this14:Series)
                    RETURN this13 AS this12, this14 as node
                }
                WITH *
                WHERE node.title STARTS WITH $param2
                RETURN { min: min(this12.screenTime), max: max(this12.screenTime) } AS this12
            }
            RETURN this { actedInAggregate: { count: this2, node: { title: this7 }, edge: { screenTime: this12 } } } AS this"
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
