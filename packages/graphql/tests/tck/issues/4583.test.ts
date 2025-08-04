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

describe("https://github.com/neo4j/graphql/issues/4583", () => {
    let typeDefs;
    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Episode @node {
                runtime: Int!
                series: [Series!]! @relationship(type: "HAS_EPISODE", direction: IN)
            }

            interface Production {
                title: String!
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Production @node {
                title: String!
                runtime: Int!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Series implements Production @node {
                title: String!
                episodeCount: Int!
                episodes: [Episode!]! @relationship(type: "HAS_EPISODE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "StarredIn")
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type StarredIn @relationshipProperties {
                episodeNr: Int!
            }

            type Actor @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;
    });

    test("typename should work for connect operation", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const mutation = /* GraphQL */ `
            mutation {
                createActors(
                    input: {
                        name: "My Actor"
                        actedIn: {
                            connect: {
                                edge: { screenTime: 10 }
                                where: { node: { title: { eq: "movieTitle" }, typename: [Movie] } }
                            }
                        }
                    }
                ) {
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, mutation);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Actor)
                SET
                    this0.name = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Movie)
                    WHERE (this1.title = $param1 AND this1:Movie)
                    CREATE (this0)-[this2:ACTED_IN]->(this1)
                    SET
                        this2.screenTime = $param2
                }
                WITH *
                CALL (this0) {
                    MATCH (this3:Series)
                    WHERE (this3.title = $param3 AND this3:Movie)
                    CREATE (this0)-[this4:ACTED_IN]->(this3)
                    SET
                        this4.screenTime = $param4
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .name } AS var5
            }
            RETURN collect(var5) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"My Actor\\",
                \\"param1\\": \\"movieTitle\\",
                \\"param2\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param3\\": \\"movieTitle\\",
                \\"param4\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("typename should work for connect operation, with a logical operator", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const mutation = /* GraphQL */ `
            mutation {
                createActors(
                    input: {
                        name: "My Actor"
                        actedIn: {
                            connect: {
                                edge: { screenTime: 10 }
                                where: { node: { OR: [{ title: { eq: "movieTitle" } }, { typename: [Movie] }] } }
                            }
                        }
                    }
                ) {
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, mutation);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Actor)
                SET
                    this0.name = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Movie)
                    WHERE (this1.title = $param1 OR this1:Movie)
                    CREATE (this0)-[this2:ACTED_IN]->(this1)
                    SET
                        this2.screenTime = $param2
                }
                WITH *
                CALL (this0) {
                    MATCH (this3:Series)
                    WHERE (this3.title = $param3 OR this3:Movie)
                    CREATE (this0)-[this4:ACTED_IN]->(this3)
                    SET
                        this4.screenTime = $param4
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .name } AS var5
            }
            RETURN collect(var5) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"My Actor\\",
                \\"param1\\": \\"movieTitle\\",
                \\"param2\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param3\\": \\"movieTitle\\",
                \\"param4\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("typename should work for nested connect operation", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const mutation = /* GraphQL */ `
            mutation {
                createActors(
                    input: {
                        name: "My Actor"
                        actedIn: {
                            connect: {
                                edge: { screenTime: 10 }
                                where: { node: { title: { eq: "movieTitle" }, typename: [Movie] } }
                                connect: {
                                    actors: {
                                        edge: { StarredIn: { episodeNr: 10 }, ActedIn: { screenTime: 25 } }
                                        where: { node: { name: { eq: "Second Actor" } } }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, mutation);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Actor)
                SET
                    this0.name = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Movie)
                    WHERE (this1.title = $param1 AND this1:Movie)
                    CALL (this1) {
                        MATCH (this2:Actor)
                        WHERE this2.name = $param2
                        CREATE (this1)<-[this3:ACTED_IN]-(this2)
                        SET
                            this3.screenTime = $param3
                    }
                    CREATE (this0)-[this4:ACTED_IN]->(this1)
                    SET
                        this4.screenTime = $param4
                }
                WITH *
                CALL (this0) {
                    MATCH (this5:Series)
                    WHERE (this5.title = $param5 AND this5:Movie)
                    CALL (this5) {
                        MATCH (this6:Actor)
                        WHERE this6.name = $param6
                        CREATE (this5)<-[this7:ACTED_IN]-(this6)
                        SET
                            this7.episodeNr = $param7
                    }
                    CREATE (this0)-[this8:ACTED_IN]->(this5)
                    SET
                        this8.screenTime = $param8
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .name } AS var9
            }
            RETURN collect(var9) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"My Actor\\",
                \\"param1\\": \\"movieTitle\\",
                \\"param2\\": \\"Second Actor\\",
                \\"param3\\": {
                    \\"low\\": 25,
                    \\"high\\": 0
                },
                \\"param4\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param5\\": \\"movieTitle\\",
                \\"param6\\": \\"Second Actor\\",
                \\"param7\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param8\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
