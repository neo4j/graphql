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
import { Neo4jGraphQL } from "../../../../../../src";
import { createJwtRequest } from "../../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../../utils/tck-test-utils";

describe("Cypher Auth Projection On Connections On Unions", () => {
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
                content: [Content] @relationship(type: "PUBLISHED", direction: OUT)
            }

            union Content = Post

            extend type User @auth(rules: [{ allow: { id: "$jwt.sub" } }])
            extend type Post @auth(rules: [{ allow: { creator: { id: "$jwt.sub" } } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
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
            "MATCH (this:User)
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_published_relationship:PUBLISHED]->(this_Post:Post)
            CALL apoc.util.validate(NOT(EXISTS((this_Post)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_Post)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            WITH this_Post
            MATCH (this_Post)<-[this_Post_has_post_relationship:HAS_POST]-(this_Post_user:User)
            CALL apoc.util.validate(NOT(this_Post_user.id IS NOT NULL AND this_Post_user.id = $this_Post_user_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH collect({ node: { name: this_Post_user.name } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS creatorConnection
            }
            WITH { node: { __resolveType: \\"Post\\", content: this_Post.content, creatorConnection: creatorConnection } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: totalCount } AS contentConnection
            }
            RETURN this { contentConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_Post_user_auth_allow0_id\\": \\"super_admin\\",
                \\"this_Post_auth_allow0_creator_id\\": \\"super_admin\\",
                \\"this_auth_allow0_id\\": \\"super_admin\\"
            }"
        `);
    });
});
