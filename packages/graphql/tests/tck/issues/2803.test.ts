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
                MATCH (this)-[:ACTED_IN]->(this0:\`Movie\`)
                CALL {
                    WITH this0
                    MATCH (this1:\`Actor\`)-[:ACTED_IN]->(this0)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:\`Movie\`)
                        RETURN count(this3) > $param0 AS var4
                    }
                    WITH *
                    WHERE var4 = true
                    RETURN count(this1) > 0 AS var5
                }
                CALL {
                    WITH this0
                    MATCH (this1:\`Actor\`)-[:ACTED_IN]->(this0)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this6:ACTED_IN]->(this7:\`Movie\`)
                        RETURN count(this7) > $param1 AS var8
                    }
                    WITH *
                    WHERE NOT (var8 = true)
                    RETURN count(this1) > 0 AS var9
                }
                WITH *
                WHERE (var9 = false AND var5 = true)
                RETURN count(this0) > 0 AS var10
            }
            WITH *
            WHERE var10 = true
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
                MATCH (this)-[:ACTED_IN]->(this0:\`Movie\`)
                CALL {
                    WITH this0
                    MATCH (this2:\`Actor\`)-[this1:ACTED_IN]->(this0)
                    RETURN count(this2) = $param0 AS var3
                }
                CALL {
                    WITH this0
                    MATCH (this4:\`Actor\`)-[:ACTED_IN]->(this0)
                    CALL {
                        WITH this4
                        MATCH (this4)-[this5:ACTED_IN]->(this6:\`Movie\`)
                        RETURN count(this6) > $param1 AS var7
                    }
                    WITH *
                    WHERE var7 = true
                    RETURN count(this4) > 0 AS var8
                }
                CALL {
                    WITH this0
                    MATCH (this4:\`Actor\`)-[:ACTED_IN]->(this0)
                    CALL {
                        WITH this4
                        MATCH (this4)-[this9:ACTED_IN]->(this10:\`Movie\`)
                        RETURN count(this10) > $param2 AS var11
                    }
                    WITH *
                    WHERE NOT (var11 = true)
                    RETURN count(this4) > 0 AS var12
                }
                WITH *
                WHERE (var3 = true AND (var12 = false AND var8 = true))
                RETURN count(this0) > 0 AS var13
            }
            WITH *
            WHERE var13 = true
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
                },
                \\"param2\\": {
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
                MATCH (this0:\`Actor\`)-[:ACTED_IN]->(this)
                CALL {
                    WITH this0
                    MATCH (this0)-[:ACTED_IN]->(this1:\`Movie\`)
                    CALL {
                        WITH this1
                        MATCH (this2:\`Actor\`)-[:ACTED_IN]->(this1)
                        CALL {
                            WITH this2
                            MATCH (this2)-[this3:ACTED_IN]->(this4:\`Movie\`)
                            RETURN count(this4) > $param0 AS var5
                        }
                        WITH *
                        WHERE var5 = true
                        RETURN count(this2) > 0 AS var6
                    }
                    CALL {
                        WITH this1
                        MATCH (this2:\`Actor\`)-[:ACTED_IN]->(this1)
                        CALL {
                            WITH this2
                            MATCH (this2)-[this7:ACTED_IN]->(this8:\`Movie\`)
                            RETURN count(this8) > $param1 AS var9
                        }
                        WITH *
                        WHERE NOT (var9 = true)
                        RETURN count(this2) > 0 AS var10
                    }
                    WITH *
                    WHERE (var10 = false AND var6 = true)
                    RETURN count(this1) > 0 AS var11
                }
                WITH *
                WHERE var11 = true
                RETURN count(this0) > 0 AS var12
            }
            WITH *
            WHERE var12 = true
            RETURN this { .released } AS this"
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
                MATCH (this3:\`Actor\`)-[:ACTED_IN]->(this)
                CALL {
                    WITH this3
                    MATCH (this3)-[this4:ACTED_IN]->(this5:\`Movie\`)
                    RETURN max(this5.released) > $param1 AS var6
                }
                CALL {
                    WITH this3
                    MATCH (this3)-[:ACTED_IN]->(this7:\`Movie\`)
                    CALL {
                        WITH this7
                        MATCH (this9:\`Actor\`)-[this8:ACTED_IN]->(this7)
                        RETURN avg(size(this9.name)) = $param2 AS var10
                    }
                    CALL {
                        WITH this7
                        MATCH (this11:\`Actor\`)-[:ACTED_IN]->(this7)
                        CALL {
                            WITH this11
                            MATCH (this11)-[this12:ACTED_IN]->(this13:\`Movie\`)
                            RETURN count(this13) > $param3 AS var14
                        }
                        WITH *
                        WHERE var14 = true
                        RETURN count(this11) > 0 AS var15
                    }
                    CALL {
                        WITH this7
                        MATCH (this11:\`Actor\`)-[:ACTED_IN]->(this7)
                        CALL {
                            WITH this11
                            MATCH (this11)-[this16:ACTED_IN]->(this17:\`Movie\`)
                            RETURN count(this17) > $param4 AS var18
                        }
                        WITH *
                        WHERE NOT (var18 = true)
                        RETURN count(this11) > 0 AS var19
                    }
                    WITH *
                    WHERE (var10 = true AND (var19 = false AND var15 = true))
                    RETURN count(this7) > 0 AS var20
                }
                WITH *
                WHERE (var6 = true AND var20 = true)
                RETURN count(this3) > 0 AS var21
            }
            WITH *
            WHERE (var2 = true AND var21 = true)
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
                },
                \\"param4\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
