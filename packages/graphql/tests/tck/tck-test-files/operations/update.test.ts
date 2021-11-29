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
import { createJwtRequest } from "../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher Update", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type Movie {
                id: ID
                title: String
                actors: [Actor]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            interface ActedIn {
                screenTime: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
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
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            SET this.id = $this_update_id
            RETURN [ metaVal IN [{type: 'Updated', name: 'Movie', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_id\\": \\"2\\",
                \\"this_update\\": {
                    \\"id\\": \\"2\\"
                }
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
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            WITH this
            OPTIONAL MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name
            CALL apoc.do.when(this_actors0 IS NOT NULL, \\"
            SET this_actors0.name = $this_update_actors0_name
            RETURN this, this_actors0, this_acted_in0_relationship, [ metaVal IN [{type: 'Updated', name: 'Actor', id: id(this_actors0), properties: $this_update_actors0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            \\", \\"\\", {this:this, this_actors0:this_actors0, this_acted_in0_relationship:this_acted_in0_relationship, updateMovies: $updateMovies, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name,this_update_actors0:$this_update_actors0})
            YIELD value
            WITH this, this_actors0, this_acted_in0_relationship, value.mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_actors0_name\\": \\"new name\\",
                \\"this_update_actors0\\": {
                    \\"name\\": \\"new name\\"
                },
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {}
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
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            WITH this
            OPTIONAL MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name
            CALL apoc.do.when(this_actors0 IS NOT NULL, \\"
            SET this_actors0.name = $this_update_actors0_name
            WITH this, this_actors0, this_acted_in0_relationship
            WITH this, this_actors0, this_acted_in0_relationship
            OPTIONAL MATCH (this_actors0)-[this_actors0_acted_in0_relationship:ACTED_IN]->(this_actors0_movies0:Movie)
            WHERE this_actors0_movies0.id = $updateMovies.args.update.actors[0].update.node.movies[0].where.node.id
            CALL apoc.do.when(this_actors0_movies0 IS NOT NULL, \\\\\\"
            SET this_actors0_movies0.title = $this_update_actors0_movies0_title
            RETURN this, this_actors0, this_acted_in0_relationship, this_actors0_movies0, this_actors0_acted_in0_relationship, [ metaVal IN [{type: 'Updated', name: 'Movie', id: id(this_actors0_movies0), properties: $this_update_actors0_movies0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_actors0:this_actors0, this_acted_in0_relationship:this_acted_in0_relationship, this_actors0_movies0:this_actors0_movies0, this_actors0_acted_in0_relationship:this_actors0_acted_in0_relationship, updateMovies: $updateMovies, this_actors0_movies0:this_actors0_movies0, auth:$auth,this_update_actors0_movies0_title:$this_update_actors0_movies0_title,this_update_actors0_movies0:$this_update_actors0_movies0})
            YIELD value
            WITH this, this_actors0, this_acted_in0_relationship, this_actors0_movies0, this_actors0_acted_in0_relationship, value.mutateMeta as mutateMeta
            RETURN this, this_actors0, this_acted_in0_relationship, mutateMeta + [ metaVal IN [{type: 'Updated', name: 'Actor', id: id(this_actors0), properties: $this_update_actors0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            \\", \\"\\", {this:this, this_actors0:this_actors0, this_acted_in0_relationship:this_acted_in0_relationship, updateMovies: $updateMovies, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name,this_update_actors0_movies0_title:$this_update_actors0_movies0_title,this_update_actors0_movies0:$this_update_actors0_movies0,this_update_actors0:$this_update_actors0})
            YIELD value
            WITH this, this_actors0, this_acted_in0_relationship, value.mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_actors0_name\\": \\"new actor name\\",
                \\"this_update_actors0_movies0_title\\": \\"new movie title\\",
                \\"this_update_actors0_movies0\\": {
                    \\"title\\": \\"new movie title\\"
                },
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {}
                },
                \\"this_update_actors0\\": {
                    \\"name\\": \\"new actor name\\"
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
        const result = await translateQuery(neoSchema, query, {
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
            CALL apoc.do.when(this_connect_actors0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)<-[this_connect_actors0_relationship:ACTED_IN]-(this_connect_actors0_node)
            RETURN this, this_connect_actors0_node, [ metaVal IN [{type: 'Connected', name: 'Movie', relationshipName: 'ACTED_IN', toName: 'Actor', id: id(this), relationshipID: id(this_connect_actors0_relationship), toID: id(this_connect_actors0_node), properties: this_connect_actors0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_connect_actors0_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_actors0_node:this_connect_actors0_node})
            YIELD value
            WITH this, this_connect_actors0_node, value.this_connect_actors0_node_mutateMeta as this_connect_actors_mutateMeta
            RETURN REDUCE(tmp1_this_connect_actors_mutateMeta = [], tmp2_this_connect_actors_mutateMeta IN COLLECT(this_connect_actors_mutateMeta) | tmp1_this_connect_actors_mutateMeta + tmp2_this_connect_actors_mutateMeta) as this_connect_actors_mutateMeta
            }
            WITH this, this_connect_actors_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
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
        const result = await translateQuery(neoSchema, query, {
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
            CALL apoc.do.when(this_connect_actors0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)<-[this_connect_actors0_relationship:ACTED_IN]-(this_connect_actors0_node)
            RETURN this, this_connect_actors0_node, [ metaVal IN [{type: 'Connected', name: 'Movie', relationshipName: 'ACTED_IN', toName: 'Actor', id: id(this), relationshipID: id(this_connect_actors0_relationship), toID: id(this_connect_actors0_node), properties: this_connect_actors0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_connect_actors0_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_actors0_node:this_connect_actors0_node})
            YIELD value
            WITH this, this_connect_actors0_node, value.this_connect_actors0_node_mutateMeta as this_connect_actors_mutateMeta
            RETURN REDUCE(tmp1_this_connect_actors_mutateMeta = [], tmp2_this_connect_actors_mutateMeta IN COLLECT(this_connect_actors_mutateMeta) | tmp1_this_connect_actors_mutateMeta + tmp2_this_connect_actors_mutateMeta) as this_connect_actors_mutateMeta
            }
            WITH this, this_connect_actors_mutateMeta as mutateMeta
            WITH this, mutateMeta
            CALL {
            WITH this, mutateMeta
            	OPTIONAL MATCH (this_connect_actors1_node:Actor)
            	WHERE this_connect_actors1_node.name = $this_connect_actors1_node_name
            CALL apoc.do.when(this_connect_actors1_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)<-[this_connect_actors1_relationship:ACTED_IN]-(this_connect_actors1_node)
            RETURN this, this_connect_actors1_node, [ metaVal IN [{type: 'Connected', name: 'Movie', relationshipName: 'ACTED_IN', toName: 'Actor', id: id(this), relationshipID: id(this_connect_actors1_relationship), toID: id(this_connect_actors1_node), properties: this_connect_actors1_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_connect_actors1_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_actors1_node:this_connect_actors1_node})
            YIELD value
            WITH this, this_connect_actors1_node, value.this_connect_actors1_node_mutateMeta as this_connect_actors_mutateMeta
            RETURN REDUCE(tmp1_this_connect_actors_mutateMeta = [], tmp2_this_connect_actors_mutateMeta IN COLLECT(this_connect_actors_mutateMeta) | tmp1_this_connect_actors_mutateMeta + tmp2_this_connect_actors_mutateMeta) as this_connect_actors_mutateMeta
            }
            WITH this, mutateMeta + this_connect_actors_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
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
        const result = await translateQuery(neoSchema, query, {
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
            WITH this, this_disconnect_actors0, this_disconnect_actors0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Movie', toName: 'Actor', relationshipName: 'ACTED_IN', id: id(this), toID: id(this_disconnect_actors0), relationshipID: id(this_disconnect_actors0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_mutateMeta
            FOREACH(_ IN CASE this_disconnect_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actors0_rel
            )
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, this_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
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
        const result = await translateQuery(neoSchema, query, {
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
            WITH this, this_disconnect_actors0, this_disconnect_actors0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Movie', toName: 'Actor', relationshipName: 'ACTED_IN', id: id(this), toID: id(this_disconnect_actors0), relationshipID: id(this_disconnect_actors0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_mutateMeta
            FOREACH(_ IN CASE this_disconnect_actors0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actors0_rel
            )
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, this_mutateMeta as mutateMeta
            WITH this, mutateMeta
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_actors1_rel:ACTED_IN]-(this_disconnect_actors1:Actor)
            WHERE this_disconnect_actors1.name = $updateMovies.args.disconnect.actors[1].where.node.name
            WITH this, this_disconnect_actors1, this_disconnect_actors1_rel, [ metaVal IN [{type: 'Disconnected', name: 'Movie', toName: 'Actor', relationshipName: 'ACTED_IN', id: id(this), toID: id(this_disconnect_actors1), relationshipID: id(this_disconnect_actors1_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_mutateMeta
            FOREACH(_ IN CASE this_disconnect_actors1 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_actors1_rel
            )
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, mutateMeta + this_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
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
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $this_name
            WITH this
            WITH this
            CREATE (this_movies0_create0_node:Movie)
            SET this_movies0_create0_node.id = $this_movies0_create0_node_id
            SET this_movies0_create0_node.title = $this_movies0_create0_node_title
            MERGE (this)-[:ACTED_IN]->(this_movies0_create0_node)
            WITH this, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this_movies0_create0_node), properties: this_movies0_create0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            RETURN mutateMeta, this { .name, movies: [ (this)-[:ACTED_IN]->(this_movies:Movie)   | this_movies { .id, .title } ] } AS this"
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
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $this_name
            CREATE (this_create_movies0_node:Movie)
            SET this_create_movies0_node.id = $this_create_movies0_node_id
            SET this_create_movies0_node.title = $this_create_movies0_node_title
            WITH this, this_create_movies0_node, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this_create_movies0_node), properties: this_create_movies0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            MERGE (this)-[this_create_movies0_relationship:ACTED_IN]->(this_create_movies0_node)
            WITH this, mutateMeta + [ metaVal IN [{type: 'Connected', name: 'Actor', toName: 'Movie', relationshipName: 'ACTED_IN', id: id(this_create_movies0_node), toID: id(this), relationshipID: id(this_create_movies0_relationship), properties: this_create_movies0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            RETURN mutateMeta, this { .name, movies: [ (this)-[:ACTED_IN]->(this_movies:Movie)   | this_movies { .id, .title } ] } AS this"
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
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WHERE this.name = $this_name
            CREATE (this_create_movies0_node:Movie)
            SET this_create_movies0_node.id = $this_create_movies0_node_id
            SET this_create_movies0_node.title = $this_create_movies0_node_title
            WITH this, this_create_movies0_node, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this_create_movies0_node), properties: this_create_movies0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            MERGE (this)-[this_create_movies0_relationship:ACTED_IN]->(this_create_movies0_node)
            WITH this, mutateMeta + [ metaVal IN [{type: 'Connected', name: 'Actor', toName: 'Movie', relationshipName: 'ACTED_IN', id: id(this_create_movies0_node), toID: id(this), relationshipID: id(this_create_movies0_relationship), properties: this_create_movies0_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            CREATE (this_create_movies1_node:Movie)
            SET this_create_movies1_node.id = $this_create_movies1_node_id
            SET this_create_movies1_node.title = $this_create_movies1_node_title
            WITH this, this_create_movies1_node, mutateMeta + [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this_create_movies1_node), properties: this_create_movies1_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            MERGE (this)-[this_create_movies1_relationship:ACTED_IN]->(this_create_movies1_node)
            WITH this, mutateMeta + [ metaVal IN [{type: 'Connected', name: 'Actor', toName: 'Movie', relationshipName: 'ACTED_IN', id: id(this_create_movies1_node), toID: id(this), relationshipID: id(this_create_movies1_relationship), properties: this_create_movies1_relationship}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            RETURN mutateMeta, this { .name, movies: [ (this)-[:ACTED_IN]->(this_movies:Movie)   | this_movies { .id, .title } ] } AS this"
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
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            OPTIONAL MATCH (this)<-[this_delete_actors0_relationship:ACTED_IN]-(this_delete_actors0:Actor)
            WHERE this_delete_actors0_relationship.screenTime = $updateMovies.args.delete.actors[0].where.edge.screenTime AND this_delete_actors0.name = $updateMovies.args.delete.actors[0].where.node.name
            WITH this, this_delete_actors0, collect(DISTINCT this_delete_actors0) as this_delete_actors0_to_delete, [ metaVal IN [{type: 'Deleted', name: 'Actor', id: id(this_delete_actors0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_delete_actors0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
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
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            WITH this
            OPTIONAL MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Actor)
            WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name
            CALL apoc.do.when(this_actors0 IS NOT NULL, \\"
            SET this_actors0.name = $this_update_actors0_name
            RETURN this, this_actors0, this_acted_in0_relationship, [ metaVal IN [{type: 'Updated', name: 'Actor', id: id(this_actors0), properties: $this_update_actors0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            \\", \\"\\", {this:this, this_actors0:this_actors0, this_acted_in0_relationship:this_acted_in0_relationship, updateMovies: $updateMovies, this_actors0:this_actors0, auth:$auth,this_update_actors0_name:$this_update_actors0_name,this_update_actors0:$this_update_actors0})
            YIELD value
            WITH this, this_actors0, this_acted_in0_relationship, value.mutateMeta as mutateMeta
            WITH this, mutateMeta
            OPTIONAL MATCH (this)<-[this_delete_actors0_relationship:ACTED_IN]-(this_delete_actors0:Actor)
            WHERE this_delete_actors0.name = $updateMovies.args.delete.actors[0].where.node.name
            WITH this, this_delete_actors0, collect(DISTINCT this_delete_actors0) as this_delete_actors0_to_delete, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'Actor', id: id(this_delete_actors0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_delete_actors0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_actors0_name\\": \\"Updated name\\",
                \\"this_update_actors0\\": {
                    \\"name\\": \\"Updated name\\"
                },
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {}
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
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            WITH this
            OPTIONAL MATCH (this)<-[this_actors0_delete0_relationship:ACTED_IN]-(this_actors0_delete0:Actor)
            WHERE this_actors0_delete0.name = $updateMovies.args.update.actors[0].delete[0].where.node.name
            WITH this, this_actors0_delete0, collect(DISTINCT this_actors0_delete0) as this_actors0_delete0_to_delete, [ metaVal IN [{type: 'Deleted', name: 'Actor', id: id(this_actors0_delete0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_actors0_delete0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
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
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $this_id
            WITH this
            WITH this
            OPTIONAL MATCH (this)<-[this_actors0_delete0_relationship:ACTED_IN]-(this_actors0_delete0:Actor)
            WHERE this_actors0_delete0.name = $updateMovies.args.update.actors[0].delete[0].where.node.name
            WITH this, this_actors0_delete0, collect(DISTINCT this_actors0_delete0) as this_actors0_delete0_to_delete, [ metaVal IN [{type: 'Deleted', name: 'Actor', id: id(this_actors0_delete0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            WITH this, this_actors0_delete0, this_actors0_delete0_to_delete, mutateMeta
            OPTIONAL MATCH (this_actors0_delete0)-[this_actors0_delete0_movies0_relationship:ACTED_IN]->(this_actors0_delete0_movies0:Movie)
            WHERE this_actors0_delete0_movies0.id = $updateMovies.args.update.actors[0].delete[0].delete.movies[0].where.node.id
            WITH this, this_actors0_delete0, this_actors0_delete0_to_delete, this_actors0_delete0_movies0, collect(DISTINCT this_actors0_delete0_movies0) as this_actors0_delete0_movies0_to_delete, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'Movie', id: id(this_actors0_delete0_movies0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_actors0_delete0_movies0_to_delete | DETACH DELETE x)
            WITH this, this_actors0_delete0, this_actors0_delete0_to_delete, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            FOREACH(x IN this_actors0_delete0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
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
