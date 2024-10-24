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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("QueryDirection in relationships (deprecated _DEFAULT/_ONLY options)", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    test("query with directed and undirected relationships with DEFAULT_UNDIRECTED", async () => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
                friends: [User!]!
                    @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DEFAULT_UNDIRECTED)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
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

    test("query with directed and undirected relationships with a DEFAULT_DIRECTED", async () => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DEFAULT_DIRECTED)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            CALL {
                WITH this
                MATCH (this)-[this0:FRIENDS_WITH]->(this1:User)
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var2
            }
            CALL {
                WITH this
                MATCH (this)-[this3:FRIENDS_WITH]-(this4:User)
                WITH this4 { .name } AS this4
                RETURN collect(this4) AS var5
            }
            RETURN this { .name, friends: var2, undirectedFriends: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("query with a DIRECTED_ONLY relationship", async () => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DIRECTED_ONLY)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
            query {
                users {
                    name
                    friends: friends {
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
                MATCH (this)-[this0:FRIENDS_WITH]->(this1:User)
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var2
            }
            RETURN this { .name, friends: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("query with a UNDIRECTED_ONLY relationship", async () => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
                friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: UNDIRECTED_ONLY)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
            query {
                users {
                    name
                    friends: friends {
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
            RETURN this { .name, friends: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
