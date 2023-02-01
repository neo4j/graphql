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

    test("should find aggregations at all levels within within triple nested relationships", async () => {
        const query = gql`
            {
                movies(
                    where: {
                        actors_SOME: {
                            movies_SOME: {
                                actors_ALL: { moviesAggregate: { count_GT: 1 } }
                                actorsAggregate: { node: { name_AVERAGE_EQUAL: 10 } }
                            }
                            moviesAggregate: { node: { released_MAX_GT: 2 } }
                        }
                        actorsAggregate: { node: { name_AVERAGE_EQUAL: 6 } }
                    }
                ) {
                    released
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this1:\`Actor\`)-[this0:ACTED_IN]->(this)
                RETURN avg(size(this1.name)) = $param0 AS var2
            }
            CALL {
                WITH this
                OPTIONAL MATCH (this3:\`Actor\`)-[:ACTED_IN]->(this)
                OPTIONAL MATCH (this3)-[:ACTED_IN]->(this4:\`Movie\`)
                OPTIONAL MATCH (this5:\`Actor\`)-[:ACTED_IN]->(this4)
                CALL {
                    WITH this3
                    MATCH (this3)-[this6:ACTED_IN]->(this7:\`Movie\`)
                    RETURN max(this7.released) > $param1 AS var8
                }
                CALL {
                    WITH this4
                    MATCH (this10:\`Actor\`)-[this9:ACTED_IN]->(this4)
                    RETURN avg(size(this10.name)) = $param2 AS var11
                }
                CALL {
                    WITH this5
                    MATCH (this5)-[this12:ACTED_IN]->(this13:\`Movie\`)
                    RETURN count(this13) > $param3 AS var14
                }
                WITH this, this3, this4, var8, var11, collect(var14) AS var14
                WITH this, this3, var8, collect(var11) AS var11, collect(var14) AS var14
                WITH this, collect(var8) AS var8, collect(var11) AS var11, collect(var14) AS var14
                RETURN any(var15 IN var8 WHERE var15 = true) AS var8, any(var17 IN var11 WHERE any(var16 IN var17 WHERE var16 = true)) AS var11, any(var20 IN var14 WHERE any(var19 IN var20 WHERE all(var18 IN var19 WHERE var18 = true))) AS var14
            }
            WITH *
            WHERE (var2 = true AND EXISTS {
                MATCH (this3:\`Actor\`)-[:ACTED_IN]->(this)
                WHERE (var8 = true AND EXISTS {
                    MATCH (this3)-[:ACTED_IN]->(this4:\`Movie\`)
                    WHERE (var11 = true AND (EXISTS {
                        MATCH (this5:\`Actor\`)-[:ACTED_IN]->(this4)
                        WHERE var14 = true
                    } AND NOT (EXISTS {
                        MATCH (this5:\`Actor\`)-[:ACTED_IN]->(this4)
                        WHERE NOT (var14 = true)
                    })))
                })
            })
            RETURN this { .released } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 6,
                \\"param1\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"param2\\": 10,
                \\"param3\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
