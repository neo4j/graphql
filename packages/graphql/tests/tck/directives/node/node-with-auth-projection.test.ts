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

describe("Cypher Auth Projection On Connections", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Post @node(labels: ["Comment"]) {
                content: String
                creator: User! @relationship(type: "HAS_POST", direction: IN)
            }

            type User @node(labels: ["Person"]) {
                id: ID
                name: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User @auth(rules: [{ allow: { id: "$jwt.sub" } }])
            extend type Post @auth(rules: [{ allow: { creator: { id: "$jwt.sub" } } }])
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

    test("One connection", async () => {
        const query = gql`
            {
                users {
                    name
                    postsConnection {
                        edges {
                            node {
                                content
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Person\`)
            WHERE apoc.util.validatePredicate(NOT ((this.id IS NOT NULL AND this.id = $param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[this_connection_postsConnectionthis0:HAS_POST]->(this_Post:\`Comment\`)
                WHERE apoc.util.validatePredicate(NOT ((exists((this_Post)<-[:HAS_POST]-(:\`Person\`)) AND any(this_connection_postsConnectionthis1 IN [(this_Post)<-[:HAS_POST]-(this_connection_postsConnectionthis1:\`Person\`) | this_connection_postsConnectionthis1] WHERE (this_connection_postsConnectionthis1.id IS NOT NULL AND this_connection_postsConnectionthis1.id = $this_connection_postsConnectionparam0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH { node: { content: this_Post.content } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_postsConnection
            }
            RETURN this { .name, postsConnection: this_postsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"super_admin\\",
                \\"this_connection_postsConnectionparam0\\": \\"super_admin\\"
            }"
        `);
    });
});
