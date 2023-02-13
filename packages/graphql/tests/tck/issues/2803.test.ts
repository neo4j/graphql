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
            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            released: Int!
        }

        type Actor {
            movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            name: String
        }

        interface ActedIn @relationshipProperties {
            screenTime: Int!
            roles: [String!]!
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
        MATCH (this0)<-[:ACTED_IN]-(this1:\`Actor\`)
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
        MATCH (this0)<-[:ACTED_IN]-(this1:\`Actor\`)
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
        MATCH (this0)<-[this1:ACTED_IN]-(this2:\`Actor\`)
        RETURN count(this2) = $param0 AS var3
    }
    CALL {
        WITH this0
        MATCH (this0)<-[:ACTED_IN]-(this4:\`Actor\`)
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
        MATCH (this0)<-[:ACTED_IN]-(this4:\`Actor\`)
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
                movies(where: { actors_SOME: { movies_SOME: { actors_ALL: { moviesAggregate: { count_GT: 2 } } } } }) {
                    released
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
"MATCH (this:\`Movie\`)
CALL {
    WITH this
    MATCH (this)<-[:ACTED_IN]-(this0:\`Actor\`)
    CALL {
        WITH this0
        MATCH (this0)-[:ACTED_IN]->(this1:\`Movie\`)
        CALL {
            WITH this1
            MATCH (this1)<-[:ACTED_IN]-(this2:\`Actor\`)
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
            MATCH (this1)<-[:ACTED_IN]-(this2:\`Actor\`)
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
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 2,
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
                        actors_SINGLE: {
                            movies_SOME: {
                                actors_ALL: { moviesAggregate: { count_GT: 1 } }
                                actorsAggregate: { node: { name_AVERAGE_LT: 10 } }
                            }
                            moviesAggregate: { node: { released_AVERAGE_EQUAL: 25 } }
                        }
                        actorsAggregate: { node: { name_AVERAGE_GTE: 3 } }
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
    MATCH (this)<-[this0:ACTED_IN]-(this1:\`Actor\`)
    RETURN avg(size(this1.name)) >= $param0 AS var2
}
CALL {
    WITH this
    MATCH (this)<-[:ACTED_IN]-(this3:\`Actor\`)
    CALL {
        WITH this3
        MATCH (this3)-[this4:ACTED_IN]->(this5:\`Movie\`)
        RETURN avg(this5.released) = $param1 AS var6
    }
    CALL {
        WITH this3
        MATCH (this3)-[:ACTED_IN]->(this7:\`Movie\`)
        CALL {
            WITH this7
            MATCH (this7)<-[this8:ACTED_IN]-(this9:\`Actor\`)
            RETURN avg(size(this9.name)) < $param2 AS var10
        }
        CALL {
            WITH this7
            MATCH (this7)<-[:ACTED_IN]-(this11:\`Actor\`)
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
            MATCH (this7)<-[:ACTED_IN]-(this11:\`Actor\`)
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
    RETURN count(this3) = 1 AS var21
}
WITH *
WHERE (var2 = true AND var21 = true)
RETURN this { .released } AS this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 3,
                \\"param1\\": 25,
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

    test("should find movies aggregate within double nested connections", async () => {
        const query = gql`
            {
                actors(
                    where: {
                        moviesConnection_SOME: {
                            node: { actorsConnection_ALL: { node: { moviesAggregate: { count_GT: 1 } } } }
                        }
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
    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
    CALL {
        WITH this1
        MATCH (this1)<-[this2:ACTED_IN]-(this3:\`Actor\`)
        CALL {
            WITH this3
            MATCH (this3)-[this4:ACTED_IN]->(this5:\`Movie\`)
            RETURN count(this5) > $param0 AS var6
        }
        WITH *
        WHERE var6 = true
        RETURN count(this3) > 0 AS var7
    }
    CALL {
        WITH this1
        MATCH (this1)<-[this2:ACTED_IN]-(this3:\`Actor\`)
        CALL {
            WITH this3
            MATCH (this3)-[this8:ACTED_IN]->(this9:\`Movie\`)
            RETURN count(this9) > $param1 AS var10
        }
        WITH *
        WHERE NOT (var10 = true)
        RETURN count(this3) > 0 AS var11
    }
    WITH *
    WHERE (var11 = false AND var7 = true)
    RETURN count(this1) > 0 AS var12
}
WITH *
WHERE var12 = true
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

    test("should find aggregations at all levels within double nested connections", async () => {
        const query = gql`
            {
                actors(
                    where: {
                        movies_SOME: {
                            actorsConnection_ALL: { node: { moviesAggregate: { count_GT: 1 } } }
                            actorsAggregate: { count: 1 }
                        }
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
        MATCH (this0)<-[this1:ACTED_IN]-(this2:\`Actor\`)
        RETURN count(this2) = $param0 AS var3
    }
    CALL {
        WITH this0
        MATCH (this0)<-[this4:ACTED_IN]-(this5:\`Actor\`)
        CALL {
            WITH this5
            MATCH (this5)-[this6:ACTED_IN]->(this7:\`Movie\`)
            RETURN count(this7) > $param1 AS var8
        }
        WITH *
        WHERE var8 = true
        RETURN count(this5) > 0 AS var9
    }
    CALL {
        WITH this0
        MATCH (this0)<-[this4:ACTED_IN]-(this5:\`Actor\`)
        CALL {
            WITH this5
            MATCH (this5)-[this10:ACTED_IN]->(this11:\`Movie\`)
            RETURN count(this11) > $param2 AS var12
        }
        WITH *
        WHERE NOT (var12 = true)
        RETURN count(this5) > 0 AS var13
    }
    WITH *
    WHERE (var3 = true AND (var13 = false AND var9 = true))
    RETURN count(this0) > 0 AS var14
}
WITH *
WHERE var14 = true
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

    test("should find movies aggregate within triple nested connections", async () => {
        const query = gql`
            {
                movies(
                    where: {
                        actorsConnection_SOME: {
                            node: {
                                moviesConnection_SOME: {
                                    node: { actorsConnection_ALL: { node: { moviesAggregate: { count_GT: 2 } } } }
                                }
                            }
                        }
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
    MATCH (this)<-[this0:ACTED_IN]-(this1:\`Actor\`)
    CALL {
        WITH this1
        MATCH (this1)-[this2:ACTED_IN]->(this3:\`Movie\`)
        CALL {
            WITH this3
            MATCH (this3)<-[this4:ACTED_IN]-(this5:\`Actor\`)
            CALL {
                WITH this5
                MATCH (this5)-[this6:ACTED_IN]->(this7:\`Movie\`)
                RETURN count(this7) > $param0 AS var8
            }
            WITH *
            WHERE var8 = true
            RETURN count(this5) > 0 AS var9
        }
        CALL {
            WITH this3
            MATCH (this3)<-[this4:ACTED_IN]-(this5:\`Actor\`)
            CALL {
                WITH this5
                MATCH (this5)-[this10:ACTED_IN]->(this11:\`Movie\`)
                RETURN count(this11) > $param1 AS var12
            }
            WITH *
            WHERE NOT (var12 = true)
            RETURN count(this5) > 0 AS var13
        }
        WITH *
        WHERE (var13 = false AND var9 = true)
        RETURN count(this3) > 0 AS var14
    }
    WITH *
    WHERE var14 = true
    RETURN count(this1) > 0 AS var15
}
WITH *
WHERE var15 = true
RETURN this { .released } AS this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find aggregations at all levels within within triple nested connections", async () => {
        const query = gql`
            {
                movies(
                    where: {
                        actorsConnection_SOME: {
                            node: {
                                moviesConnection_SOME: {
                                    node: {
                                        actorsConnection_ALL: { node: { moviesAggregate: { count_GT: 1 } } }
                                        actorsAggregate: { node: { name_AVERAGE_LT: 10 } }
                                    }
                                }
                                moviesAggregate: { node: { released_AVERAGE_EQUAL: 25 } }
                            }
                        }
                        actorsAggregate: { node: { name_AVERAGE_GTE: 3 } }
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
    MATCH (this)<-[this0:ACTED_IN]-(this1:\`Actor\`)
    RETURN avg(size(this1.name)) >= $param0 AS var2
}
CALL {
    WITH this
    MATCH (this)<-[this3:ACTED_IN]-(this4:\`Actor\`)
    CALL {
        WITH this4
        MATCH (this4)-[this5:ACTED_IN]->(this6:\`Movie\`)
        RETURN avg(this6.released) = $param1 AS var7
    }
    CALL {
        WITH this4
        MATCH (this4)-[this8:ACTED_IN]->(this9:\`Movie\`)
        CALL {
            WITH this9
            MATCH (this9)<-[this10:ACTED_IN]-(this11:\`Actor\`)
            RETURN avg(size(this11.name)) < $param2 AS var12
        }
        CALL {
            WITH this9
            MATCH (this9)<-[this13:ACTED_IN]-(this14:\`Actor\`)
            CALL {
                WITH this14
                MATCH (this14)-[this15:ACTED_IN]->(this16:\`Movie\`)
                RETURN count(this16) > $param3 AS var17
            }
            WITH *
            WHERE var17 = true
            RETURN count(this14) > 0 AS var18
        }
        CALL {
            WITH this9
            MATCH (this9)<-[this13:ACTED_IN]-(this14:\`Actor\`)
            CALL {
                WITH this14
                MATCH (this14)-[this19:ACTED_IN]->(this20:\`Movie\`)
                RETURN count(this20) > $param4 AS var21
            }
            WITH *
            WHERE NOT (var21 = true)
            RETURN count(this14) > 0 AS var22
        }
        WITH *
        WHERE (var12 = true AND (var22 = false AND var18 = true))
        RETURN count(this9) > 0 AS var23
    }
    WITH *
    WHERE (var7 = true AND var23 = true)
    RETURN count(this4) > 0 AS var24
}
WITH *
WHERE (var2 = true AND var24 = true)
RETURN this { .released } AS this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 3,
                \\"param1\\": 25,
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

    test("should find movies aggregate with connection nested in relationship", async () => {
        const query = gql`
            {
                actors(
                    where: { movies_SOME: { actorsConnection_ALL: { node: { moviesAggregate: { count_GT: 1 } } } } }
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
        MATCH (this0)<-[this1:ACTED_IN]-(this2:\`Actor\`)
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
        WITH this0
        MATCH (this0)<-[this1:ACTED_IN]-(this2:\`Actor\`)
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
    RETURN count(this0) > 0 AS var11
}
WITH *
WHERE var11 = true
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

    test("should find movies aggregate with relationship nested in connection", async () => {
        const query = gql`
            {
                actors(
                    where: { moviesConnection_SOME: { node: { actors_ALL: { moviesAggregate: { count_GT: 1 } } } } }
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
    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
    CALL {
        WITH this1
        MATCH (this1)<-[:ACTED_IN]-(this2:\`Actor\`)
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
        MATCH (this1)<-[:ACTED_IN]-(this2:\`Actor\`)
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

    test("should find movies aggregate with triple nested mix of relations and connections", async () => {
        const query = gql`
            {
                movies(
                    where: {
                        actorsConnection_SOME: {
                            node: {
                                movies_SINGLE: { actorsConnection_NONE: { node: { moviesAggregate: { count_GT: 2 } } } }
                            }
                        }
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
    MATCH (this)<-[this0:ACTED_IN]-(this1:\`Actor\`)
    CALL {
        WITH this1
        MATCH (this1)-[:ACTED_IN]->(this2:\`Movie\`)
        CALL {
            WITH this2
            MATCH (this2)<-[this3:ACTED_IN]-(this4:\`Actor\`)
            CALL {
                WITH this4
                MATCH (this4)-[this5:ACTED_IN]->(this6:\`Movie\`)
                RETURN count(this6) > $param0 AS var7
            }
            WITH *
            WHERE var7 = true
            RETURN count(this4) > 0 AS var8
        }
        WITH *
        WHERE var8 = false
        RETURN count(this2) = 1 AS var9
    }
    WITH *
    WHERE var9 = true
    RETURN count(this1) > 0 AS var10
}
WITH *
WHERE var10 = true
RETURN this { .released } AS this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("should find edge aggregations at all levels within double nested relationships", async () => {
        const query = gql`
            {
                actors(
                    where: {
                        movies_SINGLE: {
                            actors_NONE: { moviesAggregate: { edge: { screenTime_AVERAGE_LTE: 1000 } } }
                            actorsAggregate: { edge: { screenTime_AVERAGE_LTE: 1000 } }
                        }
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
        MATCH (this0)<-[this1:ACTED_IN]-(this2:\`Actor\`)
        RETURN avg(this1.screenTime) <= $param0 AS var3
    }
    CALL {
        WITH this0
        MATCH (this0)<-[:ACTED_IN]-(this4:\`Actor\`)
        CALL {
            WITH this4
            MATCH (this4)-[this5:ACTED_IN]->(this6:\`Movie\`)
            RETURN avg(this5.screenTime) <= $param1 AS var7
        }
        WITH *
        WHERE var7 = true
        RETURN count(this4) > 0 AS var8
    }
    WITH *
    WHERE (var3 = true AND var8 = false)
    RETURN count(this0) = 1 AS var9
}
WITH *
WHERE var9 = true
RETURN this { .name } AS this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 1000,
                \\"param1\\": 1000
            }"
        `);
    });

    test("should be able to filter by edge properties and aggregations in nested connections", async () => {
        const query = gql`
            {
                actors(
                    where: {
                        moviesConnection_SINGLE: {
                            node: {
                                actorsConnection_NONE: {
                                    node: { moviesAggregate: { count_GT: 1 } }
                                    edge: { roles_INCLUDES: "a role" }
                                }
                            }
                            edge: { roles_INCLUDES: "another role" }
                        }
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
    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
    CALL {
        WITH this1
        MATCH (this1)<-[this2:ACTED_IN]-(this3:\`Actor\`)
        CALL {
            WITH this3
            MATCH (this3)-[this4:ACTED_IN]->(this5:\`Movie\`)
            RETURN count(this5) > $param0 AS var6
        }
        WITH *
        WHERE ($param1 IN this2.roles AND var6 = true)
        RETURN count(this3) > 0 AS var7
    }
    WITH *
    WHERE ($param2 IN this0.roles AND var7 = false)
    RETURN count(this1) = 1 AS var8
}
WITH *
WHERE var8 = true
RETURN this { .name } AS this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param1\\": \\"a role\\",
                \\"param2\\": \\"another role\\"
            }"
        `);
    });

    test("should be able to filter by node properties, edge properties and aggregations in nested connections", async () => {
        const query = gql`
            {
                actors(
                    where: {
                        moviesConnection_SINGLE: {
                            node: {
                                actorsConnection_SOME: {
                                    node: { name: "actor name", moviesAggregate: { count_GT: 1 } }
                                    edge: { roles_INCLUDES: "actor role" }
                                }
                            }
                        }
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
    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
    CALL {
        WITH this1
        MATCH (this1)<-[this2:ACTED_IN]-(this3:\`Actor\`)
        CALL {
            WITH this3
            MATCH (this3)-[this4:ACTED_IN]->(this5:\`Movie\`)
            RETURN count(this5) > $param0 AS var6
        }
        WITH *
        WHERE ($param1 IN this2.roles AND (this3.name = $param2 AND var6 = true))
        RETURN count(this3) > 0 AS var7
    }
    WITH *
    WHERE var7 = true
    RETURN count(this1) = 1 AS var8
}
WITH *
WHERE var8 = true
RETURN this { .name } AS this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param1\\": \\"actor role\\",
                \\"param2\\": \\"actor name\\"
            }"
        `);
    });

    test("should be able to filter by node properties and aggregations in nested relationships", async () => {
        const query = gql`
            {
                actors(where: { movies_ALL: { actors_SOME: { name: "a name", moviesAggregate: { count_GT: 1 } } } }) {
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
        MATCH (this0)<-[:ACTED_IN]-(this1:\`Actor\`)
        CALL {
            WITH this1
            MATCH (this1)-[this2:ACTED_IN]->(this3:\`Movie\`)
            RETURN count(this3) > $param0 AS var4
        }
        WITH *
        WHERE (this1.name = $param1 AND var4 = true)
        RETURN count(this1) > 0 AS var5
    }
    WITH *
    WHERE var5 = true
    RETURN count(this0) > 0 AS var6
}
CALL {
    WITH this
    MATCH (this)-[:ACTED_IN]->(this0:\`Movie\`)
    CALL {
        WITH this0
        MATCH (this0)<-[:ACTED_IN]-(this7:\`Actor\`)
        CALL {
            WITH this7
            MATCH (this7)-[this8:ACTED_IN]->(this9:\`Movie\`)
            RETURN count(this9) > $param2 AS var10
        }
        WITH *
        WHERE (this7.name = $param3 AND var10 = true)
        RETURN count(this7) > 0 AS var11
    }
    WITH *
    WHERE NOT (var11 = true)
    RETURN count(this0) > 0 AS var12
}
WITH *
WHERE (var12 = false AND var6 = true)
RETURN this { .name } AS this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param1\\": \\"a name\\",
                \\"param2\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param3\\": \\"a name\\"
            }"
        `);
    });

    test("should be able to use logical OR operators with aggregations in nested relationships", async () => {
        const query = gql`
            {
                actors(
                    where: {
                        movies_ALL: {
                            actors_SOME: { OR: [{ name: "some name" }, { moviesAggregate: { count_GT: 1 } }] }
                        }
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
        MATCH (this0)<-[:ACTED_IN]-(this1:\`Actor\`)
        CALL {
            WITH this1
            MATCH (this1)-[this2:ACTED_IN]->(this3:\`Movie\`)
            RETURN count(this3) > $param0 AS var4
        }
        WITH *
        WHERE (this1.name = $param1 OR var4 = true)
        RETURN count(this1) > 0 AS var5
    }
    WITH *
    WHERE var5 = true
    RETURN count(this0) > 0 AS var6
}
CALL {
    WITH this
    MATCH (this)-[:ACTED_IN]->(this0:\`Movie\`)
    CALL {
        WITH this0
        MATCH (this0)<-[:ACTED_IN]-(this7:\`Actor\`)
        CALL {
            WITH this7
            MATCH (this7)-[this8:ACTED_IN]->(this9:\`Movie\`)
            RETURN count(this9) > $param2 AS var10
        }
        WITH *
        WHERE (this7.name = $param3 OR var10 = true)
        RETURN count(this7) > 0 AS var11
    }
    WITH *
    WHERE NOT (var11 = true)
    RETURN count(this0) > 0 AS var12
}
WITH *
WHERE (var12 = false AND var6 = true)
RETURN this { .name } AS this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param1\\": \\"some name\\",
                \\"param2\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param3\\": \\"some name\\"
            }"
        `);
    });

    test("should be able to use logical AND operators with aggregations in nested relationships", async () => {
        const query = gql`
            {
                actors(
                    where: {
                        movies_ALL: {
                            actors_SOME: { AND: [{ name: "some name" }, { moviesAggregate: { count_GT: 1 } }] }
                        }
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
        MATCH (this0)<-[:ACTED_IN]-(this1:\`Actor\`)
        CALL {
            WITH this1
            MATCH (this1)-[this2:ACTED_IN]->(this3:\`Movie\`)
            RETURN count(this3) > $param0 AS var4
        }
        WITH *
        WHERE (this1.name = $param1 AND var4 = true)
        RETURN count(this1) > 0 AS var5
    }
    WITH *
    WHERE var5 = true
    RETURN count(this0) > 0 AS var6
}
CALL {
    WITH this
    MATCH (this)-[:ACTED_IN]->(this0:\`Movie\`)
    CALL {
        WITH this0
        MATCH (this0)<-[:ACTED_IN]-(this7:\`Actor\`)
        CALL {
            WITH this7
            MATCH (this7)-[this8:ACTED_IN]->(this9:\`Movie\`)
            RETURN count(this9) > $param2 AS var10
        }
        WITH *
        WHERE (this7.name = $param3 AND var10 = true)
        RETURN count(this7) > 0 AS var11
    }
    WITH *
    WHERE NOT (var11 = true)
    RETURN count(this0) > 0 AS var12
}
WITH *
WHERE (var12 = false AND var6 = true)
RETURN this { .name } AS this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param1\\": \\"some name\\",
                \\"param2\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param3\\": \\"some name\\"
            }"
        `);
    });

    test("should be able to filter update mutations by node properties, edge properties and aggregations in nested connections", async () => {
        const query = gql`
            mutation {
                updateActors(
                    where: {
                        moviesConnection_SINGLE: {
                            node: {
                                actorsConnection_NONE: {
                                    node: { moviesAggregate: { count_GT: 1 } }
                                    edge: { roles_INCLUDES: "some role" }
                                }
                            }
                            edge: { roles_INCLUDES: "another role" }
                        }
                    }
                    update: { name: "Exciting new name!" }
                ) {
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
"MATCH (this:\`Actor\`)
CALL {
    WITH this
    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
    CALL {
        WITH this1
        MATCH (this1)<-[this2:ACTED_IN]-(this3:\`Actor\`)
        CALL {
            WITH this3
            MATCH (this3)-[this4:ACTED_IN]->(this5:\`Movie\`)
            RETURN count(this5) > $param0 AS var6
        }
        WITH *
        WHERE ($param1 IN this2.roles AND var6 = true)
        RETURN count(this3) > 0 AS var7
    }
    WITH *
    WHERE ($param2 IN this0.roles AND var7 = false)
    RETURN count(this1) = 1 AS var8
}
WITH *
WHERE var8 = true
SET this.name = $this_update_name
RETURN collect(DISTINCT this { .name }) AS data"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param1\\": \\"some role\\",
                \\"param2\\": \\"another role\\",
                \\"this_update_name\\": \\"Exciting new name!\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("should be able to filter delete mutations by node properties, edge properties and aggregations in nested connections", async () => {
        const query = gql`
            mutation {
                deleteActors(
                    where: {
                        moviesConnection_SINGLE: {
                            node: {
                                actorsConnection_SOME: {
                                    node: { name: "a name", moviesAggregate: { count_GT: 1 } }
                                    edge: { roles_INCLUDES: "some-role" }
                                }
                            }
                        }
                    }
                ) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
"MATCH (this:\`Actor\`)
CALL {
    WITH this
    MATCH (this)-[this0:ACTED_IN]->(this1:\`Movie\`)
    CALL {
        WITH this1
        MATCH (this1)<-[this2:ACTED_IN]-(this3:\`Actor\`)
        CALL {
            WITH this3
            MATCH (this3)-[this4:ACTED_IN]->(this5:\`Movie\`)
            RETURN count(this5) > $param0 AS var6
        }
        WITH *
        WHERE ($param1 IN this2.roles AND (this3.name = $param2 AND var6 = true))
        RETURN count(this3) > 0 AS var7
    }
    WITH *
    WHERE var7 = true
    RETURN count(this1) = 1 AS var8
}
WITH *
WHERE var8 = true
DETACH DELETE this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param1\\": \\"some-role\\",
                \\"param2\\": \\"a name\\"
            }"
        `);
    });
});
