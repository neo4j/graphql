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

describe("https://github.com/neo4j/graphql/issues/2803", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = /* GraphQL */ `
        type Movie @node {
            actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            released: Int!
        }

        type Actor @node {
            movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            name: String
        }

        type ActedIn @relationshipProperties {
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
        const query = /* GraphQL */ `
            {
                actors(where: { movies_SOME: { actors_ALL: { moviesAggregate: { count_GT: 1 } } } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL {
                    WITH this0
                    MATCH (this0)<-[:ACTED_IN]-(this1:Actor)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                        RETURN count(this3) > $param0 AS var4
                    }
                    WITH *
                    WHERE var4 = true
                    RETURN count(this1) > 0 AS var5
                }
                CALL {
                    WITH this0
                    MATCH (this0)<-[:ACTED_IN]-(this1:Actor)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this6:ACTED_IN]->(this7:Movie)
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
        const query = /* GraphQL */ `
            {
                actors(
                    where: {
                        movies_SOME: {
                            actors_ALL: { moviesAggregate: { count_GT: 1 } }
                            actorsAggregate: { count_EQ: 1 }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL {
                    WITH this0
                    MATCH (this0)<-[:ACTED_IN]-(this1:Actor)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                        RETURN count(this3) > $param0 AS var4
                    }
                    WITH *
                    WHERE var4 = true
                    RETURN count(this1) > 0 AS var5
                }
                CALL {
                    WITH this0
                    MATCH (this0)<-[:ACTED_IN]-(this1:Actor)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this6:ACTED_IN]->(this7:Movie)
                        RETURN count(this7) > $param1 AS var8
                    }
                    WITH *
                    WHERE NOT (var8 = true)
                    RETURN count(this1) > 0 AS var9
                }
                CALL {
                    WITH this0
                    MATCH (this0)<-[this10:ACTED_IN]-(this11:Actor)
                    RETURN count(this11) = $param2 AS var12
                }
                WITH *
                WHERE ((var9 = false AND var5 = true) AND var12 = true)
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
        const query = /* GraphQL */ `
            {
                movies(where: { actors_SOME: { movies_SOME: { actors_ALL: { moviesAggregate: { count_GT: 2 } } } } }) {
                    released
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)<-[:ACTED_IN]-(this0:Actor)
                CALL {
                    WITH this0
                    MATCH (this0)-[:ACTED_IN]->(this1:Movie)
                    CALL {
                        WITH this1
                        MATCH (this1)<-[:ACTED_IN]-(this2:Actor)
                        CALL {
                            WITH this2
                            MATCH (this2)-[this3:ACTED_IN]->(this4:Movie)
                            RETURN count(this4) > $param0 AS var5
                        }
                        WITH *
                        WHERE var5 = true
                        RETURN count(this2) > 0 AS var6
                    }
                    CALL {
                        WITH this1
                        MATCH (this1)<-[:ACTED_IN]-(this2:Actor)
                        CALL {
                            WITH this2
                            MATCH (this2)-[this7:ACTED_IN]->(this8:Movie)
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
        const query = /* GraphQL */ `
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
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)<-[:ACTED_IN]-(this0:Actor)
                CALL {
                    WITH this0
                    MATCH (this0)-[:ACTED_IN]->(this1:Movie)
                    CALL {
                        WITH this1
                        MATCH (this1)<-[:ACTED_IN]-(this2:Actor)
                        CALL {
                            WITH this2
                            MATCH (this2)-[this3:ACTED_IN]->(this4:Movie)
                            RETURN count(this4) > $param0 AS var5
                        }
                        WITH *
                        WHERE var5 = true
                        RETURN count(this2) > 0 AS var6
                    }
                    CALL {
                        WITH this1
                        MATCH (this1)<-[:ACTED_IN]-(this2:Actor)
                        CALL {
                            WITH this2
                            MATCH (this2)-[this7:ACTED_IN]->(this8:Movie)
                            RETURN count(this8) > $param1 AS var9
                        }
                        WITH *
                        WHERE NOT (var9 = true)
                        RETURN count(this2) > 0 AS var10
                    }
                    CALL {
                        WITH this1
                        MATCH (this1)<-[this11:ACTED_IN]-(this12:Actor)
                        RETURN avg(size(this12.name)) < $param2 AS var13
                    }
                    WITH *
                    WHERE ((var10 = false AND var6 = true) AND var13 = true)
                    RETURN count(this1) > 0 AS var14
                }
                CALL {
                    WITH this0
                    MATCH (this0)-[this15:ACTED_IN]->(this16:Movie)
                    RETURN avg(this16.released) = $param3 AS var17
                }
                WITH *
                WHERE (var14 = true AND var17 = true)
                RETURN count(this0) = 1 AS var18
            }
            CALL {
                WITH this
                MATCH (this)<-[this19:ACTED_IN]-(this20:Actor)
                RETURN avg(size(this20.name)) >= $param4 AS var21
            }
            WITH *
            WHERE (var18 = true AND var21 = true)
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
                },
                \\"param2\\": 10,
                \\"param3\\": 25,
                \\"param4\\": 3
            }"
        `);
    });

    test("should find movies aggregate within double nested connections", async () => {
        const query = /* GraphQL */ `
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
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    CALL {
                        WITH this3
                        MATCH (this3)-[this4:ACTED_IN]->(this5:Movie)
                        RETURN count(this5) > $param0 AS var6
                    }
                    WITH *
                    WHERE var6 = true
                    RETURN count(this3) > 0 AS var7
                }
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    CALL {
                        WITH this3
                        MATCH (this3)-[this8:ACTED_IN]->(this9:Movie)
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
        const query = /* GraphQL */ `
            {
                actors(
                    where: {
                        movies_SOME: {
                            actorsConnection_ALL: { node: { moviesAggregate: { count_GT: 1 } } }
                            actorsAggregate: { count_EQ: 1 }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    CALL {
                        WITH this2
                        MATCH (this2)-[this3:ACTED_IN]->(this4:Movie)
                        RETURN count(this4) > $param0 AS var5
                    }
                    WITH *
                    WHERE var5 = true
                    RETURN count(this2) > 0 AS var6
                }
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    CALL {
                        WITH this2
                        MATCH (this2)-[this7:ACTED_IN]->(this8:Movie)
                        RETURN count(this8) > $param1 AS var9
                    }
                    WITH *
                    WHERE NOT (var9 = true)
                    RETURN count(this2) > 0 AS var10
                }
                CALL {
                    WITH this0
                    MATCH (this0)<-[this11:ACTED_IN]-(this12:Actor)
                    RETURN count(this12) = $param2 AS var13
                }
                WITH *
                WHERE ((var10 = false AND var6 = true) AND var13 = true)
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
        const query = /* GraphQL */ `
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
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                    CALL {
                        WITH this3
                        MATCH (this3)<-[this4:ACTED_IN]-(this5:Actor)
                        CALL {
                            WITH this5
                            MATCH (this5)-[this6:ACTED_IN]->(this7:Movie)
                            RETURN count(this7) > $param0 AS var8
                        }
                        WITH *
                        WHERE var8 = true
                        RETURN count(this5) > 0 AS var9
                    }
                    CALL {
                        WITH this3
                        MATCH (this3)<-[this4:ACTED_IN]-(this5:Actor)
                        CALL {
                            WITH this5
                            MATCH (this5)-[this10:ACTED_IN]->(this11:Movie)
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
        const query = /* GraphQL */ `
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
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                    CALL {
                        WITH this3
                        MATCH (this3)<-[this4:ACTED_IN]-(this5:Actor)
                        CALL {
                            WITH this5
                            MATCH (this5)-[this6:ACTED_IN]->(this7:Movie)
                            RETURN count(this7) > $param0 AS var8
                        }
                        WITH *
                        WHERE var8 = true
                        RETURN count(this5) > 0 AS var9
                    }
                    CALL {
                        WITH this3
                        MATCH (this3)<-[this4:ACTED_IN]-(this5:Actor)
                        CALL {
                            WITH this5
                            MATCH (this5)-[this10:ACTED_IN]->(this11:Movie)
                            RETURN count(this11) > $param1 AS var12
                        }
                        WITH *
                        WHERE NOT (var12 = true)
                        RETURN count(this5) > 0 AS var13
                    }
                    CALL {
                        WITH this3
                        MATCH (this3)<-[this14:ACTED_IN]-(this15:Actor)
                        RETURN avg(size(this15.name)) < $param2 AS var16
                    }
                    WITH *
                    WHERE ((var13 = false AND var9 = true) AND var16 = true)
                    RETURN count(this3) > 0 AS var17
                }
                CALL {
                    WITH this1
                    MATCH (this1)-[this18:ACTED_IN]->(this19:Movie)
                    RETURN avg(this19.released) = $param3 AS var20
                }
                WITH *
                WHERE (var17 = true AND var20 = true)
                RETURN count(this1) > 0 AS var21
            }
            CALL {
                WITH this
                MATCH (this)<-[this22:ACTED_IN]-(this23:Actor)
                RETURN avg(size(this23.name)) >= $param4 AS var24
            }
            WITH *
            WHERE (var21 = true AND var24 = true)
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
                },
                \\"param2\\": 10,
                \\"param3\\": 25,
                \\"param4\\": 3
            }"
        `);
    });

    test("should find movies aggregate with connection nested in relationship", async () => {
        const query = /* GraphQL */ `
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
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    CALL {
                        WITH this2
                        MATCH (this2)-[this3:ACTED_IN]->(this4:Movie)
                        RETURN count(this4) > $param0 AS var5
                    }
                    WITH *
                    WHERE var5 = true
                    RETURN count(this2) > 0 AS var6
                }
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    CALL {
                        WITH this2
                        MATCH (this2)-[this7:ACTED_IN]->(this8:Movie)
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
        const query = /* GraphQL */ `
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
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                CALL {
                    WITH this1
                    MATCH (this1)<-[:ACTED_IN]-(this2:Actor)
                    CALL {
                        WITH this2
                        MATCH (this2)-[this3:ACTED_IN]->(this4:Movie)
                        RETURN count(this4) > $param0 AS var5
                    }
                    WITH *
                    WHERE var5 = true
                    RETURN count(this2) > 0 AS var6
                }
                CALL {
                    WITH this1
                    MATCH (this1)<-[:ACTED_IN]-(this2:Actor)
                    CALL {
                        WITH this2
                        MATCH (this2)-[this7:ACTED_IN]->(this8:Movie)
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
        const query = /* GraphQL */ `
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
            "MATCH (this:Movie)
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
                CALL {
                    WITH this1
                    MATCH (this1)-[:ACTED_IN]->(this2:Movie)
                    CALL {
                        WITH this2
                        MATCH (this2)<-[this3:ACTED_IN]-(this4:Actor)
                        CALL {
                            WITH this4
                            MATCH (this4)-[this5:ACTED_IN]->(this6:Movie)
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
        const query = /* GraphQL */ `
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
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL {
                    WITH this0
                    MATCH (this0)<-[:ACTED_IN]-(this1:Actor)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                        RETURN avg(this2.screenTime) <= $param0 AS var4
                    }
                    WITH *
                    WHERE var4 = true
                    RETURN count(this1) > 0 AS var5
                }
                CALL {
                    WITH this0
                    MATCH (this0)<-[this6:ACTED_IN]-(this7:Actor)
                    RETURN avg(this6.screenTime) <= $param1 AS var8
                }
                WITH *
                WHERE (var5 = false AND var8 = true)
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
        const query = /* GraphQL */ `
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
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    CALL {
                        WITH this3
                        MATCH (this3)-[this4:ACTED_IN]->(this5:Movie)
                        RETURN count(this5) > $param0 AS var6
                    }
                    WITH *
                    WHERE (var6 = true AND $param1 IN this2.roles)
                    RETURN count(this3) > 0 AS var7
                }
                WITH *
                WHERE (var7 = false AND $param2 IN this0.roles)
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
        const query = /* GraphQL */ `
            {
                actors(
                    where: {
                        moviesConnection_SINGLE: {
                            node: {
                                actorsConnection_SOME: {
                                    node: { name_EQ: "actor name", moviesAggregate: { count_GT: 1 } }
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
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    CALL {
                        WITH this3
                        MATCH (this3)-[this4:ACTED_IN]->(this5:Movie)
                        RETURN count(this5) > $param0 AS var6
                    }
                    WITH *
                    WHERE ((this3.name = $param1 AND var6 = true) AND $param2 IN this2.roles)
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
                \\"param1\\": \\"actor name\\",
                \\"param2\\": \\"actor role\\"
            }"
        `);
    });

    test("should be able to filter by node properties and aggregations in nested relationships", async () => {
        const query = /* GraphQL */ `
            {
                actors(
                    where: { movies_ALL: { actors_SOME: { name_EQ: "a name", moviesAggregate: { count_GT: 1 } } } }
                ) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL {
                    WITH this0
                    MATCH (this0)<-[:ACTED_IN]-(this1:Actor)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
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
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL {
                    WITH this0
                    MATCH (this0)<-[:ACTED_IN]-(this7:Actor)
                    CALL {
                        WITH this7
                        MATCH (this7)-[this8:ACTED_IN]->(this9:Movie)
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
        const query = /* GraphQL */ `
            {
                actors(
                    where: {
                        movies_ALL: {
                            actors_SOME: { OR: [{ name_EQ: "some name" }, { moviesAggregate: { count_GT: 1 } }] }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL {
                    WITH this0
                    MATCH (this0)<-[:ACTED_IN]-(this1:Actor)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
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
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL {
                    WITH this0
                    MATCH (this0)<-[:ACTED_IN]-(this7:Actor)
                    CALL {
                        WITH this7
                        MATCH (this7)-[this8:ACTED_IN]->(this9:Movie)
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
        const query = /* GraphQL */ `
            {
                actors(
                    where: {
                        movies_ALL: {
                            actors_SOME: { AND: [{ name_EQ: "some name" }, { moviesAggregate: { count_GT: 1 } }] }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL {
                    WITH this0
                    MATCH (this0)<-[:ACTED_IN]-(this1:Actor)
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
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
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL {
                    WITH this0
                    MATCH (this0)<-[:ACTED_IN]-(this7:Actor)
                    CALL {
                        WITH this7
                        MATCH (this7)-[this8:ACTED_IN]->(this9:Movie)
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
        const query = /* GraphQL */ `
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
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    CALL {
                        WITH this3
                        MATCH (this3)-[this4:ACTED_IN]->(this5:Movie)
                        RETURN count(this5) > $param0 AS var6
                    }
                    WITH *
                    WHERE (var6 = true AND $param1 IN this2.roles)
                    RETURN count(this3) > 0 AS var7
                }
                WITH *
                WHERE (var7 = false AND $param2 IN this0.roles)
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
        const query = /* GraphQL */ `
            mutation {
                deleteActors(
                    where: {
                        moviesConnection_SINGLE: {
                            node: {
                                actorsConnection_SOME: {
                                    node: { name_EQ: "a name", moviesAggregate: { count_GT: 1 } }
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
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                CALL {
                    WITH this1
                    MATCH (this1)<-[this2:ACTED_IN]-(this3:Actor)
                    CALL {
                        WITH this3
                        MATCH (this3)-[this4:ACTED_IN]->(this5:Movie)
                        RETURN count(this5) > $param0 AS var6
                    }
                    WITH *
                    WHERE ((this3.name = $param1 AND var6 = true) AND $param2 IN this2.roles)
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
                \\"param1\\": \\"a name\\",
                \\"param2\\": \\"some-role\\"
            }"
        `);
    });
});
