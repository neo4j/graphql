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

describe("Batch Create", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                id: ID! @id
                name: String
                website: [Website!]! @relationship(type: "HAS_WEBSITE", direction: OUT)
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Movie @node {
                id: ID
                website: [Website!]! @relationship(type: "HAS_WEBSITE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Website @node {
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
                createMovies(input: [{ id: "1" }, { id: "2" }]) {
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
                    create_this1.id = create_var0.id
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\"
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
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.id = randomUUID(),
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
                    RETURN collect(NULL) AS create_var9
                }
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.website.create AS create_var10
                    CREATE (create_this11:Website)
                    SET
                        create_this11.address = create_var10.node.address
                    MERGE (create_this1)-[create_this12:HAS_WEBSITE]->(create_this11)
                    RETURN collect(NULL) AS create_var13
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
                                            \\"create\\": [
                                                {
                                                    \\"node\\": {
                                                        \\"address\\": \\"Actor1.com\\"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    {
                        \\"id\\": \\"2\\",
                        \\"website\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"address\\": \\"The Matrix2.com\\"
                                    }
                                }
                            ]
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
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Actor)
                    SET
                        create_this3.id = randomUUID(),
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    SET
                        create_this4.year = create_var2.edge.year
                    RETURN collect(NULL) AS create_var5
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this6:ACTED_IN]-(create_this7:Actor)
                WITH create_this7 { .name } AS create_this7
                RETURN collect(create_this7) AS create_var8
            }
            RETURN collect(create_this1 { .id, actors: create_var8 }) AS data"
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

    test("connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        { id: "1", actors: { connect: { where: { node: { id_EQ: "3" } } } } }
                        { id: "2", actors: { connect: { where: { node: { id_EQ: "4" } } } } }
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
            "CALL {
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_actors_connect0_node:Actor)
            	WHERE this0_actors_connect0_node.id = $this0_actors_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_actors_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_actors_connect0_node
            			MERGE (this0)<-[this0_actors_connect0_relationship:ACTED_IN]-(this0_actors_connect0_node)
            		}
            	}
            WITH this0, this0_actors_connect0_node
            	RETURN count(*) AS connect_this0_actors_connect_Actor0
            }
            RETURN this0
            }
            CALL {
            CREATE (this1:Movie)
            SET this1.id = $this1_id
            WITH *
            CALL {
            	WITH this1
            	OPTIONAL MATCH (this1_actors_connect0_node:Actor)
            	WHERE this1_actors_connect0_node.id = $this1_actors_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this1_actors_connect0_node) as connectedNodes, collect(this1) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this1
            			UNWIND connectedNodes as this1_actors_connect0_node
            			MERGE (this1)<-[this1_actors_connect0_relationship:ACTED_IN]-(this1_actors_connect0_node)
            		}
            	}
            WITH this1, this1_actors_connect0_node
            	RETURN count(*) AS connect_this1_actors_connect_Actor0
            }
            RETURN this1
            }
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this0:ACTED_IN]-(create_this1:Actor)
                    WITH create_this1 { .name } AS create_this1
                    RETURN collect(create_this1) AS create_var2
                }
                RETURN this0 { .id, actors: create_var2 } AS create_var3
            }
            CALL {
                WITH this1
                CALL {
                    WITH this1
                    MATCH (this1)<-[create_this4:ACTED_IN]-(create_this5:Actor)
                    WITH create_this5 { .name } AS create_this5
                    RETURN collect(create_this5) AS create_var6
                }
                RETURN this1 { .id, actors: create_var6 } AS create_var7
            }
            RETURN [create_var3, create_var7] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_actors_connect0_node_param0\\": \\"3\\",
                \\"this1_id\\": \\"2\\",
                \\"this1_actors_connect0_node_param0\\": \\"4\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
