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
import { Neo4jGraphQL } from "../../src";
import { createJwtRequest } from "../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";

describe("Cypher Union", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            union Search = Movie | Genre

            type Genre @auth(rules: [{ operations: [READ], allow: { name: "$jwt.jwtAllowedNamesExample" } }]) {
                name: String
            }

            type Movie {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
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

    test("Read Unions simple", async () => {
        const query = gql`
            {
                movies {
                    search {
                        ... on Movie {
                            title
                        }
                        ... on Genre {
                            name
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[thisthis0:SEARCH]->(this_search:\`Genre\`)
                    WHERE apoc.util.validatePredicate(NOT ((this_search.name IS NOT NULL AND this_search.name = $thisparam0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this_search  { __resolveType: \\"Genre\\",  .name } AS this_search
                    RETURN this_search AS this_search
                    UNION
                    WITH this
                    MATCH (this)-[thisthis1:SEARCH]->(this_search:\`Movie\`)
                    WITH this_search  { __resolveType: \\"Movie\\",  .title } AS this_search
                    RETURN this_search AS this_search
                }
                WITH this_search
                RETURN collect(this_search) AS this_search
            }
            RETURN this { search: this_search } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"thisparam0\\": \\"Horror\\"
            }"
        `);
    });

    test("Read Unions with missing types", async () => {
        const query = gql`
            {
                movies {
                    search {
                        ... on Genre {
                            name
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[thisthis0:SEARCH]->(this_search:\`Genre\`)
                    WHERE apoc.util.validatePredicate(NOT ((this_search.name IS NOT NULL AND this_search.name = $thisparam0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this_search  { __resolveType: \\"Genre\\",  .name } AS this_search
                    RETURN this_search AS this_search
                    UNION
                    WITH this
                    MATCH (this)-[thisthis1:SEARCH]->(this_search:\`Movie\`)
                    WITH this_search { __resolveType: \\"Movie\\" } AS this_search
                    RETURN this_search AS this_search
                }
                WITH this_search
                RETURN collect(this_search) AS this_search
            }
            RETURN this { search: this_search } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"thisparam0\\": \\"Horror\\"
            }"
        `);
    });

    test("Read Unions with filter and limit", async () => {
        const query = gql`
            {
                movies(where: { title: "some title" }) {
                    search(
                        where: { Movie: { title: "The Matrix" }, Genre: { name: "Horror" } }
                        options: { offset: 1, limit: 10 }
                    ) {
                        ... on Movie {
                            title
                        }
                        ... on Genre {
                            name
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.title = $param0
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[thisthis0:SEARCH]->(this_search:\`Genre\`)
                    WHERE (this_search.name = $thisparam0 AND apoc.util.validatePredicate(NOT ((this_search.name IS NOT NULL AND this_search.name = $thisparam1)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    WITH this_search  { __resolveType: \\"Genre\\",  .name } AS this_search
                    RETURN this_search AS this_search
                    UNION
                    WITH this
                    MATCH (this)-[thisthis1:SEARCH]->(this_search:\`Movie\`)
                    WHERE this_search.title = $thisparam2
                    WITH this_search  { __resolveType: \\"Movie\\",  .title } AS this_search
                    RETURN this_search AS this_search
                }
                WITH this_search
                SKIP 1
                LIMIT 10
                RETURN collect(this_search) AS this_search
            }
            RETURN this { search: this_search } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"thisparam0\\": \\"Horror\\",
                \\"thisparam1\\": \\"Horror\\",
                \\"thisparam2\\": \\"The Matrix\\"
            }"
        `);
    });

    test("Create Unions from create mutation", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [{ title: "some movie", search: { Genre: { create: [{ node: { name: "some genre" } }] } } }]
                ) {
                    movies {
                        title
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
            SET this0.title = $this0_title
            WITH this0
            CREATE (this0_search_Genre0_node:Genre)
            SET this0_search_Genre0_node.name = $this0_search_Genre0_node_name
            MERGE (this0)-[:SEARCH]->(this0_search_Genre0_node)
            RETURN this0
            }
            RETURN [
            this0 { .title }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"some movie\\",
                \\"this0_search_Genre0_node_name\\": \\"some genre\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Create Unions from update create(top-level)", async () => {
        const query = gql`
            mutation {
                updateMovies(create: { search: { Genre: [{ node: { name: "some genre" } }] } }) {
                    movies {
                        title
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
            CREATE (this_create_search_Genre0_node:Genre)
            SET this_create_search_Genre0_node.name = $this_create_search_Genre0_node_name
            MERGE (this)-[:SEARCH]->(this_create_search_Genre0_node)
            WITH *
            RETURN collect(DISTINCT this { .title }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_create_search_Genre0_node_name\\": \\"some genre\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect Unions (in create)", async () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            title: "some movie"
                            search: { Genre: { connect: [{ where: { node: { name: "some genre" } } }] } }
                        }
                    ]
                ) {
                    movies {
                        title
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
            SET this0.title = $this0_title
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_search_Genre_connect0_node:Genre)
            	WHERE this0_search_Genre_connect0_node.name = $this0_search_Genre_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_search_Genre_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		UNWIND parentNodes as this0
            		UNWIND connectedNodes as this0_search_Genre_connect0_node
            		MERGE (this0)-[:SEARCH]->(this0_search_Genre_connect0_node)
            		RETURN count(*)
            	}
            	RETURN count(*) AS connect_this0_search_Genre_connect_Genre
            }
            RETURN this0
            }
            RETURN [
            this0 { .title }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"some movie\\",
                \\"this0_search_Genre_connect0_node_param0\\": \\"some genre\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update Unions", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { title: "some movie" }
                    update: {
                        search: {
                            Genre: {
                                where: { node: { name: "some genre" } }
                                update: { node: { name: "some new genre" } }
                            }
                        }
                    }
                ) {
                    movies {
                        title
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
            WHERE this.title = $param0
            WITH this
            OPTIONAL MATCH (this)-[this_search0_relationship:SEARCH]->(this_search_Genre0:Genre)
            WHERE this_search_Genre0.name = $updateMovies_args_update_search_Genre0_where_Genreparam0
            CALL apoc.do.when(this_search_Genre0 IS NOT NULL, \\"
            SET this_search_Genre0.name = $this_update_search_Genre0_name
            RETURN count(*) AS _
            \\", \\"\\", {this:this, updateMovies: $updateMovies, this_search_Genre0:this_search_Genre0, auth:$auth,this_update_search_Genre0_name:$this_update_search_Genre0_name})
            YIELD value AS _
            RETURN collect(DISTINCT this { .title }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some movie\\",
                \\"updateMovies_args_update_search_Genre0_where_Genreparam0\\": \\"some genre\\",
                \\"this_update_search_Genre0_name\\": \\"some new genre\\",
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
                            \\"search\\": {
                                \\"Genre\\": [
                                    {
                                        \\"where\\": {
                                            \\"node\\": {
                                                \\"name\\": \\"some genre\\"
                                            }
                                        },
                                        \\"update\\": {
                                            \\"node\\": {
                                                \\"name\\": \\"some new genre\\"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Disconnect Unions (in update)", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { title: "some movie" }
                    update: { search: { Genre: { disconnect: [{ where: { node: { name: "some genre" } } }] } } }
                ) {
                    movies {
                        title
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
            WHERE this.title = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_search_Genre0_disconnect0_rel:SEARCH]->(this_search_Genre0_disconnect0:Genre)
            WHERE this_search_Genre0_disconnect0.name = $updateMovies_args_update_search_Genre0_disconnect0_where_Genreparam0
            CALL {
            	WITH this_search_Genre0_disconnect0, this_search_Genre0_disconnect0_rel
            	WITH collect(this_search_Genre0_disconnect0) as this_search_Genre0_disconnect0, this_search_Genre0_disconnect0_rel
            	UNWIND this_search_Genre0_disconnect0 as x
            	DELETE this_search_Genre0_disconnect0_rel
            }
            RETURN count(*) AS disconnect_this_search_Genre0_disconnect_Genre
            }
            RETURN collect(DISTINCT this { .title }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some movie\\",
                \\"updateMovies_args_update_search_Genre0_disconnect0_where_Genreparam0\\": \\"some genre\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"search\\": {
                                \\"Genre\\": [
                                    {
                                        \\"disconnect\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"name\\": \\"some genre\\"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Disconnect Unions", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { title: "some movie" }
                    disconnect: { search: { Genre: { where: { node: { name: "some genre" } } } } }
                ) {
                    movies {
                        title
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
            WHERE this.title = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_search_Genre0_rel:SEARCH]->(this_disconnect_search_Genre0:Genre)
            WHERE this_disconnect_search_Genre0.name = $updateMovies_args_disconnect_search_Genre0_where_Genreparam0
            CALL {
            	WITH this_disconnect_search_Genre0, this_disconnect_search_Genre0_rel
            	WITH collect(this_disconnect_search_Genre0) as this_disconnect_search_Genre0, this_disconnect_search_Genre0_rel
            	UNWIND this_disconnect_search_Genre0 as x
            	DELETE this_disconnect_search_Genre0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_search_Genre_Genre
            }
            WITH *
            RETURN collect(DISTINCT this { .title }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some movie\\",
                \\"updateMovies_args_disconnect_search_Genre0_where_Genreparam0\\": \\"some genre\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"search\\": {
                                \\"Genre\\": [
                                    {
                                        \\"where\\": {
                                            \\"node\\": {
                                                \\"name\\": \\"some genre\\"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect Unions (in update)", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { title: "some movie" }
                    connect: { search: { Genre: { where: { node: { name: "some genre" } } } } }
                ) {
                    movies {
                        title
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
            WHERE this.title = $param0
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_search_Genre0_node:Genre)
            	WHERE this_connect_search_Genre0_node.name = $this_connect_search_Genre0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_search_Genre0_node) as connectedNodes, collect(this) as parentNodes
            		UNWIND parentNodes as this
            		UNWIND connectedNodes as this_connect_search_Genre0_node
            		MERGE (this)-[:SEARCH]->(this_connect_search_Genre0_node)
            		RETURN count(*)
            	}
            	RETURN count(*) AS connect_this_connect_search_Genre_Genre
            }
            WITH *
            RETURN collect(DISTINCT this { .title }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some movie\\",
                \\"this_connect_search_Genre0_node_param0\\": \\"some genre\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Delete Unions (from update)", async () => {
        const query = gql`
            mutation {
                updateMovies(
                    where: { title: "some movie" }
                    delete: { search: { Genre: { where: { node: { name: "some genre" } } } } }
                ) {
                    movies {
                        title
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
            WHERE this.title = $param0
            WITH this
            OPTIONAL MATCH (this)-[this_delete_search_Genre0_relationship:SEARCH]->(this_delete_search_Genre0:Genre)
            WHERE this_delete_search_Genre0.name = $updateMovies_args_delete_search_Genre0_where_Genreparam0
            WITH this, collect(DISTINCT this_delete_search_Genre0) as this_delete_search_Genre0_to_delete
            CALL {
            	WITH this_delete_search_Genre0_to_delete
            	UNWIND this_delete_search_Genre0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(x)
            }
            WITH *
            RETURN collect(DISTINCT this { .title }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some movie\\",
                \\"updateMovies_args_delete_search_Genre0_where_Genreparam0\\": \\"some genre\\",
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"search\\": {
                                \\"Genre\\": [
                                    {
                                        \\"where\\": {
                                            \\"node\\": {
                                                \\"name\\": \\"some genre\\"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
