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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Batch Create, Auth", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor @auth(rules: [{ allow: { id: "$jwt.sub" } }]) {
                id: ID! @id
                name: String
                website: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Movie @auth(rules: [{ operations: [CREATE, UPDATE], roles: ["admin"] }]) {
                id: ID
                website: Website @relationship(type: "HAS_WEBSITE", direction: OUT)
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Website {
                address: String
            }

            interface ActedIn @relationshipProperties {
                year: Int
            }
        `;
        const secret = "secret";

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
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
                WITH *
                CALL apoc.util.validate(NOT (any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                \\"resolvedCallbacks\\": {},
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": [],
                        \\"sub\\": \\"1\\"
                    }
                }
            }"
        `);
    });

    test("nested batch", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        { id: "1", actors: { create: [{ node: { name: "actor 1" }, edge: { year: 2022 } }] } }
                        { id: "2", actors: { create: [{ node: { name: "actor 2" }, edge: { year: 2022 } }] } }
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

        const req = createJwtRequest("secret", { sub: "1" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param1 AS create_var2
            CALL {
                WITH create_var2
                CREATE (create_this1:\`Movie\`)
                SET
                    create_this1.id = create_var2.id
                WITH create_this1, create_var2
                CALL {
                    WITH create_this1, create_var2
                    UNWIND create_var2.actors.create AS create_var3
                    WITH create_var3.node AS create_var4, create_var3.edge AS create_var5, create_this1
                    CREATE (create_this6:\`Actor\`)
                    SET
                        create_this6.name = create_var4.name,
                        create_this6.id = randomUUID()
                    MERGE (create_this6)-[create_this7:ACTED_IN]->(create_this1)
                    SET
                        create_this7.year = create_var5.year
                    WITH create_this6
                    CALL {
                    	WITH create_this6
                    	MATCH (create_this6)-[create_this6_website_Website_unique:HAS_WEBSITE]->(:Website)
                    	WITH count(create_this6_website_Website_unique) as c
                    	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
                    	RETURN c AS create_this6_website_Website_unique_ignored
                    }
                    RETURN collect(NULL) AS create_var8
                }
                WITH *
                CALL apoc.util.validate(NOT (any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this1
                CALL {
                	WITH create_this1
                	MATCH (create_this1)-[create_this1_website_Website_unique:HAS_WEBSITE]->(:Website)
                	WITH count(create_this1_website_Website_unique) as c
                	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
                	RETURN c AS create_this1_website_Website_unique_ignored
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this0:ACTED_IN]-(create_this1_actors:\`Actor\`)
                WHERE apoc.util.validatePredicate(NOT ((create_this1_actors.id IS NOT NULL AND create_this1_actors.id = $create_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH create_this1_actors { .name } AS create_this1_actors
                RETURN collect(create_this1_actors) AS create_this1_actors
            }
            RETURN collect(create_this1 { .id, actors: create_this1_actors }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"1\\",
                \\"create_param1\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"name\\": \\"actor 1\\"
                                    },
                                    \\"edge\\": {
                                        \\"year\\": {
                                            \\"low\\": 2022,
                                            \\"high\\": 0
                                        }
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
                                    \\"node\\": {
                                        \\"name\\": \\"actor 2\\"
                                    },
                                    \\"edge\\": {
                                        \\"year\\": {
                                            \\"low\\": 2022,
                                            \\"high\\": 0
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ],
                \\"resolvedCallbacks\\": {},
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": [],
                        \\"sub\\": \\"1\\"
                    }
                }
            }"
        `);
    });

    test("heterogeneous batch", async () => {
        const query = gql`
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

        const req = createJwtRequest("secret", { sub: "1" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            WITH this0
            CREATE (this0_actors0_node:Actor)
            SET this0_actors0_node.id = randomUUID()
            SET this0_actors0_node.name = $this0_actors0_node_name
            MERGE (this0)<-[this0_actors0_relationship:ACTED_IN]-(this0_actors0_node)
            SET this0_actors0_relationship.year = $this0_actors0_relationship_year
            WITH this0, this0_actors0_node
            CALL {
            	WITH this0_actors0_node
            	MATCH (this0_actors0_node)-[this0_actors0_node_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this0_actors0_node_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
            	RETURN c AS this0_actors0_node_website_Website_unique_ignored
            }
            WITH this0
            CALL apoc.util.validate(NOT (any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
            CREATE (this1_actors0_node:Actor)
            SET this1_actors0_node.id = randomUUID()
            SET this1_actors0_node.name = $this1_actors0_node_name
            MERGE (this1)<-[this1_actors0_relationship:ACTED_IN]-(this1_actors0_node)
            SET this1_actors0_relationship.year = $this1_actors0_relationship_year
            WITH this1, this1_actors0_node
            CALL {
            	WITH this1_actors0_node
            	MATCH (this1_actors0_node)-[this1_actors0_node_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this1_actors0_node_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDActor.website must be less than or equal to one', [0])
            	RETURN c AS this1_actors0_node_website_Website_unique_ignored
            }
            WITH this1
            CALL apoc.util.validate(NOT (any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
            CALL apoc.util.validate(NOT (any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
            	OPTIONAL MATCH (this3_actors_connect0_node:Actor)
            	WHERE this3_actors_connect0_node.id = $this3_actors_connect0_node_param0
            	WITH this3, this3_actors_connect0_node
            	CALL apoc.util.validate(NOT ((this3_actors_connect0_node.id IS NOT NULL AND this3_actors_connect0_node.id = $this3_actors_connect0_nodeauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	CALL {
            		WITH *
            		WITH collect(this3_actors_connect0_node) as connectedNodes, collect(this3) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this3
            			UNWIND connectedNodes as this3_actors_connect0_node
            			MERGE (this3)<-[this3_actors_connect0_relationship:ACTED_IN]-(this3_actors_connect0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this3, this3_actors_connect0_node
            	RETURN count(*) AS connect_this3_actors_connect_Actor
            }
            WITH this3
            CALL apoc.util.validate(NOT (any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
            CREATE (this4:Movie)
            SET this4.id = $this4_id
            WITH this4
            CALL {
                WITH this4
                MERGE (this4_actors_connectOrCreate0:\`Actor\` { id: $this4_actors_connectOrCreate_param0 })
                ON CREATE SET
                    this4_actors_connectOrCreate0.name = $this4_actors_connectOrCreate_param1
                MERGE (this4)<-[this4_actors_connectOrCreate_this0:ACTED_IN]-(this4_actors_connectOrCreate0)
                WITH *
                CALL apoc.util.validate(NOT ((this4_actors_connectOrCreate0.id IS NOT NULL AND this4_actors_connectOrCreate0.id = $this4_actors_connectOrCreate0auth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN COUNT(*) AS _
            }
            WITH this4
            CALL apoc.util.validate(NOT (any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this4
            CALL {
            	WITH this4
            	MATCH (this4)-[this4_website_Website_unique:HAS_WEBSITE]->(:Website)
            	WITH count(this4_website_Website_unique) as c
            	CALL apoc.util.validate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMovie.website must be less than or equal to one', [0])
            	RETURN c AS this4_website_Website_unique_ignored
            }
            RETURN this4
            }
            CALL {
                WITH this0
                MATCH (this0)-[create_this0:HAS_WEBSITE]->(this0_website:\`Website\`)
                WITH this0_website { .address } AS this0_website
                RETURN head(collect(this0_website)) AS this0_website
            }
            CALL {
                WITH this0
                MATCH (this0)<-[create_this1:ACTED_IN]-(this0_actors:\`Actor\`)
                WHERE apoc.util.validatePredicate(NOT ((this0_actors.id IS NOT NULL AND this0_actors.id = $create_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0_actors { .name } AS this0_actors
                RETURN collect(this0_actors) AS this0_actors
            }
            CALL {
                WITH this1
                MATCH (this1)-[create_this0:HAS_WEBSITE]->(this1_website:\`Website\`)
                WITH this1_website { .address } AS this1_website
                RETURN head(collect(this1_website)) AS this1_website
            }
            CALL {
                WITH this1
                MATCH (this1)<-[create_this1:ACTED_IN]-(this1_actors:\`Actor\`)
                WHERE apoc.util.validatePredicate(NOT ((this1_actors.id IS NOT NULL AND this1_actors.id = $create_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this1_actors { .name } AS this1_actors
                RETURN collect(this1_actors) AS this1_actors
            }
            CALL {
                WITH this2
                MATCH (this2)-[create_this0:HAS_WEBSITE]->(this2_website:\`Website\`)
                WITH this2_website { .address } AS this2_website
                RETURN head(collect(this2_website)) AS this2_website
            }
            CALL {
                WITH this2
                MATCH (this2)<-[create_this1:ACTED_IN]-(this2_actors:\`Actor\`)
                WHERE apoc.util.validatePredicate(NOT ((this2_actors.id IS NOT NULL AND this2_actors.id = $create_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this2_actors { .name } AS this2_actors
                RETURN collect(this2_actors) AS this2_actors
            }
            CALL {
                WITH this3
                MATCH (this3)-[create_this0:HAS_WEBSITE]->(this3_website:\`Website\`)
                WITH this3_website { .address } AS this3_website
                RETURN head(collect(this3_website)) AS this3_website
            }
            CALL {
                WITH this3
                MATCH (this3)<-[create_this1:ACTED_IN]-(this3_actors:\`Actor\`)
                WHERE apoc.util.validatePredicate(NOT ((this3_actors.id IS NOT NULL AND this3_actors.id = $create_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this3_actors { .name } AS this3_actors
                RETURN collect(this3_actors) AS this3_actors
            }
            CALL {
                WITH this4
                MATCH (this4)-[create_this0:HAS_WEBSITE]->(this4_website:\`Website\`)
                WITH this4_website { .address } AS this4_website
                RETURN head(collect(this4_website)) AS this4_website
            }
            CALL {
                WITH this4
                MATCH (this4)<-[create_this1:ACTED_IN]-(this4_actors:\`Actor\`)
                WHERE apoc.util.validatePredicate(NOT ((this4_actors.id IS NOT NULL AND this4_actors.id = $create_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this4_actors { .name } AS this4_actors
                RETURN collect(this4_actors) AS this4_actors
            }
            RETURN [
            this0 { .id, website: this0_website, actors: this0_actors },
            this1 { .id, website: this1_website, actors: this1_actors },
            this2 { .id, website: this2_website, actors: this2_actors },
            this3 { .id, website: this3_website, actors: this3_actors },
            this4 { .id, website: this4_website, actors: this4_actors }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"1\\",
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
                \\"this3_actors_connect0_nodeauth_param0\\": \\"1\\",
                \\"this4_id\\": \\"5\\",
                \\"this4_actors_connectOrCreate_param0\\": \\"2\\",
                \\"this4_actors_connectOrCreate_param1\\": \\"actor 2\\",
                \\"this4_actors_connectOrCreate0auth_param0\\": \\"1\\",
                \\"resolvedCallbacks\\": {},
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": [],
                        \\"sub\\": \\"1\\"
                    }
                }
            }"
        `);
    });
});
