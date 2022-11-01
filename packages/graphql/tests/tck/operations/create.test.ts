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

describe("Cypher Create", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Simple Create", async () => {
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
                CREATE (create_this0:\`Movie\`)
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

    test("Simple Multi Create", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ id: "1" }, { id: "2" }]) {
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
                CREATE (create_this0:\`Movie\`)
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
                    },
                    {
                        \\"id\\": \\"2\\"
                    }
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Two Level Nested create", async () => {
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
                CREATE (create_this0:\`Movie\`)
                SET
                    create_this0.id = create_var1.id
                WITH create_this0, create_var1
                CALL {
                    WITH create_this0, create_var1
                    UNWIND create_var1.actors.create AS create_var2
                    WITH create_var2.node AS create_var3, create_var2.edge AS create_var4, create_this0
                    CREATE (create_this5:\`Actor\`)
                    SET
                        create_this5.name = create_var3.name
                    MERGE (create_this5)-[create_this6:ACTED_IN]->(create_this0)
                    RETURN collect(NULL)
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

    test("Three Level Nested create", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            id: "1"
                            actors: {
                                create: [{ node: { name: "actor 1", movies: { create: [{ node: { id: "10" } }] } } }]
                            }
                        }
                        {
                            id: "2"
                            actors: {
                                create: [{ node: { name: "actor 2", movies: { create: [{ node: { id: "20" } }] } } }]
                            }
                        }
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
                CREATE (create_this0:\`Movie\`)
                SET
                    create_this0.id = create_var1.id
                WITH create_this0, create_var1
                CALL {
                    WITH create_this0, create_var1
                    UNWIND create_var1.actors.create AS create_var2
                    WITH create_var2.node AS create_var3, create_var2.edge AS create_var4, create_this0
                    CREATE (create_this5:\`Actor\`)
                    SET
                        create_this5.name = create_var3.name
                    MERGE (create_this5)-[create_this6:ACTED_IN]->(create_this0)
                    WITH create_this5, create_var3
                    CALL {
                        WITH create_this5, create_var3
                        UNWIND create_var3.movies.create AS create_var7
                        WITH create_var7.node AS create_var8, create_var7.edge AS create_var9, create_this5
                        CREATE (create_this10:\`Movie\`)
                        SET
                            create_this10.id = create_var8.id
                        MERGE (create_this5)-[create_this11:ACTED_IN]->(create_this10)
                        RETURN collect(NULL)
                    }
                    RETURN collect(NULL)
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
                                        \\"name\\": \\"actor 1\\",
                                        \\"movies\\": {
                                            \\"create\\": [
                                                {
                                                    \\"node\\": {
                                                        \\"id\\": \\"10\\"
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
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"name\\": \\"actor 2\\",
                                        \\"movies\\": {
                                            \\"create\\": [
                                                {
                                                    \\"node\\": {
                                                        \\"id\\": \\"20\\"
                                                    }
                                                }
                                            ]
                                        }
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

    test("Simple create and connect", async () => {
        const query = gql`
            mutation {
                createMovies(input: [{ id: 1, actors: { connect: [{ where: { node: { name: "Dan" } } }] } }]) {
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
            CREATE (this0:Movie)
            SET this0.id = $this0_id
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_actors_connect0_node:Actor)
            	WHERE this0_actors_connect0_node.name = $this0_actors_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_actors_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		UNWIND parentNodes as this0
            		UNWIND connectedNodes as this0_actors_connect0_node
            		MERGE (this0)<-[:ACTED_IN]-(this0_actors_connect0_node)
            		RETURN count(*) AS _
            	}
            	RETURN count(*) AS connect_this0_actors_connect_Actor
            }
            RETURN this0
            }
            RETURN [
            this0 { .id }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_actors_connect0_node_param0\\": \\"Dan\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Simple create -> relationship field -> connection(where)", async () => {
        const query = gql`
            mutation {
                createActors(input: { name: "Dan", movies: { connect: { where: { node: { id: 1 } } } } }) {
                    actors {
                        name
                        movies {
                            actorsConnection(where: { node: { name: "Dan" } }) {
                                totalCount
                                edges {
                                    node {
                                        name
                                    }
                                }
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
            "CALL {
            CREATE (this0:Actor)
            SET this0.name = $this0_name
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_movies_connect0_node:Movie)
            	WHERE this0_movies_connect0_node.id = $this0_movies_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_movies_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		UNWIND parentNodes as this0
            		UNWIND connectedNodes as this0_movies_connect0_node
            		MERGE (this0)-[:ACTED_IN]->(this0_movies_connect0_node)
            		RETURN count(*) AS _
            	}
            	RETURN count(*) AS connect_this0_movies_connect_Movie
            }
            RETURN this0
            }
            CALL {
                WITH this0
                MATCH (this0)-[create_this0:ACTED_IN]->(this0_movies:\`Movie\`)
                CALL {
                    WITH this0_movies
                    MATCH (this0_movies)<-[this0_movies_connection_actorsConnectionthis0:ACTED_IN]-(this0_movies_Actor:\`Actor\`)
                    WHERE this0_movies_Actor.name = $projection_movies_connection_actorsConnectionparam0
                    WITH { node: { name: this0_movies_Actor.name } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS this0_movies_actorsConnection
                }
                WITH this0_movies { actorsConnection: this0_movies_actorsConnection } AS this0_movies
                RETURN collect(this0_movies) AS this0_movies
            }
            RETURN [
            this0 { .name, movies: this0_movies }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"Dan\\",
                \\"this0_movies_connect0_node_param0\\": \\"1\\",
                \\"projection_movies_connection_actorsConnectionparam0\\": \\"Dan\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
