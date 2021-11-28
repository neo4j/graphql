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

describe("Cypher Auth Projection On Connections", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Post {
                content: String
                creator: User @relationship(type: "HAS_POST", direction: IN)
            }

            type User {
                id: ID
                name: String
                posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User @auth(rules: [{ allow: { id: "$jwt.sub" } }])
            extend type Post @auth(rules: [{ allow: { creator: { id: "$jwt.sub" } } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
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
            "MATCH (this:User)
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            WITH this
            MATCH (this)-[this_has_post_relationship:HAS_POST]->(this_post:Post)
            CALL apoc.util.validate(NOT(EXISTS((this_post)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_post)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH collect({ node: { content: this_post.content } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS postsConnection
            }
            RETURN this { .name, postsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_post_auth_allow0_creator_id\\": \\"super_admin\\",
                \\"this_auth_allow0_id\\": \\"super_admin\\"
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
            "MATCH (this:User)
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            WITH this
            MATCH (this)-[this_has_post_relationship:HAS_POST]->(this_post:Post)
            CALL apoc.util.validate(NOT(EXISTS((this_post)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_post)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            WITH this_post
            MATCH (this_post)<-[this_post_has_post_relationship:HAS_POST]-(this_post_user:User)
            CALL apoc.util.validate(NOT(this_post_user.id IS NOT NULL AND this_post_user.id = $this_post_user_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH collect({ node: { name: this_post_user.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS creatorConnection
            }
            WITH collect({ node: { content: this_post.content, creatorConnection: creatorConnection } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS postsConnection
            }
            RETURN this { .name, postsConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_post_auth_allow0_creator_id\\": \\"super_admin\\",
                \\"this_post_user_auth_allow0_id\\": \\"super_admin\\",
                \\"this_auth_allow0_id\\": \\"super_admin\\"
            }"
        `);
    });
});
