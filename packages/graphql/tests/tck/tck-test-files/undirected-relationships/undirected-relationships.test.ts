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
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Undirected relationships", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    test("query with directed and undirected relationships", async () => {
        typeDefs = gql`
            type User {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
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
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            CALL {
                WITH this
                MATCH (this)-[thisthis0:FRIENDS_WITH]-(this_friends:\`User\`)
                WITH this_friends { .name } AS this_friends
                RETURN collect(this_friends) AS this_friends
            }
            CALL {
                WITH this
                MATCH (this)-[thisthis1:FRIENDS_WITH]->(this_directedFriends:\`User\`)
                WITH this_directedFriends { .name } AS this_directedFriends
                RETURN collect(this_directedFriends) AS this_directedFriends
            }
            RETURN this { .name, friends: this_friends, directedFriends: this_directedFriends } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("undirected with unions", async () => {
        typeDefs = gql`
            union Content = Blog | Post

            type Blog {
                title: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            type Post {
                content: String
            }

            type User {
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
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
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[thisthis0:HAS_CONTENT]-(this_content:\`Blog\`)
                    WITH this_content  { __resolveType: \\"Blog\\",  .title } AS this_content
                    RETURN this_content AS this_content
            UNION
                    WITH this
                    MATCH (this)-[thisthis1:HAS_CONTENT]-(this_content:\`Post\`)
                    WITH this_content  { __resolveType: \\"Post\\",  .content } AS this_content
                    RETURN this_content AS this_content
                }
                WITH this_content
                RETURN collect(this_content) AS this_content
            }
            RETURN this { content: this_content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("undirected with interfaces", async () => {
        typeDefs = gql`
            interface Production {
                title: String!
                actors: [Actor!]!
            }

            type Movie implements Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                runtime: Int!
            }

            type Series implements Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                episodes: Int!
            }

            interface ActedIn @relationshipProperties {
                role: String!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
        const query = gql`
            query Actors {
                actors {
                    actedIn(directed: false) {
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
            "MATCH (this:\`Actor\`)
            WITH this
            CALL {
            WITH this
            CALL {
                WITH this
                MATCH (this)-[:ACTED_IN]-(this_Movie:Movie)
                RETURN { __resolveType: \\"Movie\\", title: this_Movie.title } AS actedIn
            UNION
                WITH this
                MATCH (this)-[:ACTED_IN]-(this_Series:Series)
                RETURN { __resolveType: \\"Series\\", title: this_Series.title } AS actedIn
            }
            RETURN collect(actedIn) AS actedIn
            }
            RETURN this { actedIn: actedIn } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("nested undirected relationship", async () => {
        typeDefs = gql`
            type Foo {
                id: ID @unique
                Name: String
                Age: Int
                DrinksAt: Bar @relationship(type: "DRINKS_AT", direction: OUT)
            }

            type Bar {
                id: ID @unique
                Adress: String
                Customers: [Foo!]! @relationship(type: "DRINKS_AT", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
        const query = gql`
            query Query {
                foos {
                    DrinksAt {
                        id
                        Customers(directed: false) {
                            Name
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Foo\`)
            CALL {
                WITH this
                MATCH (this)-[thisthis0:DRINKS_AT]->(this_DrinksAt:\`Bar\`)
                CALL {
                    WITH this_DrinksAt
                    MATCH (this_DrinksAt)-[thisthis1:DRINKS_AT]-(this_DrinksAt_Customers:\`Foo\`)
                    WITH this_DrinksAt_Customers { .Name } AS this_DrinksAt_Customers
                    RETURN collect(this_DrinksAt_Customers) AS this_DrinksAt_Customers
                }
                WITH this_DrinksAt { .id, Customers: this_DrinksAt_Customers } AS this_DrinksAt
                RETURN head(collect(this_DrinksAt)) AS this_DrinksAt
            }
            RETURN this { DrinksAt: this_DrinksAt } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
