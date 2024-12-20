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

describe("Label in Node directive", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
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
        });
    });

    test("Select Movie with label Film", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Select movie and actor with custom labels", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var2
            }
            RETURN this { .title, actors: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Select movie and actor with custom labels using Relay connection", async () => {
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            CALL {
                WITH this
                MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ node: { name: this1.name, __resolveType: \\"Actor\\" } }) AS var2
                }
                RETURN { edges: var2, totalCount: totalCount } AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Create Movie with label Film", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ id: "1" }]) {
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
                CREATE (create_this1:Film)
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
                    }
                ]
            }"
        `);
    });

    test("Create Movie and relation with custom labels", async () => {
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Film)
                SET
                    create_this1.id = create_var0.id
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.actors.create AS create_var2
                    CREATE (create_this3:Person)
                    SET
                        create_this3.name = create_var2.node.name
                    MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                    RETURN collect(NULL) AS create_var5
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
                ]
            }"
        `);
    });

    test("Update Movie with label film", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(where: { id_EQ: "1" }, update: { id_SET: "2" }) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            WHERE this.id = $param0
            SET this.id = $this_update_id_SET
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"this_update_id_SET\\": \\"2\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update nested actors with custom label", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id_EQ: "1" }
                    update: {
                        actors: [
                            { where: { node: { name_EQ: "old name" } }, update: { node: { name_SET: "new name" } } }
                        ]
                    }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_acted_in0_relationship:ACTED_IN]-(this_actors0:Person)
            	WHERE this_actors0.name = $updateMovies_args_update_actors0_where_this_actors0param0
            	SET this_actors0.name = $this_update_actors0_name_SET
            	RETURN count(*) AS update_this_actors0
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"updateMovies_args_update_actors0_where_this_actors0param0\\": \\"old name\\",
                \\"this_update_actors0_name_SET\\": \\"new name\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name_EQ\\": \\"old name\\"
                                        }
                                    },
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"name_SET\\": \\"new name\\"
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
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id_EQ: "1" }
                    update: { actors: { connect: [{ where: { node: { name_EQ: "Daniel" } } }] } }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            WHERE this.id = $param0
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_actors0_connect0_node:Person)
            	WHERE this_actors0_connect0_node.name = $this_actors0_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_actors0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_actors0_connect0_node
            			MERGE (this)<-[:ACTED_IN]-(this_actors0_connect0_node)
            		}
            	}
            WITH this, this_actors0_connect0_node
            	RETURN count(*) AS connect_this_actors0_connect_Actor0
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"this_actors0_connect0_node_param0\\": \\"Daniel\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update disconnect in Movie with label film", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id_EQ: "1" }
                    update: { actors: { disconnect: [{ where: { node: { name_EQ: "Daniel" } } }] } }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            WHERE this.id = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_actors0_disconnect0_rel:ACTED_IN]-(this_actors0_disconnect0:Person)
            WHERE this_actors0_disconnect0.name = $updateMovies_args_update_actors0_disconnect0_where_Actor_this_actors0_disconnect0param0
            CALL {
            	WITH this_actors0_disconnect0, this_actors0_disconnect0_rel, this
            	WITH collect(this_actors0_disconnect0) as this_actors0_disconnect0, this_actors0_disconnect0_rel, this
            	UNWIND this_actors0_disconnect0 as x
            	DELETE this_actors0_disconnect0_rel
            }
            RETURN count(*) AS disconnect_this_actors0_disconnect_Actor
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"updateMovies_args_update_actors0_disconnect0_where_Actor_this_actors0_disconnect0param0\\": \\"Daniel\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"actors\\": [
                                {
                                    \\"disconnect\\": [
                                        {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"name_EQ\\": \\"Daniel\\"
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

    test("Delete Movie with custom label", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteMovies(where: { id_EQ: "123" }) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
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
        const query = /* GraphQL */ `
            mutation {
                deleteMovies(
                    where: { id_EQ: 123 }
                    delete: { actors: { where: { node: { name_EQ: "Actor to delete" } } } }
                ) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            WHERE this.id = $param0
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                WHERE this1.name = $param1
                WITH this0, collect(DISTINCT this1) AS var2
                CALL {
                    WITH var2
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"param1\\": \\"Actor to delete\\"
            }"
        `);
    });

    test("Admin Deletes Post", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteMovies(where: { actors_SOME: { name_EQ: "tom" } }) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            WHERE EXISTS {
                MATCH (this)<-[:ACTED_IN]-(this0:Person)
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
