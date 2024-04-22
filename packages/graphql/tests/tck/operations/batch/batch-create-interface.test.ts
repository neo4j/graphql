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

describe("Batch Create, Interface", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Person {
                id: ID!
                name: String
            }

            type Actor implements Person {
                id: ID!
                name: String
                website: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
                movies: [Movie!]! @relationship(type: "EMPLOYED", direction: OUT, properties: "ActedIn")
            }

            type Modeler implements Person {
                id: ID!
                name: String
                website: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
                movies: [Movie!]! @relationship(type: "EMPLOYED", direction: OUT, properties: "ActedIn")
            }

            type Movie {
                id: ID
                website: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
                workers: [Person!]! @relationship(type: "EMPLOYED", direction: IN, properties: "ActedIn")
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
                        \\"id\\": \\"1\\"
                    },
                    {
                        \\"id\\": \\"2\\"
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
                        {
                            id: "1"
                            workers: {
                                create: [{ node: { Actor: { id: "1", name: "actor 1" } }, edge: { year: 2022 } }]
                            }
                        }
                        {
                            id: "2"
                            workers: {
                                create: [{ node: { Modeler: { id: "2", name: "modeler 1" } }, edge: { year: 2022 } }]
                            }
                        }
                    ]
                ) {
                    movies {
                        id
                        workers {
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
            CREATE (this0_workersActor0_node:Actor)
            SET this0_workersActor0_node.id = $this0_workersActor0_node_id
            SET this0_workersActor0_node.name = $this0_workersActor0_node_name
            MERGE (this0)<-[this0_workersActor0_relationship:EMPLOYED]-(this0_workersActor0_node)
            SET this0_workersActor0_relationship.year = $this0_workersActor0_relationship_year
            WITH *
            CALL {
            	WITH this0_workersActor0_node
            	MATCH (this0_workersActor0_node)-[this0_workersActor0_node_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this0_workersActor0_node_website_Website_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
            	RETURN c AS this0_workersActor0_node_website_Website_unique_ignored
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
            SET this1.id = $this1_id
            WITH *
            CREATE (this1_workersModeler0_node:Modeler)
            SET this1_workersModeler0_node.id = $this1_workersModeler0_node_id
            SET this1_workersModeler0_node.name = $this1_workersModeler0_node_name
            MERGE (this1)<-[this1_workersModeler0_relationship:EMPLOYED]-(this1_workersModeler0_node)
            SET this1_workersModeler0_relationship.year = $this1_workersModeler0_relationship_year
            WITH *
            CALL {
            	WITH this1_workersModeler0_node
            	MATCH (this1_workersModeler0_node)-[this1_workersModeler0_node_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this1_workersModeler0_node_website_Website_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDModeler.website must be less than or equal to one', [0])
            	RETURN c AS this1_workersModeler0_node_website_Website_unique_ignored
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
                WITH this0
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)<-[create_this0:EMPLOYED]-(create_this1:Actor)
                        WITH create_this1 { .name, __resolveType: \\"Actor\\", __id: id(create_this1) } AS create_this1
                        RETURN create_this1 AS create_var2
                        UNION
                        WITH *
                        MATCH (this0)<-[create_this3:EMPLOYED]-(create_this4:Modeler)
                        WITH create_this4 { .name, __resolveType: \\"Modeler\\", __id: id(create_this4) } AS create_this4
                        RETURN create_this4 AS create_var2
                    }
                    WITH create_var2
                    RETURN collect(create_var2) AS create_var2
                }
                RETURN this0 { .id, workers: create_var2 } AS create_var5
            }
            CALL {
                WITH this1
                CALL {
                    WITH this1
                    CALL {
                        WITH *
                        MATCH (this1)<-[create_this6:EMPLOYED]-(create_this7:Actor)
                        WITH create_this7 { .name, __resolveType: \\"Actor\\", __id: id(create_this7) } AS create_this7
                        RETURN create_this7 AS create_var8
                        UNION
                        WITH *
                        MATCH (this1)<-[create_this9:EMPLOYED]-(create_this10:Modeler)
                        WITH create_this10 { .name, __resolveType: \\"Modeler\\", __id: id(create_this10) } AS create_this10
                        RETURN create_this10 AS create_var8
                    }
                    WITH create_var8
                    RETURN collect(create_var8) AS create_var8
                }
                RETURN this1 { .id, workers: create_var8 } AS create_var11
            }
            RETURN [create_var5, create_var11] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_workersActor0_node_id\\": \\"1\\",
                \\"this0_workersActor0_node_name\\": \\"actor 1\\",
                \\"this0_workersActor0_relationship_year\\": {
                    \\"low\\": 2022,
                    \\"high\\": 0
                },
                \\"this1_id\\": \\"2\\",
                \\"this1_workersModeler0_node_id\\": \\"2\\",
                \\"this1_workersModeler0_node_name\\": \\"modeler 1\\",
                \\"this1_workersModeler0_relationship_year\\": {
                    \\"low\\": 2022,
                    \\"high\\": 0
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("heterogeneous batch", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            id: "1"
                            workers: {
                                create: [{ node: { Actor: { id: "1", name: "actor 1" } }, edge: { year: 2022 } }]
                            }
                        }
                        {
                            id: "2"
                            workers: {
                                create: [{ node: { Actor: { id: "2", name: "actor 2" } }, edge: { year: 2022 } }]
                            }
                        }
                        { id: "3", website: { create: { node: { address: "mywebsite.com" } } } }
                        { id: "4", workers: { connect: { where: { node: { id: "2" } } } } }
                    ]
                ) {
                    movies {
                        id
                        website {
                            address
                        }
                        workers {
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
            CREATE (this0_workersActor0_node:Actor)
            SET this0_workersActor0_node.id = $this0_workersActor0_node_id
            SET this0_workersActor0_node.name = $this0_workersActor0_node_name
            MERGE (this0)<-[this0_workersActor0_relationship:EMPLOYED]-(this0_workersActor0_node)
            SET this0_workersActor0_relationship.year = $this0_workersActor0_relationship_year
            WITH *
            CALL {
            	WITH this0_workersActor0_node
            	MATCH (this0_workersActor0_node)-[this0_workersActor0_node_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this0_workersActor0_node_website_Website_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
            	RETURN c AS this0_workersActor0_node_website_Website_unique_ignored
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
            SET this1.id = $this1_id
            WITH *
            CREATE (this1_workersActor0_node:Actor)
            SET this1_workersActor0_node.id = $this1_workersActor0_node_id
            SET this1_workersActor0_node.name = $this1_workersActor0_node_name
            MERGE (this1)<-[this1_workersActor0_relationship:EMPLOYED]-(this1_workersActor0_node)
            SET this1_workersActor0_relationship.year = $this1_workersActor0_relationship_year
            WITH *
            CALL {
            	WITH this1_workersActor0_node
            	MATCH (this1_workersActor0_node)-[this1_workersActor0_node_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this1_workersActor0_node_website_Website_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
            	RETURN c AS this1_workersActor0_node_website_Website_unique_ignored
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
            SET this3.id = $this3_id
            WITH *
            CALL {
            	WITH this3
            	OPTIONAL MATCH (this3_workers_connect0_node:Actor)
            	WHERE this3_workers_connect0_node.id = $this3_workers_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this3_workers_connect0_node) as connectedNodes, collect(this3) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this3
            			UNWIND connectedNodes as this3_workers_connect0_node
            			MERGE (this3)<-[this3_workers_connect0_relationship:EMPLOYED]-(this3_workers_connect0_node)
            		}
            	}
            WITH this3, this3_workers_connect0_node
            	RETURN count(*) AS connect_this3_workers_connect_Actor0
            }
            CALL {
            		WITH this3
            	OPTIONAL MATCH (this3_workers_connect1_node:Modeler)
            	WHERE this3_workers_connect1_node.id = $this3_workers_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this3_workers_connect1_node) as connectedNodes, collect(this3) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this3
            			UNWIND connectedNodes as this3_workers_connect1_node
            			MERGE (this3)<-[this3_workers_connect1_relationship:EMPLOYED]-(this3_workers_connect1_node)
            		}
            	}
            WITH this3, this3_workers_connect1_node
            	RETURN count(*) AS connect_this3_workers_connect_Modeler1
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
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)-[create_this0:HAS_WEBSITE]->(create_this1:Website)
                    WITH create_this1 { .address } AS create_this1
                    RETURN head(collect(create_this1)) AS create_var2
                }
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)<-[create_this3:EMPLOYED]-(create_this4:Actor)
                        WITH create_this4 { .name, __resolveType: \\"Actor\\", __id: id(create_this4) } AS create_this4
                        RETURN create_this4 AS create_var5
                        UNION
                        WITH *
                        MATCH (this0)<-[create_this6:EMPLOYED]-(create_this7:Modeler)
                        WITH create_this7 { .name, __resolveType: \\"Modeler\\", __id: id(create_this7) } AS create_this7
                        RETURN create_this7 AS create_var5
                    }
                    WITH create_var5
                    RETURN collect(create_var5) AS create_var5
                }
                RETURN this0 { .id, website: create_var2, workers: create_var5 } AS create_var8
            }
            CALL {
                WITH this1
                CALL {
                    WITH this1
                    MATCH (this1)-[create_this9:HAS_WEBSITE]->(create_this10:Website)
                    WITH create_this10 { .address } AS create_this10
                    RETURN head(collect(create_this10)) AS create_var11
                }
                CALL {
                    WITH this1
                    CALL {
                        WITH *
                        MATCH (this1)<-[create_this12:EMPLOYED]-(create_this13:Actor)
                        WITH create_this13 { .name, __resolveType: \\"Actor\\", __id: id(create_this13) } AS create_this13
                        RETURN create_this13 AS create_var14
                        UNION
                        WITH *
                        MATCH (this1)<-[create_this15:EMPLOYED]-(create_this16:Modeler)
                        WITH create_this16 { .name, __resolveType: \\"Modeler\\", __id: id(create_this16) } AS create_this16
                        RETURN create_this16 AS create_var14
                    }
                    WITH create_var14
                    RETURN collect(create_var14) AS create_var14
                }
                RETURN this1 { .id, website: create_var11, workers: create_var14 } AS create_var17
            }
            CALL {
                WITH this2
                CALL {
                    WITH this2
                    MATCH (this2)-[create_this18:HAS_WEBSITE]->(create_this19:Website)
                    WITH create_this19 { .address } AS create_this19
                    RETURN head(collect(create_this19)) AS create_var20
                }
                CALL {
                    WITH this2
                    CALL {
                        WITH *
                        MATCH (this2)<-[create_this21:EMPLOYED]-(create_this22:Actor)
                        WITH create_this22 { .name, __resolveType: \\"Actor\\", __id: id(create_this22) } AS create_this22
                        RETURN create_this22 AS create_var23
                        UNION
                        WITH *
                        MATCH (this2)<-[create_this24:EMPLOYED]-(create_this25:Modeler)
                        WITH create_this25 { .name, __resolveType: \\"Modeler\\", __id: id(create_this25) } AS create_this25
                        RETURN create_this25 AS create_var23
                    }
                    WITH create_var23
                    RETURN collect(create_var23) AS create_var23
                }
                RETURN this2 { .id, website: create_var20, workers: create_var23 } AS create_var26
            }
            CALL {
                WITH this3
                CALL {
                    WITH this3
                    MATCH (this3)-[create_this27:HAS_WEBSITE]->(create_this28:Website)
                    WITH create_this28 { .address } AS create_this28
                    RETURN head(collect(create_this28)) AS create_var29
                }
                CALL {
                    WITH this3
                    CALL {
                        WITH *
                        MATCH (this3)<-[create_this30:EMPLOYED]-(create_this31:Actor)
                        WITH create_this31 { .name, __resolveType: \\"Actor\\", __id: id(create_this31) } AS create_this31
                        RETURN create_this31 AS create_var32
                        UNION
                        WITH *
                        MATCH (this3)<-[create_this33:EMPLOYED]-(create_this34:Modeler)
                        WITH create_this34 { .name, __resolveType: \\"Modeler\\", __id: id(create_this34) } AS create_this34
                        RETURN create_this34 AS create_var32
                    }
                    WITH create_var32
                    RETURN collect(create_var32) AS create_var32
                }
                RETURN this3 { .id, website: create_var29, workers: create_var32 } AS create_var35
            }
            RETURN [create_var8, create_var17, create_var26, create_var35] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_workersActor0_node_id\\": \\"1\\",
                \\"this0_workersActor0_node_name\\": \\"actor 1\\",
                \\"this0_workersActor0_relationship_year\\": {
                    \\"low\\": 2022,
                    \\"high\\": 0
                },
                \\"this1_id\\": \\"2\\",
                \\"this1_workersActor0_node_id\\": \\"2\\",
                \\"this1_workersActor0_node_name\\": \\"actor 2\\",
                \\"this1_workersActor0_relationship_year\\": {
                    \\"low\\": 2022,
                    \\"high\\": 0
                },
                \\"this2_id\\": \\"3\\",
                \\"this2_website0_node_address\\": \\"mywebsite.com\\",
                \\"this3_id\\": \\"4\\",
                \\"this3_workers_connect0_node_param0\\": \\"2\\",
                \\"this3_workers_connect1_node_param0\\": \\"2\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
