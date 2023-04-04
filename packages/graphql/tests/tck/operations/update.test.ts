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
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher Update", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type Movie {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            interface ActedIn {
                screenTime: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Update", async () => {
        const query = gql`
            mutation {
                updateMovies(where: { id: "1" }, update: { id: "2" }) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            SET this.id = $this_update_id
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"this_update_id\\": \\"2\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Single Nested Update", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { id: "1" }
                    update: {
                        actors: [{ where: { node: { name: "old name" } }, update: { node: { name: "new name" } } }]
                    }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            	WHERE this_actors0.name = $updateMovies_args_update_actors0_where_this_actors0param0
            	SET this_actors0.name = $this_update_actors0_name
            	RETURN count(*) AS update_this_actors0
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"updateMovies_args_update_actors0_where_this_actors0param0\\": \\"old name\\",
                \\"this_update_actors0_name\\": \\"new name\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"old name\\"
                                        }
                                    },
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"new name\\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Double Nested Update", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { id: "1" }
                    update: {
                        actors: [
                            {
                                where: { node: { name: "old actor name" } }
                                update: {
                                    node: {
                                        name: "new actor name"
                                        movies: [
                                            {
                                                where: { node: { id: "old movie title" } }
                                                update: { node: { title: "new movie title" } }
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            	WHERE this_actors0.name = $updateMovies_args_update_actors0_where_this_actors0param0
            	SET this_actors0.name = $this_update_actors0_name
            	WITH this, this_actors0
            	CALL {
            		WITH this, this_actors0
            		MATCH (this_actors0)-[this_actors0_acted_in0_relationship:ACTED_IN]->(this_actors0_movies0:Movie)
            		WHERE this_actors0_movies0.id = $updateMovies_args_update_actors0_update_node_movies0_where_this_actors0_movies0param0
            		SET this_actors0_movies0.title = $this_update_actors0_movies0_title
            		RETURN count(*) AS update_this_actors0_movies0
            	}
            	RETURN count(*) AS update_this_actors0
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"updateMovies_args_update_actors0_where_this_actors0param0\\": \\"old actor name\\",
                \\"this_update_actors0_name\\": \\"new actor name\\",
                \\"updateMovies_args_update_actors0_update_node_movies0_where_this_actors0_movies0param0\\": \\"old movie title\\",
                \\"this_update_actors0_movies0_title\\": \\"new movie title\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"old actor name\\"
                                        }
                                    },
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"new actor name\\",
                                            \\"movies\\": [
                                                {
                                                    \\"where\\": {
                                                        \\"node\\": {
                                                            \\"id\\": \\"old movie title\\"
                                                        }
                                                    },
                                                    \\"update\\": {
                                                        \\"node\\": {
                                                            \\"title\\": \\"new movie title\\"
                                                        }
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Simple Update as Connect", async () => {
        const query = gql`
            mutation {
                updateMovies(where: { id: "1" }, connect: { actors: [{ where: { node: { name: "Daniel" } } }] }) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actors0_node:Actor)
            	WHERE this_connect_actors0_node.name = $this_connect_actors0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actors0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actors0_node
            			MERGE (this)<-[this_connect_actors0_relationship:ACTED_IN]-(this_connect_actors0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actors0_node
            	RETURN count(*) AS connect_this_connect_actors_Actor
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"this_connect_actors0_node_param0\\": \\"Daniel\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update as multiple Connect", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { id: "1" }
                    connect: {
                        actors: [{ where: { node: { name: "Daniel" } } }, { where: { node: { name: "Darrell" } } }]
                    }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actors0_node:Actor)
            	WHERE this_connect_actors0_node.name = $this_connect_actors0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actors0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actors0_node
            			MERGE (this)<-[this_connect_actors0_relationship:ACTED_IN]-(this_connect_actors0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actors0_node
            	RETURN count(*) AS connect_this_connect_actors_Actor
            }
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actors1_node:Actor)
            	WHERE this_connect_actors1_node.name = $this_connect_actors1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actors1_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actors1_node
            			MERGE (this)<-[this_connect_actors1_relationship:ACTED_IN]-(this_connect_actors1_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_actors1_node
            	RETURN count(*) AS connect_this_connect_actors_Actor
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"this_connect_actors0_node_param0\\": \\"Daniel\\",
                \\"this_connect_actors1_node_param0\\": \\"Darrell\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Simple Update as Disconnect", async () => {
        const query = gql`
            mutation {
                updateMovies(where: { id: "1" }, disconnect: { actors: [{ where: { node: { name: "Daniel" } } }] }) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_actors0_rel:ACTED_IN]-(this_disconnect_actors0:Actor)
            WHERE this_disconnect_actors0.name = $updateMovies_args_disconnect_actors0_where_Actor_this_disconnect_actors0param0
            CALL {
            	WITH this_disconnect_actors0, this_disconnect_actors0_rel, this
            	WITH collect(this_disconnect_actors0) as this_disconnect_actors0, this_disconnect_actors0_rel, this
            	UNWIND this_disconnect_actors0 as x
            	DELETE this_disconnect_actors0_rel
            	RETURN count(*) AS _
            }
            RETURN count(*) AS disconnect_this_disconnect_actors_Actor
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"updateMovies_args_disconnect_actors0_where_Actor_this_disconnect_actors0param0\\": \\"Daniel\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Daniel\\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update as multiple Disconnect", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { id: "1" }
                    disconnect: {
                        actors: [{ where: { node: { name: "Daniel" } } }, { where: { node: { name: "Darrell" } } }]
                    }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_actors0_rel:ACTED_IN]-(this_disconnect_actors0:Actor)
            WHERE this_disconnect_actors0.name = $updateMovies_args_disconnect_actors0_where_Actor_this_disconnect_actors0param0
            CALL {
            	WITH this_disconnect_actors0, this_disconnect_actors0_rel, this
            	WITH collect(this_disconnect_actors0) as this_disconnect_actors0, this_disconnect_actors0_rel, this
            	UNWIND this_disconnect_actors0 as x
            	DELETE this_disconnect_actors0_rel
            	RETURN count(*) AS _
            }
            RETURN count(*) AS disconnect_this_disconnect_actors_Actor
            }
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_actors1_rel:ACTED_IN]-(this_disconnect_actors1:Actor)
            WHERE this_disconnect_actors1.name = $updateMovies_args_disconnect_actors1_where_Actor_this_disconnect_actors1param0
            CALL {
            	WITH this_disconnect_actors1, this_disconnect_actors1_rel, this
            	WITH collect(this_disconnect_actors1) as this_disconnect_actors1, this_disconnect_actors1_rel, this
            	UNWIND this_disconnect_actors1 as x
            	DELETE this_disconnect_actors1_rel
            	RETURN count(*) AS _
            }
            RETURN count(*) AS disconnect_this_disconnect_actors_Actor
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"updateMovies_args_disconnect_actors0_where_Actor_this_disconnect_actors0param0\\": \\"Daniel\\",
                \\"updateMovies_args_disconnect_actors1_where_Actor_this_disconnect_actors1param0\\": \\"Darrell\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Daniel\\"
                                        }
                                    }
                                },
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Darrell\\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update an Actor while creating and connecting to a new Movie (via field level)", async () => {
        const query = gql`
            mutation {
                updateActors(
                    where: { name: "Dan" }
                    update: { movies: { create: [{ node: { id: "dan_movie_id", title: "The Story of Beer" } }] } }
                ) {
                    actors {
                        name
                        movies {
                            id
                            title
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            WHERE this.name = $param0
            WITH this
            CREATE (this_movies0_create0_node:Movie)
            SET this_movies0_create0_node.id = $this_movies0_create0_node_id
            SET this_movies0_create0_node.title = $this_movies0_create0_node_title
            MERGE (this)-[:ACTED_IN]->(this_movies0_create0_node)
            WITH *
            CALL {
                WITH this
                MATCH (this)-[update_this0:ACTED_IN]->(update_this1:\`Movie\`)
                WITH update_this1 { .id, .title } AS update_this1
                RETURN collect(update_this1) AS update_var2
            }
            RETURN collect(DISTINCT this { .name, movies: update_var2 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Dan\\",
                \\"this_movies0_create0_node_id\\": \\"dan_movie_id\\",
                \\"this_movies0_create0_node_title\\": \\"The Story of Beer\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update an Actor while creating and connecting to a new Movie (via top level)", async () => {
        const query = gql`
            mutation {
                updateActors(
                    where: { name: "Dan" }
                    create: { movies: [{ node: { id: "dan_movie_id", title: "The Story of Beer" } }] }
                ) {
                    actors {
                        name
                        movies {
                            id
                            title
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            WHERE this.name = $param0
            CREATE (this_create_movies0_node:Movie)
            SET this_create_movies0_node.id = $this_create_movies0_node_id
            SET this_create_movies0_node.title = $this_create_movies0_node_title
            MERGE (this)-[this_create_movies0_relationship:ACTED_IN]->(this_create_movies0_node)
            WITH *
            CALL {
                WITH this
                MATCH (this)-[update_this0:ACTED_IN]->(update_this1:\`Movie\`)
                WITH update_this1 { .id, .title } AS update_this1
                RETURN collect(update_this1) AS update_var2
            }
            RETURN collect(DISTINCT this { .name, movies: update_var2 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Dan\\",
                \\"this_create_movies0_node_id\\": \\"dan_movie_id\\",
                \\"this_create_movies0_node_title\\": \\"The Story of Beer\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update an Actor while creating and connecting to multiple new Movies (via top level)", async () => {
        const query = gql`
            mutation {
                updateActors(
                    where: { name: "Dan" }
                    create: {
                        movies: [
                            { node: { id: "dan_movie_id", title: "The Story of Beer" } }
                            { node: { id: "dan_movie2_id", title: "Forrest Gump" } }
                        ]
                    }
                ) {
                    actors {
                        name
                        movies {
                            id
                            title
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            WHERE this.name = $param0
            CREATE (this_create_movies0_node:Movie)
            SET this_create_movies0_node.id = $this_create_movies0_node_id
            SET this_create_movies0_node.title = $this_create_movies0_node_title
            MERGE (this)-[this_create_movies0_relationship:ACTED_IN]->(this_create_movies0_node)
            CREATE (this_create_movies1_node:Movie)
            SET this_create_movies1_node.id = $this_create_movies1_node_id
            SET this_create_movies1_node.title = $this_create_movies1_node_title
            MERGE (this)-[this_create_movies1_relationship:ACTED_IN]->(this_create_movies1_node)
            WITH *
            CALL {
                WITH this
                MATCH (this)-[update_this0:ACTED_IN]->(update_this1:\`Movie\`)
                WITH update_this1 { .id, .title } AS update_this1
                RETURN collect(update_this1) AS update_var2
            }
            RETURN collect(DISTINCT this { .name, movies: update_var2 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Dan\\",
                \\"this_create_movies0_node_id\\": \\"dan_movie_id\\",
                \\"this_create_movies0_node_title\\": \\"The Story of Beer\\",
                \\"this_create_movies1_node_id\\": \\"dan_movie2_id\\",
                \\"this_create_movies1_node_title\\": \\"Forrest Gump\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Delete related node as update", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { id: "1" }
                    delete: { actors: { where: { node: { name: "Actor to delete" }, edge: { screenTime: 60 } } } }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this
            OPTIONAL MATCH (this)<-[this_delete_actors0_relationship:ACTED_IN]-(this_delete_actors0:Actor)
            WHERE (this_delete_actors0_relationship.screenTime = $updateMovies_args_delete_actors0_where_this_delete_actors0param0 AND this_delete_actors0.name = $updateMovies_args_delete_actors0_where_this_delete_actors0param1)
            WITH this, collect(DISTINCT this_delete_actors0) AS this_delete_actors0_to_delete
            CALL {
            	WITH this_delete_actors0_to_delete
            	UNWIND this_delete_actors0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"updateMovies_args_delete_actors0_where_this_delete_actors0param0\\": {
                    \\"low\\": 60,
                    \\"high\\": 0
                },
                \\"updateMovies_args_delete_actors0_where_this_delete_actors0param1\\": \\"Actor to delete\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"edge\\": {
                                            \\"screenTime\\": {
                                                \\"low\\": 60,
                                                \\"high\\": 0
                                            }
                                        },
                                        \\"node\\": {
                                            \\"name\\": \\"Actor to delete\\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Delete and update nested operations under same mutation", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { id: "1" }
                    update: {
                        actors: {
                            where: { node: { name: "Actor to update" } }
                            update: { node: { name: "Updated name" } }
                        }
                    }
                    delete: { actors: { where: { node: { name: "Actor to delete" } } } }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this
            OPTIONAL MATCH (this)<-[this_delete_actors0_relationship:ACTED_IN]-(this_delete_actors0:Actor)
            WHERE this_delete_actors0.name = $updateMovies_args_delete_actors0_where_this_delete_actors0param0
            WITH this, collect(DISTINCT this_delete_actors0) AS this_delete_actors0_to_delete
            CALL {
            	WITH this_delete_actors0_to_delete
            	UNWIND this_delete_actors0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            	WHERE this_actors0.name = $updateMovies_args_update_actors0_where_this_actors0param0
            	SET this_actors0.name = $this_update_actors0_name
            	RETURN count(*) AS update_this_actors0
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"updateMovies_args_delete_actors0_where_this_delete_actors0param0\\": \\"Actor to delete\\",
                \\"updateMovies_args_update_actors0_where_this_actors0param0\\": \\"Actor to update\\",
                \\"this_update_actors0_name\\": \\"Updated name\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Actor to delete\\"
                                        }
                                    }
                                }
                            ]
                        },
                        \\"update\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Actor to update\\"
                                        }
                                    },
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Updated name\\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Nested delete under a nested update", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { id: "1" }
                    update: { actors: { delete: { where: { node: { name: "Actor to delete" } } } } }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this
            OPTIONAL MATCH (this)<-[this_actors0_delete0_relationship:ACTED_IN]-(this_actors0_delete0:Actor)
            WHERE this_actors0_delete0.name = $updateMovies_args_update_actors0_delete0_where_this_actors0_delete0param0
            WITH this, collect(DISTINCT this_actors0_delete0) AS this_actors0_delete0_to_delete
            CALL {
            	WITH this_actors0_delete0_to_delete
            	UNWIND this_actors0_delete0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"updateMovies_args_update_actors0_delete0_where_this_actors0_delete0param0\\": \\"Actor to delete\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actors\\": [
                                {
                                    \\"delete\\": [
                                        {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"name\\": \\"Actor to delete\\"
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Double nested delete under a nested update", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { id: "1" }
                    update: {
                        actors: {
                            delete: {
                                where: { node: { name: "Actor to delete" } }
                                delete: { movies: { where: { node: { id: "2" } } } }
                            }
                        }
                    }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.id = $param0
            WITH this
            OPTIONAL MATCH (this)<-[this_actors0_delete0_relationship:ACTED_IN]-(this_actors0_delete0:Actor)
            WHERE this_actors0_delete0.name = $updateMovies_args_update_actors0_delete0_where_this_actors0_delete0param0
            WITH this, this_actors0_delete0
            OPTIONAL MATCH (this_actors0_delete0)-[this_actors0_delete0_movies0_relationship:ACTED_IN]->(this_actors0_delete0_movies0:Movie)
            WHERE this_actors0_delete0_movies0.id = $updateMovies_args_update_actors0_delete0_delete_movies0_where_this_actors0_delete0_movies0param0
            WITH this, this_actors0_delete0, collect(DISTINCT this_actors0_delete0_movies0) AS this_actors0_delete0_movies0_to_delete
            CALL {
            	WITH this_actors0_delete0_movies0_to_delete
            	UNWIND this_actors0_delete0_movies0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            WITH this, collect(DISTINCT this_actors0_delete0) AS this_actors0_delete0_to_delete
            CALL {
            	WITH this_actors0_delete0_to_delete
            	UNWIND this_actors0_delete0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"updateMovies_args_update_actors0_delete0_where_this_actors0_delete0param0\\": \\"Actor to delete\\",
                \\"updateMovies_args_update_actors0_delete0_delete_movies0_where_this_actors0_delete0_movies0param0\\": \\"2\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actors\\": [
                                {
                                    \\"delete\\": [
                                        {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"name\\": \\"Actor to delete\\"
                                                }
                                            },
                                            \\"delete\\": {
                                                \\"movies\\": [
                                                    {
                                                        \\"where\\": {
                                                            \\"node\\": {
                                                                \\"id\\": \\"2\\"
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
