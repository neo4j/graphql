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

import { gql } from "apollo-server";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2803", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = gql`
        type Movie {
            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            released: Int!
        }

        type Actor {
            movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            name: String
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should find movies aggregate within double nested relationships", async () => {
        const query = gql`
            {
                actors(where: { movies_SOME: { actors_ALL: { moviesAggregate: { count_GT: 1 } } } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                OPTIONAL MATCH (this)-[:ACTED_IN]->(this0:\`Movie\`)
                OPTIONAL MATCH (this1:\`Actor\`)-[:ACTED_IN]->(this0)
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:ACTED_IN]->(this3:\`Movie\`)
                    RETURN count(this3) > $param0 AS var4
                }
                WITH this, this0, collect(var4) AS var4
                WITH this, collect(var4) AS var4
                RETURN any(var6 IN var4 WHERE all(var5 IN var6 WHERE var5 = true)) AS var4
            }
            WITH *
            WHERE EXISTS {
                MATCH (this)-[:ACTED_IN]->(this0:\`Movie\`)
                WHERE (EXISTS {
                    MATCH (this1:\`Actor\`)-[:ACTED_IN]->(this0)
                    WHERE var4 = true
                } AND NOT (EXISTS {
                    MATCH (this1:\`Actor\`)-[:ACTED_IN]->(this0)
                    WHERE NOT (var4 = true)
                }))
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find aggregations at all levels within double nested relationships", async () => {
        const query = gql`
            {
                actors(
                    where: {
                        movies_SOME: { actors_ALL: { moviesAggregate: { count_GT: 1 } }, actorsAggregate: { count: 1 } }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                OPTIONAL MATCH (this)-[:ACTED_IN]->(this0:\`Movie\`)
                OPTIONAL MATCH (this1:\`Actor\`)-[:ACTED_IN]->(this0)
                CALL {
                    WITH this0
                    MATCH (this3:\`Actor\`)-[this2:ACTED_IN]->(this0)
                    RETURN count(this3) = $param0 AS var4
                }
                CALL {
                    WITH this1
                    MATCH (this1)-[this5:ACTED_IN]->(this6:\`Movie\`)
                    RETURN count(this6) > $param1 AS var7
                }
                WITH this, this0, var4, collect(var7) AS var7
                WITH this, collect(var4) AS var4, collect(var7) AS var7
                RETURN any(var8 IN var4 WHERE var8 = true) AS var4, any(var10 IN var7 WHERE all(var9 IN var10 WHERE var9 = true)) AS var7
            }
            WITH *
            WHERE EXISTS {
                MATCH (this)-[:ACTED_IN]->(this0:\`Movie\`)
                WHERE (var4 = true AND (EXISTS {
                    MATCH (this1:\`Actor\`)-[:ACTED_IN]->(this0)
                    WHERE var7 = true
                } AND NOT (EXISTS {
                    MATCH (this1:\`Actor\`)-[:ACTED_IN]->(this0)
                    WHERE NOT (var7 = true)
                })))
            }
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find movies aggregate within triple nested relationships", async () => {
        const query = gql`
            {
                movies(where: { actors_SOME: { movies_SOME: { actors_ALL: { moviesAggregate: { count_GT: 1 } } } } }) {
                    released
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                OPTIONAL MATCH (this0:\`Actor\`)-[:ACTED_IN]->(this)
                OPTIONAL MATCH (this0)-[:ACTED_IN]->(this1:\`Movie\`)
                OPTIONAL MATCH (this2:\`Actor\`)-[:ACTED_IN]->(this1)
                CALL {
                    WITH this2
                    MATCH (this2)-[this3:ACTED_IN]->(this4:\`Movie\`)
                    RETURN count(this4) > $param0 AS var5
                }
                WITH this, this0, this1, collect(var5) AS var5
                WITH this, this0, collect(var5) AS var5
                WITH this, collect(var5) AS var5
                RETURN any(var8 IN var5 WHERE any(var7 IN var8 WHERE all(var6 IN var7 WHERE var6 = true))) AS var5
            }
            WITH *
            WHERE EXISTS {
                MATCH (this0:\`Actor\`)-[:ACTED_IN]->(this)
                WHERE EXISTS {
                    MATCH (this0)-[:ACTED_IN]->(this1:\`Movie\`)
                    WHERE (EXISTS {
                        MATCH (this2:\`Actor\`)-[:ACTED_IN]->(this1)
                        WHERE var5 = true
                    } AND NOT (EXISTS {
                        MATCH (this2:\`Actor\`)-[:ACTED_IN]->(this1)
                        WHERE NOT (var5 = true)
                    }))
                }
            }
            RETURN this { .released } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
