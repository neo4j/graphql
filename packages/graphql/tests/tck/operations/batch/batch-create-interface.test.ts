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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Batch Create, Interface", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
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

            interface ActedIn @relationshipProperties {
                year: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("no nested batch", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ id: "1" }, { id: "2" }]) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "1" });

        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var1
            CALL {
                WITH create_var1
                CREATE (create_this0:\`Movie\`)
                SET
                    create_this0.id = create_var1.id
                WITH create_this0
                CALL {
                	WITH create_this0
                	MATCH (create_this0)-[create_this0_website_Website_unique:HAS_WEBSITE]->(:Website)
                	WITH count(create_this0_website_Website_unique) as c
                	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
                	RETURN c AS create_this0_website_Website_unique_ignored
                }
                RETURN create_this0
            }
            RETURN collect(create_this0 { .id }) AS data"
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
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("nested batch", async () => {
        const query = gql`
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

        const req = createJwtRequest("secret", { sub: "1" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            WITH this0
            CREATE (this0_workersActor0_node:Actor)
            SET this0_workersActor0_node.id = $this0_workersActor0_node_id
            SET this0_workersActor0_node.name = $this0_workersActor0_node_name
            MERGE (this0)<-[this0_workersActor0_relationship:EMPLOYED]-(this0_workersActor0_node)
            SET this0_workersActor0_relationship.year = $this0_workersActor0_relationship_year
            WITH this0, this0_workersActor0_node
            CALL {
            	WITH this0_workersActor0_node
            	MATCH (this0_workersActor0_node)-[this0_workersActor0_node_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this0_workersActor0_node_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
            	RETURN c AS this0_workersActor0_node_website_Website_unique_ignored
            }
            WITH this0
            CALL {
            	WITH this0
            	MATCH (this0)-[this0_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this0_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS this0_website_Website_unique_ignored
            }
            RETURN this0
            }
            CALL {
            CREATE (this1:Movie)
            SET this1.id = $this1_id
            WITH this1
            CREATE (this1_workersModeler0_node:Modeler)
            SET this1_workersModeler0_node.id = $this1_workersModeler0_node_id
            SET this1_workersModeler0_node.name = $this1_workersModeler0_node_name
            MERGE (this1)<-[this1_workersModeler0_relationship:EMPLOYED]-(this1_workersModeler0_node)
            SET this1_workersModeler0_relationship.year = $this1_workersModeler0_relationship_year
            WITH this1, this1_workersModeler0_node
            CALL {
            	WITH this1_workersModeler0_node
            	MATCH (this1_workersModeler0_node)-[this1_workersModeler0_node_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this1_workersModeler0_node_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDModeler.website must be less than or equal to one', [0])
            	RETURN c AS this1_workersModeler0_node_website_Website_unique_ignored
            }
            WITH this1
            CALL {
            	WITH this1
            	MATCH (this1)-[this1_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this1_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS this1_website_Website_unique_ignored
            }
            RETURN this1
            }
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)<-[create_this0:EMPLOYED]-(this0_workers:\`Actor\`)
                    WITH this0_workers { __resolveType: \\"Actor\\", __id: id(this0), .name } AS this0_workers
                    RETURN this0_workers AS this0_workers
                    UNION
                    WITH *
                    MATCH (this0)<-[create_this1:EMPLOYED]-(this0_workers:\`Modeler\`)
                    WITH this0_workers { __resolveType: \\"Modeler\\", __id: id(this0), .name } AS this0_workers
                    RETURN this0_workers AS this0_workers
                }
                WITH this0_workers
                RETURN collect(this0_workers) AS this0_workers
            }
            CALL {
                WITH this1
                CALL {
                    WITH *
                    MATCH (this1)<-[create_this0:EMPLOYED]-(this1_workers:\`Actor\`)
                    WITH this1_workers { __resolveType: \\"Actor\\", __id: id(this1), .name } AS this1_workers
                    RETURN this1_workers AS this1_workers
                    UNION
                    WITH *
                    MATCH (this1)<-[create_this1:EMPLOYED]-(this1_workers:\`Modeler\`)
                    WITH this1_workers { __resolveType: \\"Modeler\\", __id: id(this1), .name } AS this1_workers
                    RETURN this1_workers AS this1_workers
                }
                WITH this1_workers
                RETURN collect(this1_workers) AS this1_workers
            }
            RETURN [
            this0 { .id, workers: this0_workers },
            this1 { .id, workers: this1_workers }] AS data"
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
        const query = gql`
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

        const req = createJwtRequest("secret", { sub: "1" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            WITH this0
            CREATE (this0_workersActor0_node:Actor)
            SET this0_workersActor0_node.id = $this0_workersActor0_node_id
            SET this0_workersActor0_node.name = $this0_workersActor0_node_name
            MERGE (this0)<-[this0_workersActor0_relationship:EMPLOYED]-(this0_workersActor0_node)
            SET this0_workersActor0_relationship.year = $this0_workersActor0_relationship_year
            WITH this0, this0_workersActor0_node
            CALL {
            	WITH this0_workersActor0_node
            	MATCH (this0_workersActor0_node)-[this0_workersActor0_node_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this0_workersActor0_node_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
            	RETURN c AS this0_workersActor0_node_website_Website_unique_ignored
            }
            WITH this0
            CALL {
            	WITH this0
            	MATCH (this0)-[this0_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this0_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS this0_website_Website_unique_ignored
            }
            RETURN this0
            }
            CALL {
            CREATE (this1:Movie)
            SET this1.id = $this1_id
            WITH this1
            CREATE (this1_workersActor0_node:Actor)
            SET this1_workersActor0_node.id = $this1_workersActor0_node_id
            SET this1_workersActor0_node.name = $this1_workersActor0_node_name
            MERGE (this1)<-[this1_workersActor0_relationship:EMPLOYED]-(this1_workersActor0_node)
            SET this1_workersActor0_relationship.year = $this1_workersActor0_relationship_year
            WITH this1, this1_workersActor0_node
            CALL {
            	WITH this1_workersActor0_node
            	MATCH (this1_workersActor0_node)-[this1_workersActor0_node_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this1_workersActor0_node_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
            	RETURN c AS this1_workersActor0_node_website_Website_unique_ignored
            }
            WITH this1
            CALL {
            	WITH this1
            	MATCH (this1)-[this1_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this1_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS this1_website_Website_unique_ignored
            }
            RETURN this1
            }
            CALL {
            CREATE (this2:Movie)
            SET this2.id = $this2_id
            WITH this2
            CREATE (this2_website0_node:Website)
            SET this2_website0_node.address = $this2_website0_node_address
            MERGE (this2)-[:HAS_WEBSITE]->(this2_website0_node)
            WITH this2
            CALL {
            	WITH this2
            	MATCH (this2)-[this2_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this2_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS this2_website_Website_unique_ignored
            }
            RETURN this2
            }
            CALL {
            CREATE (this3:Movie)
            SET this3.id = $this3_id
            WITH this3
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
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this3, this3_workers_connect0_node
            	RETURN count(*) AS connect_this3_workers_connect_Actor
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
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this3, this3_workers_connect1_node
            	RETURN count(*) AS connect_this3_workers_connect_Modeler
            }
            WITH this3
            CALL {
            	WITH this3
            	MATCH (this3)-[this3_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this3_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS this3_website_Website_unique_ignored
            }
            RETURN this3
            }
            CALL {
                WITH this0
                MATCH (this0)-[create_this0:HAS_WEBSITE]->(this0_website:\`Website\`)
                WITH this0_website { .address } AS this0_website
                RETURN head(collect(this0_website)) AS this0_website
            }
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)<-[create_this1:EMPLOYED]-(this0_workers:\`Actor\`)
                    WITH this0_workers { __resolveType: \\"Actor\\", __id: id(this0), .name } AS this0_workers
                    RETURN this0_workers AS this0_workers
                    UNION
                    WITH *
                    MATCH (this0)<-[create_this2:EMPLOYED]-(this0_workers:\`Modeler\`)
                    WITH this0_workers { __resolveType: \\"Modeler\\", __id: id(this0), .name } AS this0_workers
                    RETURN this0_workers AS this0_workers
                }
                WITH this0_workers
                RETURN collect(this0_workers) AS this0_workers
            }
            CALL {
                WITH this1
                MATCH (this1)-[create_this0:HAS_WEBSITE]->(this1_website:\`Website\`)
                WITH this1_website { .address } AS this1_website
                RETURN head(collect(this1_website)) AS this1_website
            }
            CALL {
                WITH this1
                CALL {
                    WITH *
                    MATCH (this1)<-[create_this1:EMPLOYED]-(this1_workers:\`Actor\`)
                    WITH this1_workers { __resolveType: \\"Actor\\", __id: id(this1), .name } AS this1_workers
                    RETURN this1_workers AS this1_workers
                    UNION
                    WITH *
                    MATCH (this1)<-[create_this2:EMPLOYED]-(this1_workers:\`Modeler\`)
                    WITH this1_workers { __resolveType: \\"Modeler\\", __id: id(this1), .name } AS this1_workers
                    RETURN this1_workers AS this1_workers
                }
                WITH this1_workers
                RETURN collect(this1_workers) AS this1_workers
            }
            CALL {
                WITH this2
                MATCH (this2)-[create_this0:HAS_WEBSITE]->(this2_website:\`Website\`)
                WITH this2_website { .address } AS this2_website
                RETURN head(collect(this2_website)) AS this2_website
            }
            CALL {
                WITH this2
                CALL {
                    WITH *
                    MATCH (this2)<-[create_this1:EMPLOYED]-(this2_workers:\`Actor\`)
                    WITH this2_workers { __resolveType: \\"Actor\\", __id: id(this2), .name } AS this2_workers
                    RETURN this2_workers AS this2_workers
                    UNION
                    WITH *
                    MATCH (this2)<-[create_this2:EMPLOYED]-(this2_workers:\`Modeler\`)
                    WITH this2_workers { __resolveType: \\"Modeler\\", __id: id(this2), .name } AS this2_workers
                    RETURN this2_workers AS this2_workers
                }
                WITH this2_workers
                RETURN collect(this2_workers) AS this2_workers
            }
            CALL {
                WITH this3
                MATCH (this3)-[create_this0:HAS_WEBSITE]->(this3_website:\`Website\`)
                WITH this3_website { .address } AS this3_website
                RETURN head(collect(this3_website)) AS this3_website
            }
            CALL {
                WITH this3
                CALL {
                    WITH *
                    MATCH (this3)<-[create_this1:EMPLOYED]-(this3_workers:\`Actor\`)
                    WITH this3_workers { __resolveType: \\"Actor\\", __id: id(this3), .name } AS this3_workers
                    RETURN this3_workers AS this3_workers
                    UNION
                    WITH *
                    MATCH (this3)<-[create_this2:EMPLOYED]-(this3_workers:\`Modeler\`)
                    WITH this3_workers { __resolveType: \\"Modeler\\", __id: id(this3), .name } AS this3_workers
                    RETURN this3_workers AS this3_workers
                }
                WITH this3_workers
                RETURN collect(this3_workers) AS this3_workers
            }
            RETURN [
            this0 { .id, website: this0_website, workers: this0_workers },
            this1 { .id, website: this1_website, workers: this1_workers },
            this2 { .id, website: this2_website, workers: this2_workers },
            this3 { .id, website: this3_website, workers: this3_workers }] AS data"
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
