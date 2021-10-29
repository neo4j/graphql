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
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Label in Node directive", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor @node(label: "Person") {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie @node(label: "Film") {
                id: ID
                title: String
                actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Select Movie with label Film", async () => {
        const query = gql`
            {
                movies {
                    title
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Select movie and actor with custom labels", async () => {
        const query = gql`
            {
                movies {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            RETURN this { .title, actors: [ (this)<-[:ACTED_IN]-(this_actors:Person)   | this_actors { .name } ] } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Select movie and actor with custom labels using Relay connection", async () => {
        const query = gql`
            {
                movies {
                    title
                    actorsConnection {
                        edges {
                            node {
                                name
                            }
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
            "MATCH (this:Film)
            CALL {
            WITH this
            MATCH (this)<-[this_acted_in_relationship:ACTED_IN]-(this_actor:Person)
            WITH collect({ node: { name: this_actor.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS actorsConnection
            }
            RETURN this { .title, actorsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Create Movie with label Film", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ id: "1" }]) {
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
            "CALL {
            CREATE (this0:Film)
            SET this0.id = $this0_id
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT([ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ]) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .id } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\"
            }"
        `);
    });

    test("Create Movie and relation with custom labels", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        { id: 1, actors: { create: [{ node: { name: "actor 1" } }] } }
                        { id: 2, actors: { create: [{ node: { name: "actor 2" } }] } }
                    ]
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
            "CALL {
            CREATE (this0:Film)
            SET this0.id = $this0_id
            WITH this0, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_mutateMeta
            CREATE (this0_actors0_node:Person)
            SET this0_actors0_node.name = $this0_actors0_node_name
            MERGE (this0)<-[:ACTED_IN]-(this0_actors0_node)
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT(this0_mutateMeta + [ metaVal IN [{type: 'Created', name: 'Actor', id: id(this0_actors0_node), properties: this0_actors0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ]) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            CALL {
            CREATE (this1:Film)
            SET this1.id = $this1_id
            WITH this0, this1, [ metaVal IN [{type: 'Created', name: 'Movie', id: id(this1), properties: this1}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this1_mutateMeta
            CREATE (this1_actors0_node:Person)
            SET this1_actors0_node.name = $this1_actors0_node_name
            MERGE (this1)<-[:ACTED_IN]-(this1_actors0_node)
            RETURN this1, REDUCE(tmp1_this1_mutateMeta = [], tmp2_this1_mutateMeta IN COLLECT(this1_mutateMeta + [ metaVal IN [{type: 'Created', name: 'Actor', id: id(this1_actors0_node), properties: this1_actors0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ]) | tmp1_this1_mutateMeta + tmp2_this1_mutateMeta) as this1_mutateMeta
            }
            WITH this0, this1, mutateMeta + this1_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .id } AS this0, this1 { .id } AS this1"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_actors0_node_name\\": \\"actor 1\\",
                \\"this1_id\\": \\"2\\",
                \\"this1_actors0_node_name\\": \\"actor 2\\"
            }"
        `);
    });

    test("Update Movie with label film", async () => {
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
            "MATCH (this:Film)
            WHERE this.id = $this_id
            SET this.id = $this_update_id
            RETURN [ metaVal IN [{type: 'Updated', name: 'Movie', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta, this { .id } AS this"
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

    test("Update nested actors with custom label", async () => {
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
            "MATCH (this:Film)
            WHERE this.id = $this_id
            WITH this
            WITH this
            OPTIONAL MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Person)
            WHERE this_actors0.name = $updateMovies.args.update.actors[0].where.node.name
            CALL apoc.do.when(this_actors0 IS NOT NULL, \\"
            SET this_actors0.name = $this_update_actors0_name
            RETURN this, this_actors0, this_acted_in0_relationship, [ metaVal IN [{type: 'Updated', name: 'Actor', id: id(this_actors0), properties: $this_update_actors0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta
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

    test("Update connection in Movie with label film", async () => {
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
            "MATCH (this:Film)
            WHERE this.id = $this_id
            WITH this
            CALL {
            WITH this
            	OPTIONAL MATCH (this_connect_actors0_node:Person)
            	WHERE this_connect_actors0_node.name = $this_connect_actors0_node_name
            CALL apoc.do.when(this_connect_actors0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)<-[:ACTED_IN]-(this_connect_actors0_node)
            RETURN this, this_connect_actors0_node, [ metaVal IN [{type: 'Connected', name: 'Movie', relationshipName: 'ACTED_IN', toName: 'Actor', id: id(this), toID: id(this_connect_actors0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_connect_actors0_node_mutateMeta
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

    test("Update disconnect in Movie with label film", async () => {
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
            "MATCH (this:Film)
            WHERE this.id = $this_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_actors0_rel:ACTED_IN]-(this_disconnect_actors0:Person)
            WHERE this_disconnect_actors0.name = $updateMovies.args.disconnect.actors[0].where.node.name
            WITH this, this_disconnect_actors0, this_disconnect_actors0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Movie', toName: 'Actor', relationshipName: 'ACTED_IN', id: id(this), toID: id(this_disconnect_actors0), relationshipID: id(this_disconnect_actors0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_mutateMeta
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

    test("Delete Movie with custom label", async () => {
        const query = gql`
            mutation {
                deleteMovies(where: { id: "123" }) {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            WHERE this.id = $this_id
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"123\\"
            }"
        `);
    });

    test("Delete Movies and actors with custom labels", async () => {
        const query = gql`
            mutation {
                deleteMovies(where: { id: 123 }, delete: { actors: { where: { node: { name: "Actor to delete" } } } }) {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            WHERE this.id = $this_id
            WITH this
            OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:Person)
            WHERE this_actors0.name = $this_deleteMovies.args.delete.actors[0].where.node.name
            WITH this, this_actors0, collect(DISTINCT this_actors0) as this_actors0_to_delete, [ metaVal IN [{type: 'Deleted', name: 'Actor', id: id(this_actors0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta
            FOREACH(x IN this_actors0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"123\\",
                \\"this_deleteMovies\\": {
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
                        }
                    }
                }
            }"
        `);
    });

    test("Admin Deletes Post", async () => {
        const query = gql`
            mutation {
                deleteMovies(where: { actors: { name: "tom" } }) {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            WHERE EXISTS((this)<-[:ACTED_IN]-(:Person)) AND ANY(this_actors IN [(this)<-[:ACTED_IN]-(this_actors:Person) | this_actors] WHERE this_actors.name = $this_actors_name)
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_actors_name\\": \\"tom\\"
            }"
        `);
    });

    test("Count movies with custom label", async () => {
        const query = gql`
            {
                moviesCount
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            RETURN count(this)"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
