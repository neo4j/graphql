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
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher Update", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neo4jgraphql: Neo4jGraphQL;

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

        neo4jgraphql = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            SET this.id = $this_update_id
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_id\\": \\"2\\"
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            OPTIONAL MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name
            CALL apoc.do.when(this_actors0 IS NOT NULL, \\"
            SET this_actors0.name = $this_update_actors0_name
            RETURN count(*)
            \\", \\"\\", {this:this, updateMovies: $updateMovies, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name})
            YIELD value as _
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_actors0_name\\": \\"new name\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                },
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
                }
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            OPTIONAL MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name
            CALL apoc.do.when(this_actors0 IS NOT NULL, \\"
            SET this_actors0.name = $this_update_actors0_name
            WITH this, this_actors0
            OPTIONAL MATCH (this_actors0)-[this_actors0_acted_in0_relationship:ACTED_IN]->(this_actors0_movies0:Movie)
            WHERE this_actors0_movies0.id = $updateMovies.args.update.actors[0].update.node.movies[0].where.node.id
            CALL apoc.do.when(this_actors0_movies0 IS NOT NULL, \\\\\\"
            SET this_actors0_movies0.title = $this_update_actors0_movies0_title
            RETURN count(*)
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_actors0:this_actors0, updateMovies: $updateMovies, this_actors0_movies0:this_actors0_movies0, auth:$auth,this_update_actors0_movies0_title:$this_update_actors0_movies0_title})
            YIELD value as _
            RETURN count(*)
            \\", \\"\\", {this:this, updateMovies: $updateMovies, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name,this_update_actors0_movies0_title:$this_update_actors0_movies0_title})
            YIELD value as _
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_actors0_name\\": \\"new actor name\\",
                \\"this_update_actors0_movies0_title\\": \\"new movie title\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                },
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
                }
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actors0_node:Actor)
            	WHERE this_connect_actors0_node.name = $this_connect_actors0_node_name
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actors0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)<-[this_connect_actors0_relationship:ACTED_IN]-(this_connect_actors0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_connect_actors0_node_name\\": \\"Daniel\\"
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actors0_node:Actor)
            	WHERE this_connect_actors0_node.name = $this_connect_actors0_node_name
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actors0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)<-[this_connect_actors0_relationship:ACTED_IN]-(this_connect_actors0_node)
            		)
            	)
            	RETURN count(*)
            }
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actors1_node:Actor)
            	WHERE this_connect_actors1_node.name = $this_connect_actors1_node_name
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_actors1_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)<-[this_connect_actors1_relationship:ACTED_IN]-(this_connect_actors1_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_connect_actors0_node_name\\": \\"Daniel\\",
                \\"this_connect_actors1_node_name\\": \\"Darrell\\"
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_actors0_rel:ACTED_IN]-(this_disconnect_actors0:Actor)
            WHERE this_disconnect_actors0.name = $updateMovies.args.disconnect.actors[0].where.node.name
            FOREACH(_ IN CASE this_disconnect_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actors0_rel
            )
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
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
                }
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_actors0_rel:ACTED_IN]-(this_disconnect_actors0:Actor)
            WHERE this_disconnect_actors0.name = $updateMovies.args.disconnect.actors[0].where.node.name
            FOREACH(_ IN CASE this_disconnect_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actors0_rel
            )
            RETURN count(*)
            }
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_actors1_rel:ACTED_IN]-(this_disconnect_actors1:Actor)
            WHERE this_disconnect_actors1.name = $updateMovies.args.disconnect.actors[1].where.node.name
            FOREACH(_ IN CASE this_disconnect_actors1 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actors1_rel
            )
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
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
                }
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $this_name
            WITH this
            CREATE (this_movies0_create0_node:Movie)
            SET this_movies0_create0_node.id = $this_movies0_create0_node_id
            SET this_movies0_create0_node.title = $this_movies0_create0_node_title
            MERGE (this)-[:ACTED_IN]->(this_movies0_create0_node)
            RETURN this { .name, movies: [ (this)-[:ACTED_IN]->(this_movies:Movie)   | this_movies { .id, .title } ] } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_name\\": \\"Dan\\",
                \\"this_movies0_create0_node_id\\": \\"dan_movie_id\\",
                \\"this_movies0_create0_node_title\\": \\"The Story of Beer\\"
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $this_name
            CREATE (this_create_movies0_node:Movie)
            SET this_create_movies0_node.id = $this_create_movies0_node_id
            SET this_create_movies0_node.title = $this_create_movies0_node_title
            MERGE (this)-[this_create_movies0_relationship:ACTED_IN]->(this_create_movies0_node)
            RETURN this { .name, movies: [ (this)-[:ACTED_IN]->(this_movies:Movie)   | this_movies { .id, .title } ] } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_name\\": \\"Dan\\",
                \\"this_create_movies0_node_id\\": \\"dan_movie_id\\",
                \\"this_create_movies0_node_title\\": \\"The Story of Beer\\"
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $this_name
            CREATE (this_create_movies0_node:Movie)
            SET this_create_movies0_node.id = $this_create_movies0_node_id
            SET this_create_movies0_node.title = $this_create_movies0_node_title
            MERGE (this)-[this_create_movies0_relationship:ACTED_IN]->(this_create_movies0_node)
            CREATE (this_create_movies1_node:Movie)
            SET this_create_movies1_node.id = $this_create_movies1_node_id
            SET this_create_movies1_node.title = $this_create_movies1_node_title
            MERGE (this)-[this_create_movies1_relationship:ACTED_IN]->(this_create_movies1_node)
            RETURN this { .name, movies: [ (this)-[:ACTED_IN]->(this_movies:Movie)   | this_movies { .id, .title } ] } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_name\\": \\"Dan\\",
                \\"this_create_movies0_node_id\\": \\"dan_movie_id\\",
                \\"this_create_movies0_node_title\\": \\"The Story of Beer\\",
                \\"this_create_movies1_node_id\\": \\"dan_movie2_id\\",
                \\"this_create_movies1_node_title\\": \\"Forrest Gump\\"
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            OPTIONAL MATCH (this)<-[this_delete_actors0_relationship:ACTED_IN]-(this_delete_actors0:Actor)
            WHERE this_delete_actors0_relationship.screenTime = $updateMovies.args.delete.actors[0].where.edge.screenTime AND this_delete_actors0.name = $updateMovies.args.delete.actors[0].where.node.name
            WITH this, collect(DISTINCT this_delete_actors0) as this_delete_actors0_to_delete
            FOREACH(x IN this_delete_actors0_to_delete | DETACH DELETE x)
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
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
                }
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            OPTIONAL MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name
            CALL apoc.do.when(this_actors0 IS NOT NULL, \\"
            SET this_actors0.name = $this_update_actors0_name
            RETURN count(*)
            \\", \\"\\", {this:this, updateMovies: $updateMovies, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name})
            YIELD value as _
            WITH this
            OPTIONAL MATCH (this)<-[this_delete_actors0_relationship:ACTED_IN]-(this_delete_actors0:Actor)
            WHERE this_delete_actors0.name = $updateMovies.args.delete.actors[0].where.node.name
            WITH this, collect(DISTINCT this_delete_actors0) as this_delete_actors0_to_delete
            FOREACH(x IN this_delete_actors0_to_delete | DETACH DELETE x)
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_actors0_name\\": \\"Updated name\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                },
                \\"updateMovies\\": {
                    \\"args\\": {
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
                        },
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
                        }
                    }
                }
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            OPTIONAL MATCH (this)<-[this_actors0_delete0_relationship:ACTED_IN]-(this_actors0_delete0:Actor)
            WHERE this_actors0_delete0.name = $updateMovies.args.update.actors[0].delete[0].where.node.name
            WITH this, collect(DISTINCT this_actors0_delete0) as this_actors0_delete0_to_delete
            FOREACH(x IN this_actors0_delete0_to_delete | DETACH DELETE x)
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
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
                }
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
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            OPTIONAL MATCH (this)<-[this_actors0_delete0_relationship:ACTED_IN]-(this_actors0_delete0:Actor)
            WHERE this_actors0_delete0.name = $updateMovies.args.update.actors[0].delete[0].where.node.name
            WITH this, this_actors0_delete0
            OPTIONAL MATCH (this_actors0_delete0)-[this_actors0_delete0_movies0_relationship:ACTED_IN]->(this_actors0_delete0_movies0:Movie)
            WHERE this_actors0_delete0_movies0.id = $updateMovies.args.update.actors[0].delete[0].delete.movies[0].where.node.id
            WITH this, this_actors0_delete0, collect(DISTINCT this_actors0_delete0_movies0) as this_actors0_delete0_movies0_to_delete
            FOREACH(x IN this_actors0_delete0_movies0_to_delete | DETACH DELETE x)
            WITH this, collect(DISTINCT this_actors0_delete0) as this_actors0_delete0_to_delete
            FOREACH(x IN this_actors0_delete0_to_delete | DETACH DELETE x)
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
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
                }
            }"
        `);
    });
});
