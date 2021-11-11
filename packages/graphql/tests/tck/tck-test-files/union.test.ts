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
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

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
                search: [Search] @relationship(type: "SEARCH", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Read Unions", async () => {
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

        const req = createJwtRequest("secret", { jwtAllowedNamesExample: ["Horror"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            RETURN this { search:  [this_search IN [(this)-[:SEARCH]->(this_search) WHERE (\\"Genre\\" IN labels(this_search)) OR (\\"Movie\\" IN labels(this_search)) | head( [ this_search IN [this_search] WHERE (\\"Genre\\" IN labels(this_search)) AND this_search.name = $this_search_Genre_name AND apoc.util.validatePredicate(NOT(this_search.name IS NOT NULL AND this_search.name = $this_search_Genre_auth_allow0_name), \\"@neo4j/graphql/FORBIDDEN\\", [0]) | this_search { __resolveType: \\"Genre\\",  .name } ] + [ this_search IN [this_search] WHERE (\\"Movie\\" IN labels(this_search)) AND this_search.title = $this_search_Movie_title | this_search { __resolveType: \\"Movie\\",  .title } ] ) ] WHERE this_search IS NOT NULL] [1..11]  } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"some title\\",
                \\"this_search_Genre_name\\": \\"Horror\\",
                \\"this_search_Genre_auth_allow0_name\\": [
                    \\"Horror\\"
                ],
                \\"this_search_Movie_title\\": \\"The Matrix\\"
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
            RETURN
            this0 { .title } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"some movie\\",
                \\"this0_search_Genre0_node_name\\": \\"some genre\\"
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
            "MATCH (this:Movie)
            CREATE (this_create_search_Genre0_node:Genre)
            SET this_create_search_Genre0_node.name = $this_create_search_Genre0_node_name
            MERGE (this)-[:SEARCH]->(this_create_search_Genre0_node)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_create_search_Genre0_node_name\\": \\"some genre\\"
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
            	WHERE this0_search_Genre_connect0_node.name = $this0_search_Genre_connect0_node_name
            	FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this0_search_Genre_connect0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:SEARCH]->(this0_search_Genre_connect0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN this0
            }
            RETURN
            this0 { .title } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"some movie\\",
                \\"this0_search_Genre_connect0_node_name\\": \\"some genre\\"
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            WITH this
            OPTIONAL MATCH (this)-[this_search0_relationship:SEARCH]->(this_search_Genre0:Genre)
            WHERE this_search_Genre0.name = $updateMovies.args.update.search.Genre[0].where.node.name
            CALL apoc.do.when(this_search_Genre0 IS NOT NULL, \\"
            SET this_search_Genre0.name = $this_update_search_Genre0_name
            RETURN count(*)
            \\", \\"\\", {this:this, updateMovies: $updateMovies, this_search_Genre0:this_search_Genre0, auth:$auth,this_update_search_Genre0_name:$this_update_search_Genre0_name})
            YIELD value as _
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"some movie\\",
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
                }
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_search_Genre0_disconnect0_rel:SEARCH]->(this_search_Genre0_disconnect0:Genre)
            WHERE this_search_Genre0_disconnect0.name = $updateMovies.args.update.search.Genre[0].disconnect[0].where.node.name
            FOREACH(_ IN CASE this_search_Genre0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_search_Genre0_disconnect0_rel
            )
            RETURN count(*)
            }
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"some movie\\",
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
                }
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_search_Genre0_rel:SEARCH]->(this_disconnect_search_Genre0:Genre)
            WHERE this_disconnect_search_Genre0.name = $updateMovies.args.disconnect.search.Genre[0].where.node.name
            FOREACH(_ IN CASE this_disconnect_search_Genre0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_search_Genre0_rel
            )
            RETURN count(*)
            }
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"some movie\\",
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
                }
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_search_Genre0_node:Genre)
            	WHERE this_connect_search_Genre0_node.name = $this_connect_search_Genre0_node_name
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_search_Genre0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:SEARCH]->(this_connect_search_Genre0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"some movie\\",
                \\"this_connect_search_Genre0_node_name\\": \\"some genre\\"
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
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            WITH this
            OPTIONAL MATCH (this)-[this_delete_search_Genre0_relationship:SEARCH]->(this_delete_search_Genre0:Genre)
            WHERE this_delete_search_Genre0.name = $updateMovies.args.delete.search.Genre[0].where.node.name
            WITH this, collect(DISTINCT this_delete_search_Genre0) as this_delete_search_Genre0_to_delete
            FOREACH(x IN this_delete_search_Genre0_to_delete | DETACH DELETE x)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"some movie\\",
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
                }
            }"
        `);
    });
});
