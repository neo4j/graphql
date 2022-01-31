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
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("QueryDirection in relationships", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neo4jgraphql: Neo4jGraphQL;

    test("query with directed and undirected relationships with DEFAULT_UNDIRECTED", async () => {
        typeDefs = gql`
            type User {
                name: String!
                friends: [User!]!
                    @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DEFAULT_UNDIRECTED)
            }
        `;

        neo4jgraphql = new Neo4jGraphQL({
            typeDefs,
            config: { jwt: { secret } },
        });
        const query = gql`
            query {
                users {
                    name
                    friends: friends {
                        name
                    }
                    directedFriends: friends(directed: true) {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
"MATCH (this:User)
RETURN this { .name, friends: [ (this)-[:FRIENDS_WITH]-(this_friends:User)   | this_friends { .name } ], directedFriends: [ (this)-[:FRIENDS_WITH]->(this_directedFriends:User)   | this_directedFriends { .name } ] } as this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("query with directed and undirected relationships with a DEFAULT_DIRECTED", async () => {
        typeDefs = gql`
            type User {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DEFAULT_DIRECTED)
            }
        `;

        neo4jgraphql = new Neo4jGraphQL({
            typeDefs,
            config: { jwt: { secret } },
        });
        const query = gql`
            query {
                users {
                    name
                    friends: friends {
                        name
                    }
                    undirectedFriends: friends(directed: false) {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
"MATCH (this:User)
RETURN this { .name, friends: [ (this)-[:FRIENDS_WITH]->(this_friends:User)   | this_friends { .name } ], undirectedFriends: [ (this)-[:FRIENDS_WITH]-(this_undirectedFriends:User)   | this_undirectedFriends { .name } ] } as this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("query with a DIRECTED_ONLY relationship", async () => {
        typeDefs = gql`
            type User {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DIRECTED_ONLY)
            }
        `;

        neo4jgraphql = new Neo4jGraphQL({
            typeDefs,
            config: { jwt: { secret } },
        });
        const query = gql`
            query {
                users {
                    name
                    friends: friends {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
"MATCH (this:User)
RETURN this { .name, friends: [ (this)-[:FRIENDS_WITH]->(this_friends:User)   | this_friends { .name } ] } as this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
    test("query with a UNDIRECTED_ONLY relationship", async () => {
        typeDefs = gql`
            type User {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: UNDIRECTED_ONLY)
            }
        `;

        neo4jgraphql = new Neo4jGraphQL({
            typeDefs,
            config: { jwt: { secret } },
        });
        const query = gql`
            query {
                users {
                    name
                    friends: friends {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
"MATCH (this:User)
RETURN this { .name, friends: [ (this)-[:FRIENDS_WITH]-(this_friends:User)   | this_friends { .name } ] } as this"
`);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
