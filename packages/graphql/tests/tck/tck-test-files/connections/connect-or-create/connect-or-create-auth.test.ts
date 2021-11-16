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

describe("Create or connect", () => {
    const secret = "secret";
    let neoSchema: Neo4jGraphQL;

    function createTypedef(operations: string): DocumentNode {
        return gql`
        type Movie {
            title: String
            genres: [Genre] @relationship(type: "IN_GENRE", direction: OUT)
        }

        type Genre @auth(rules: [{ operations: ${operations}, roles: ["admin"] }]) {
            name: String @unique
        }
        `;
    }

    test("Create with createOrConnect operation and CONNECT operation rule", async () => {
        neoSchema = new Neo4jGraphQL({
            typeDefs: createTypedef("[CONNECT]"),
            config: { enableRegex: true, jwt: { secret } },
        });

        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            title: "Cool Movie"
                            genres: {
                                connectOrCreate: [
                                    { where: { node: { name: "Horror" } }, onCreate: { node: { name: "Horror" } } }
                                ]
                            }
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
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            MERGE (this0_genres_connectOrCreate0:Genre { name: $this0_genres_connectOrCreate0_node_name })
            ON CREATE SET
            this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate0_on_create_name
            MERGE (this0)-[this0_relationship_this0_genres_connectOrCreate0:IN_GENRE]->(this0_genres_connectOrCreate0)
            RETURN this0
            }
            RETURN
            this0 { .title } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Cool Movie\\",
                \\"this0_genres_connectOrCreate0_node_name\\": \\"Horror\\",
                \\"this0_genres_connectOrCreate0_on_create_name\\": \\"Horror\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                }
            }"
        `);
    });

    test("Create with createOrConnect operation and CREATE operation rule", async () => {
        neoSchema = new Neo4jGraphQL({
            typeDefs: createTypedef("[CREATE]"),
            config: { enableRegex: true, jwt: { secret } },
        });

        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            title: "Cool Movie"
                            genres: {
                                connectOrCreate: [
                                    { where: { node: { name: "Horror" } }, onCreate: { node: { name: "Horror" } } }
                                ]
                            }
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
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            MERGE (this0_genres_connectOrCreate0:Genre { name: $this0_genres_connectOrCreate0_node_name })
            ON CREATE SET
            this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate0_on_create_name
            MERGE (this0)-[this0_relationship_this0_genres_connectOrCreate0:IN_GENRE]->(this0_genres_connectOrCreate0)
            RETURN this0
            }
            RETURN
            this0 { .title } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_title\\": \\"Cool Movie\\",
                \\"this0_genres_connectOrCreate0_node_name\\": \\"Horror\\",
                \\"this0_genres_connectOrCreate0_on_create_name\\": \\"Horror\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                }
            }"
        `);
    });
});
