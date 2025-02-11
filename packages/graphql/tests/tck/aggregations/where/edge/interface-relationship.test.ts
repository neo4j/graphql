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

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Cypher Aggregations where edge with String", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String
            }

            type Movie implements Production @node {
                title: String
            }

            type Series implements Production @node {
                title: String
            }

            interface Person {
                name: String
                productions: [Production!]! @declareRelationship
            }

            type Actor implements Person @node {
                name: String
                productions: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Cameo implements Person @node {
                name: String
                productions: [Production!]! @relationship(type: "APPEARED_IN", direction: OUT, properties: "AppearedIn")
            }

            type ActedIn @relationshipProperties {
                role: String
            }

            type AppearedIn @relationshipProperties {
                role: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should count number of interface relationships", async () => {
        const query = /* GraphQL */ `
            query ActorsAggregate {
                actors(where: { productionsAggregate: { count_LT: 3 } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1)
                WHERE (this1:Movie OR this1:Series)
                RETURN count(this1) < $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 3,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should generate Cypher to aggregate over multiple relationship properties types", async () => {
        const query = /* GraphQL */ `
            query People {
                people(
                    where: {
                        productionsAggregate: {
                            edge: { AppearedIn: { role_SHORTEST_LENGTH_LT: 3 }, ActedIn: { role_AVERAGE_LENGTH_LT: 5 } }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (this0:Actor)
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:ACTED_IN]->(this2)
                    WHERE (this2:Movie OR this2:Series)
                    RETURN avg(size(this1.role)) < $param0 AS var3
                }
                WITH *
                WHERE var3 = true
                WITH this0 { .name, __resolveType: \\"Actor\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this4:Cameo)
                CALL {
                    WITH this4
                    MATCH (this4)-[this5:APPEARED_IN]->(this6)
                    WHERE (this6:Movie OR this6:Series)
                    RETURN min(size(this5.role)) < $param1 AS var7
                }
                WITH *
                WHERE var7 = true
                WITH this4 { .name, __resolveType: \\"Cameo\\", __id: id(this4) } AS this4
                RETURN this4 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 5,
                \\"param1\\": {
                    \\"low\\": 3,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should generate Cypher to aggregate over edge properties and count", async () => {
        const query = /* GraphQL */ `
            query People {
                people(
                    where: { productionsAggregate: { edge: { ActedIn: { role_AVERAGE_LENGTH_LT: 5 } }, count_LTE: 10 } }
                ) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (this0:Actor)
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:ACTED_IN]->(this2)
                    WHERE (this2:Movie OR this2:Series)
                    RETURN (count(this2) <= $param0 AND avg(size(this1.role)) < $param1) AS var3
                }
                WITH *
                WHERE var3 = true
                WITH this0 { .name, __resolveType: \\"Actor\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this4:Cameo)
                CALL {
                    WITH this4
                    MATCH (this4)-[this5:APPEARED_IN]->(this6)
                    WHERE (this6:Movie OR this6:Series)
                    RETURN count(this6) <= $param2 AS var7
                }
                WITH *
                WHERE var7 = true
                WITH this4 { .name, __resolveType: \\"Cameo\\", __id: id(this4) } AS this4
                RETURN this4 AS this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param1\\": 5,
                \\"param2\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
