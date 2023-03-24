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
            type Post {
                content: String
                creator: User! @relationship(type: "HAS_POST", direction: IN)
            }

            type User {
                id: ID
                name: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User @auth(rules: [{ allow: { id: "$jwt.sub" } }])
            extend type Post @auth(rules: [{ allow: { creator: { id: "$jwt.sub" } } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
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
            "MATCH (this:\`User\`)
            WHERE apoc.util.validatePredicate(NOT ((this.id IS NOT NULL AND this.id = $param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[this0:\`HAS_POST\`]->(this1:\`Post\`)
                WHERE apoc.util.validatePredicate(NOT ((exists((this1)<-[:\`HAS_POST\`]-(:\`User\`)) AND any(this2 IN [(this1)<-[:\`HAS_POST\`]-(this2:\`User\`) | this2] WHERE (this2.id IS NOT NULL AND this2.id = $param1)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH { node: { content: this1.content } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            RETURN this { .name, postsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"super_admin\\",
                \\"param1\\": \\"super_admin\\"
            }"
        `);
    });

    test("Two connection", async () => {
        const query = gql`
            {
                users {
                    name
                    postsConnection {
                        edges {
                            node {
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
                MATCH (this)-[this0:\`HAS_POST\`]->(this1:\`Post\`)
                WHERE apoc.util.validatePredicate(NOT ((exists((this1)<-[:\`HAS_POST\`]-(:\`User\`)) AND any(this2 IN [(this1)<-[:\`HAS_POST\`]-(this2:\`User\`) | this2] WHERE (this2.id IS NOT NULL AND this2.id = $param1)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH this1
                    MATCH (this1:\`Post\`)<-[this3:\`HAS_POST\`]-(this4:\`User\`)
                    WHERE apoc.util.validatePredicate(NOT ((this4.id IS NOT NULL AND this4.id = $param2)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH { node: { name: this4.name } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var5
                }
                WITH { node: { content: this1.content, creatorConnection: var5 } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var6
            }
            RETURN this { .name, postsConnection: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"super_admin\\",
                \\"param1\\": \\"super_admin\\",
                \\"param2\\": \\"super_admin\\"
            }"
        `);
    });
});
