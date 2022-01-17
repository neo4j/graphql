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
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Undirected relationships", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    test("query with directed and undirected relationships", async () => {
        typeDefs = gql`
            type User {
                name: String!
                friends: [User!] @relationship(type: "FRIENDS_WITH", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { jwt: { secret } }
        });
        const query = gql`
            query {
                users {
                    name
                    friends: friends(directed: false) {
                        name
                    }
                    directedFriends: friends {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
"MATCH (this:User)
RETURN this { .name, friends: [ (this)-[:FRIENDS_WITH]-(this_friends:User)   | this_friends { .name } ], directedFriends: [ (this)-[:FRIENDS_WITH]->(this_directedFriends:User)   | this_directedFriends { .name } ] } as this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("undirected with unions", async () => {
        typeDefs = gql`
            union Content = Blog | Post

            type Blog {
                title: String
                posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
            }

            type Post {
                content: String
            }

            type User {
                name: String
                content: [Content] @relationship(type: "HAS_CONTENT", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { jwt: { secret } }
        });
        const query = gql`
            query Users {
                users {
                    content(directed: false) {
                        ... on Blog {
                            title
                        }
                        ... on Post {
                            content
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
"MATCH (this:User)
RETURN this { content:  [this_content IN [(this)-[:HAS_CONTENT]-(this_content) WHERE (\\"Blog\\" IN labels(this_content)) OR (\\"Post\\" IN labels(this_content)) | head( [ this_content IN [this_content] WHERE (\\"Blog\\" IN labels(this_content)) | this_content { __resolveType: \\"Blog\\",  .title } ] + [ this_content IN [this_content] WHERE (\\"Post\\" IN labels(this_content)) | this_content { __resolveType: \\"Post\\",  .content } ] ) ] WHERE this_content IS NOT NULL]  } as this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
