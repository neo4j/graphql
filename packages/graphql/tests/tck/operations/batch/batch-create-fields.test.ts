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

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Batch Create, Scalar types", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor {
                id: ID! @id @unique
                name: String
                born: Date
                createdAt: DateTime @timestamp(operations: [CREATE])
                website: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Movie {
                id: ID
                runningTime: Duration
                location: Point
                createdAt: DateTime @timestamp(operations: [CREATE])
                website: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Website {
                address: String
            }

            type ActedIn @relationshipProperties {
                year: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("no nested batch", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        { id: "1", runningTime: "P14DT16H12M", location: { longitude: 3.0, latitude: 3.0 } }
                        { id: "2" }
                    ]
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.createdAt = datetime(),
                    create_this1.id = create_var0.id,
                    create_this1.runningTime = create_var0.runningTime,
                    create_this1.location = point(create_var0.location)
                WITH create_this1
                CALL {
                    WITH create_this1
                    MATCH (create_this1)-[create_this2:HAS_WEBSITE]->(:Website)
                    WITH count(create_this2) AS c
                    WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one\\", [0])
                    RETURN c AS create_var3
                }
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"runningTime\\": {
                            \\"months\\": 0,
                            \\"days\\": 14,
                            \\"seconds\\": {
                                \\"low\\": 58320,
                                \\"high\\": 0
                            },
                            \\"nanoseconds\\": {
                                \\"low\\": 0,
                                \\"high\\": 0
                            }
                        },
                        \\"location\\": {
                            \\"longitude\\": 3,
                            \\"latitude\\": 3
                        }
                    },
                    {
                        \\"id\\": \\"2\\"
                    }
                ]
            }"
        `);
    });

    test("1 to 1 cardinality", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            id: "1"
                            actors: {
                                create: [
                                    {
                                        node: {
                                            name: "actor 1"
                                            website: { create: { node: { address: "Actor1.com" } } }
                                        }
                                        edge: { year: 2022 }
                                    }
                                ]
                            }
                        }
                        { id: "2", website: { create: { node: { address: "The Matrix2.com" } } } }
                    ]
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.createdAt = datetime(),
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.id = randomUUID(),
                        create_this3.createdAt = datetime(),
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    SET
                        create_this4.year = create_var2.edge.year
                    WITH create_this3, create_var2
                    CALL {
                        WITH create_this3, create_var2
                        UNWIND create_var2.node.website.create AS create_var5
                        CREATE (create_this6:Website)
                        SET
                            create_this6.address = create_var5.node.address
                        MERGE (create_this3)-[create_this7:HAS_WEBSITE]->(create_this6)
                        RETURN collect(NULL) AS create_var8
                    }
                    WITH create_this3
                    CALL {
                        WITH create_this3
                        MATCH (create_this3)-[create_this9:HAS_WEBSITE]->(:Website)
                        WITH count(create_this9) AS c
                        WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one\\", [0])
                        RETURN c AS create_var10
                    }
                    RETURN collect(NULL) AS create_var11
                }
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.website.create AS create_var12
                    CREATE (create_this13:Website)
                    SET
                        create_this13.address = create_var12.node.address
                    MERGE (create_this1)-[create_this14:HAS_WEBSITE]->(create_this13)
                    RETURN collect(NULL) AS create_var15
                }
                WITH create_this1
                CALL {
                    WITH create_this1
                    MATCH (create_this1)-[create_this16:HAS_WEBSITE]->(:Website)
                    WITH count(create_this16) AS c
                    WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one\\", [0])
                    RETURN c AS create_var17
                }
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"edge\\": {
                                        \\"year\\": {
                                            \\"low\\": 2022,
                                            \\"high\\": 0
                                        }
                                    },
                                    \\"node\\": {
                                        \\"name\\": \\"actor 1\\",
                                        \\"website\\": {
                                            \\"create\\": {
                                                \\"node\\": {
                                                    \\"address\\": \\"Actor1.com\\"
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        \\"id\\": \\"2\\",
                        \\"website\\": {
                            \\"create\\": {
                                \\"node\\": {
                                    \\"address\\": \\"The Matrix2.com\\"
                                }
                            }
                        }
                    }
                ]
            }"
        `);
    });

    test("nested batch", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        { id: "1", actors: { create: [{ node: { name: "actor 1" }, edge: { year: 2022 } }] } }
                        { id: "2", actors: { create: [{ node: { name: "actor 1" }, edge: { year: 2022 } }] } }
                    ]
                ) {
                    movies {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.createdAt = datetime(),
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.id = randomUUID(),
                        create_this3.createdAt = datetime(),
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    SET
                        create_this4.year = create_var2.edge.year
                    WITH create_this3
                    CALL {
                        WITH create_this3
                        MATCH (create_this3)-[create_this5:HAS_WEBSITE]->(:Website)
                        WITH count(create_this5) AS c
                        WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one\\", [0])
                        RETURN c AS create_var6
                    }
                    RETURN collect(NULL) AS create_var7
                }
                WITH create_this1
                CALL {
                    WITH create_this1
                    MATCH (create_this1)-[create_this8:HAS_WEBSITE]->(:Website)
                    WITH count(create_this8) AS c
                    WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one\\", [0])
                    RETURN c AS create_var9
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this10:ACTED_IN]-(create_this11:Actor)
                WITH create_this11 { .name } AS create_this11
                RETURN collect(create_this11) AS create_var12
            }
            RETURN collect(create_this1 { .id, actors: create_var12 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"edge\\": {
                                        \\"year\\": {
                                            \\"low\\": 2022,
                                            \\"high\\": 0
                                        }
                                    },
                                    \\"node\\": {
                                        \\"name\\": \\"actor 1\\"
                                    }
                                }
                            ]
                        }
                    },
                    {
                        \\"id\\": \\"2\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"edge\\": {
                                        \\"year\\": {
                                            \\"low\\": 2022,
                                            \\"high\\": 0
                                        }
                                    },
                                    \\"node\\": {
                                        \\"name\\": \\"actor 1\\"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }"
        `);
    });

    test("heterogeneous batch", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        { id: "1", actors: { create: [{ node: { name: "actor 1" }, edge: { year: 2022 } }] } }
                        { id: "2", actors: { create: [{ node: { name: "actor 2" }, edge: { year: 1999 } }] } }
                        { id: "3", website: { create: { node: { address: "mywebsite.com" } } } }
                        { id: "4", actors: { connect: { where: { node: { id: "2" } } } } }
                        {
                            id: "5"
                            actors: {
                                connectOrCreate: {
                                    where: { node: { id: "2" } }
                                    onCreate: { node: { name: "actor 2" } }
                                }
                            }
                        }
                    ]
                ) {
                    movies {
                        id
                        website {
                            address
                        }
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Movie)
            SET this0.createdAt = datetime()
            SET this0.id = $this0_id
            WITH *
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.createdAt = datetime()
            SET this0_actors0_node.id = randomUUID()
            SET this0_actors0_node.name = $this0_actors0_node_name
            MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)
            SET this0_actors0_relationship.year = $this0_actors0_relationship_year
            WITH *
            CALL {
            	WITH this0_actors0_node
            	MATCH (this0_actors0_node)-[this0_actors0_node_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this0_actors0_node_website_Website_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
            	RETURN c AS this0_actors0_node_website_Website_unique_ignored
            }
            WITH *
            CALL {
            	WITH this0
            	MATCH (this0)-[this0_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this0_website_Website_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS this0_website_Website_unique_ignored
            }
            RETURN this0
            }
            CALL {
            CREATE (this1:Movie)
            SET this1.createdAt = datetime()
            SET this1.id = $this1_id
            WITH *
            CREATE (this1_actors0_node:Actor)
            SET this1_actors0_node.createdAt = datetime()
            SET this1_actors0_node.id = randomUUID()
            SET this1_actors0_node.name = $this1_actors0_node_name
            MERGE (this1)<-[this1_actors0_relationship:ACTED_IN]-(this1_actors0_node)
            SET this1_actors0_relationship.year = $this1_actors0_relationship_year
            WITH *
            CALL {
            	WITH this1_actors0_node
            	MATCH (this1_actors0_node)-[this1_actors0_node_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this1_actors0_node_website_Website_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
            	RETURN c AS this1_actors0_node_website_Website_unique_ignored
            }
            WITH *
            CALL {
            	WITH this1
            	MATCH (this1)-[this1_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this1_website_Website_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS this1_website_Website_unique_ignored
            }
            RETURN this1
            }
            CALL {
            CREATE (this2:Movie)
            SET this2.createdAt = datetime()
            SET this2.id = $this2_id
            WITH *
            CREATE (this2_website0_node:Website)
            SET this2_website0_node.address = $this2_website0_node_address
            MERGE (this2)-[:HAS_WEBSITE]->(this2_website0_node)
            WITH *
            CALL {
            	WITH this2
            	MATCH (this2)-[this2_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this2_website_Website_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS this2_website_Website_unique_ignored
            }
            RETURN this2
            }
            CALL {
            CREATE (this3:Movie)
            SET this3.createdAt = datetime()
            SET this3.id = $this3_id
            WITH *
            CALL {
            	WITH this3
            	OPTIONAL MATCH (this3_actors_connect0_node:Actor)
            	WHERE this3_actors_connect0_node.id = $this3_actors_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this3_actors_connect0_node) as connectedNodes, collect(this3) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this3
            			UNWIND connectedNodes as this3_actors_connect0_node
            			MERGE (this3)<-[this3_actors_connect0_relationship:ACTED_IN]-(this3_actors_connect0_node)
            		}
            	}
            WITH this3, this3_actors_connect0_node
            	RETURN count(*) AS connect_this3_actors_connect_Actor0
            }
            WITH *
            CALL {
            	WITH this3
            	MATCH (this3)-[this3_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this3_website_Website_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS this3_website_Website_unique_ignored
            }
            RETURN this3
            }
            CALL {
            CREATE (this4:Movie)
            SET this4.createdAt = datetime()
            SET this4.id = $this4_id
            WITH this4
            CALL {
                WITH this4
                MERGE (this4_actors_connectOrCreate0:Actor { id: $this4_actors_connectOrCreate_param0 })
                ON CREATE SET
                    this4_actors_connectOrCreate0.createdAt = datetime(),
                    this4_actors_connectOrCreate0.name = $this4_actors_connectOrCreate_param1
                MERGE (this4)<-[this4_actors_connectOrCreate_this0:ACTED_IN]-(this4_actors_connectOrCreate0)
                RETURN count(*) AS _
            }
            WITH *
            CALL {
            	WITH this4
            	MATCH (this4)-[this4_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this4_website_Website_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS this4_website_Website_unique_ignored
            }
            RETURN this4
            }
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)-[create_this0:HAS_WEBSITE]->(create_this1:Website)
                    WITH create_this1 { .address } AS create_this1
                    RETURN head(collect(create_this1)) AS create_var2
                }
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this3:ACTED_IN]-(create_this4:Actor)
                    WITH create_this4 { .name } AS create_this4
                    RETURN collect(create_this4) AS create_var5
                }
                RETURN this0 { .id, website: create_var2, actors: create_var5 } AS create_var6
            }
            CALL {
                WITH this1
                CALL {
                    WITH this1
                    MATCH (this1)-[create_this7:HAS_WEBSITE]->(create_this8:Website)
                    WITH create_this8 { .address } AS create_this8
                    RETURN head(collect(create_this8)) AS create_var9
                }
                CALL {
                    WITH this1
                    MATCH (this1)<-[create_this10:ACTED_IN]-(create_this11:Actor)
                    WITH create_this11 { .name } AS create_this11
                    RETURN collect(create_this11) AS create_var12
                }
                RETURN this1 { .id, website: create_var9, actors: create_var12 } AS create_var13
            }
            CALL {
                WITH this2
                CALL {
                    WITH this2
                    MATCH (this2)-[create_this14:HAS_WEBSITE]->(create_this15:Website)
                    WITH create_this15 { .address } AS create_this15
                    RETURN head(collect(create_this15)) AS create_var16
                }
                CALL {
                    WITH this2
                    MATCH (this2)<-[create_this17:ACTED_IN]-(create_this18:Actor)
                    WITH create_this18 { .name } AS create_this18
                    RETURN collect(create_this18) AS create_var19
                }
                RETURN this2 { .id, website: create_var16, actors: create_var19 } AS create_var20
            }
            CALL {
                WITH this3
                CALL {
                    WITH this3
                    MATCH (this3)-[create_this21:HAS_WEBSITE]->(create_this22:Website)
                    WITH create_this22 { .address } AS create_this22
                    RETURN head(collect(create_this22)) AS create_var23
                }
                CALL {
                    WITH this3
                    MATCH (this3)<-[create_this24:ACTED_IN]-(create_this25:Actor)
                    WITH create_this25 { .name } AS create_this25
                    RETURN collect(create_this25) AS create_var26
                }
                RETURN this3 { .id, website: create_var23, actors: create_var26 } AS create_var27
            }
            CALL {
                WITH this4
                CALL {
                    WITH this4
                    MATCH (this4)-[create_this28:HAS_WEBSITE]->(create_this29:Website)
                    WITH create_this29 { .address } AS create_this29
                    RETURN head(collect(create_this29)) AS create_var30
                }
                CALL {
                    WITH this4
                    MATCH (this4)<-[create_this31:ACTED_IN]-(create_this32:Actor)
                    WITH create_this32 { .name } AS create_this32
                    RETURN collect(create_this32) AS create_var33
                }
                RETURN this4 { .id, website: create_var30, actors: create_var33 } AS create_var34
            }
            RETURN [create_var6, create_var13, create_var20, create_var27, create_var34] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_actors0_node_name\\": \\"actor 1\\",
                \\"this0_actors0_relationship_year\\": {
                    \\"low\\": 2022,
                    \\"high\\": 0
                },
                \\"this1_id\\": \\"2\\",
                \\"this1_actors0_node_name\\": \\"actor 2\\",
                \\"this1_actors0_relationship_year\\": {
                    \\"low\\": 1999,
                    \\"high\\": 0
                },
                \\"this2_id\\": \\"3\\",
                \\"this2_website0_node_address\\": \\"mywebsite.com\\",
                \\"this3_id\\": \\"4\\",
                \\"this3_actors_connect0_node_param0\\": \\"2\\",
                \\"this4_id\\": \\"5\\",
                \\"this4_actors_connectOrCreate_param0\\": \\"2\\",
                \\"this4_actors_connectOrCreate_param1\\": \\"actor 2\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
