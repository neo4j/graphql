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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Undirected relationships", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    test("query with directed and undirected relationships", async () => {
        typeDefs = /* GraphQL */ `
            type User {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            CALL {
                WITH this
                MATCH (this)-[this0:FRIENDS_WITH]-(this1:User)
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var2
            }
            CALL {
                WITH this
                MATCH (this)-[this3:FRIENDS_WITH]->(this4:User)
                WITH this4 { .name } AS this4
                RETURN collect(this4) AS var5
            }
            RETURN this { .name, friends: var2, directedFriends: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("undirected with unions", async () => {
        typeDefs = /* GraphQL */ `
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
        });
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:HAS_CONTENT]-(this1:Blog)
                    WITH this1 { .title, __resolveType: \\"Blog\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:HAS_CONTENT]-(this4:Post)
                    WITH this4 { .content, __resolveType: \\"Post\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { content: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("undirected with interfaces", async () => {
        typeDefs = /* GraphQL */ `
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

            type ActedIn @relationshipProperties {
                role: String!
            }

            type Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
            query Actors {
                actors {
                    actedIn(directed: false) {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:ACTED_IN]-(this1:Movie)
                    WITH this1 { .title, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:ACTED_IN]-(this4:Series)
                    WITH this4 { .title, __resolveType: \\"Series\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("nested undirected relationship", async () => {
        typeDefs = /* GraphQL */ `
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
        });
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Foo)
            CALL {
                WITH this
                MATCH (this)-[this0:DRINKS_AT]->(this1:Bar)
                CALL {
                    WITH this1
                    MATCH (this1)-[this2:DRINKS_AT]-(this3:Foo)
                    WITH this3 { .Name } AS this3
                    RETURN collect(this3) AS var4
                }
                WITH this1 { .id, Customers: var4 } AS this1
                RETURN head(collect(this1)) AS var5
            }
            RETURN this { DrinksAt: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
