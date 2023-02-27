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

describe("Cypher Auth Projection On Connections On Unions", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Post {
                content: String
                creator: User! @relationship(type: "HAS_POST", direction: IN)
            }

            type User {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "PUBLISHED", direction: OUT)
            }

            union Content = Post

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

    test("Two connection", async () => {
        const query = gql`
            {
                users {
                    contentConnection {
                        edges {
                            node {
                                ... on Post {
                                    content
                                    creatorConnection {
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
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WHERE apoc.util.validatePredicate(NOT ((this.id IS NOT NULL AND this.id = $param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this_connection_contentConnectionthis0:PUBLISHED]->(this_Post:\`Post\`)
                    WHERE apoc.util.validatePredicate(NOT ((exists((this_Post)<-[:HAS_POST]-(:\`User\`)) AND any(this_connection_contentConnectionthis1 IN [(this_Post)<-[:HAS_POST]-(this_connection_contentConnectionthis1:\`User\`) | this_connection_contentConnectionthis1] WHERE (this_connection_contentConnectionthis1.id IS NOT NULL AND this_connection_contentConnectionthis1.id = $this_connection_contentConnectionparam0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CALL {
                        WITH this_Post
                        MATCH (this_Post)<-[this_Post_connection_creatorConnectionthis0:HAS_POST]-(this_Post_User:\`User\`)
                        WHERE apoc.util.validatePredicate(NOT ((this_Post_User.id IS NOT NULL AND this_Post_User.id = $this_Post_connection_creatorConnectionparam0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH { node: { name: this_Post_User.name } } AS edge
                        WITH collect(edge) AS edges
                        WITH edges, size(edges) AS totalCount
                        RETURN { edges: edges, totalCount: totalCount } AS this_Post_creatorConnection
                    }
                    WITH { node: { __resolveType: \\"Post\\", __id: id(this_Post), content: this_Post.content, creatorConnection: this_Post_creatorConnection } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_contentConnection
            }
            RETURN this { contentConnection: this_contentConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"super_admin\\",
                \\"this_connection_contentConnectionparam0\\": \\"super_admin\\",
                \\"this_Post_connection_creatorConnectionparam0\\": \\"super_admin\\"
            }"
        `);
    });
});
