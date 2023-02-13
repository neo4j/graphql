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

describe("Label in Node directive", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor @node(labels: ["Person"]) {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie @node(labels: ["Film"]) {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

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
            "MATCH (this:\`Film\`)
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
            "MATCH (this:\`Film\`)
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this_actors:\`Person\`)
                WITH this_actors { .name } AS this_actors
                RETURN collect(this_actors) AS this_actors
            }
            RETURN this { .title, actors: this_actors } AS this"
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
            "MATCH (this:\`Film\`)
            CALL {
                WITH this
                MATCH (this)<-[this_connection_actorsConnectionthis0:ACTED_IN]-(this_Actor:\`Person\`)
                WITH { node: { name: this_Actor.name } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_actorsConnection
            }
            RETURN this { .title, actorsConnection: this_actorsConnection } AS this"
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
            "UNWIND $create_param0 AS create_var1
            CALL {
                WITH create_var1
                CREATE (create_this0:\`Film\`)
                SET
                    create_this0.id = create_var1.id
                RETURN create_this0
            }
            RETURN collect(create_this0 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\"
                    }
                ],
                \\"resolvedCallbacks\\": {}
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
            "UNWIND $create_param0 AS create_var1
            CALL {
                WITH create_var1
                CREATE (create_this0:\`Film\`)
                SET
                    create_this0.id = create_var1.id
                WITH create_this0, create_var1
                CALL {
                    WITH create_this0, create_var1
                    UNWIND create_var1.actors.create AS create_var2
                    WITH create_var2.node AS create_var3, create_var2.edge AS create_var4, create_this0
                    CREATE (create_this5:\`Person\`)
                    SET
                        create_this5.name = create_var3.name
                    MERGE (create_this0)<-[create_this6:ACTED_IN]-(create_this5)
                    RETURN collect(NULL) AS create_var7
                }
                RETURN create_this0
            }
            RETURN collect(create_this0 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
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
                                    \\"node\\": {
                                        \\"name\\": \\"actor 2\\"
                                    }
                                }
                            ]
                        }
                    }
                ],
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`Film\`)
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
            "MATCH (this:\`Film\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:\`Person\`)
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
            "MATCH (this:\`Film\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_actors0_node:\`Person\`)
            	WHERE this_connect_actors0_node.name = $this_connect_actors0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_actors0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_actors0_node
            			MERGE (this)<-[:ACTED_IN]-(this_connect_actors0_node)
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
            "MATCH (this:\`Film\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_actors0_rel:ACTED_IN]-(this_disconnect_actors0:\`Person\`)
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
            "MATCH (this:\`Film\`)
            WHERE this.id = $param0
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\"
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
            "MATCH (this:\`Film\`)
            WHERE this.id = $param0
            WITH this
            OPTIONAL MATCH (this)<-[this_actors0_relationship:ACTED_IN]-(this_actors0:\`Person\`)
            WHERE this_actors0.name = $this_deleteMovies_args_delete_actors0_where_this_actors0param0
            WITH this, collect(DISTINCT this_actors0) AS this_actors0_to_delete
            CALL {
            	WITH this_actors0_to_delete
            	UNWIND this_actors0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
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
                },
                \\"this_deleteMovies_args_delete_actors0_where_this_actors0param0\\": \\"Actor to delete\\"
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
            "MATCH (this:\`Film\`)
            WHERE EXISTS {
                MATCH (this)<-[:ACTED_IN]-(this0:\`Person\`)
                WHERE this0.name = $param0
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"tom\\"
            }"
        `);
    });
});
