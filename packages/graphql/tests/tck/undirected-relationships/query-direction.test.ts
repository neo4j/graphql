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

describe("queryDirection in relationships", () => {
    describe("DIRECTED", () => {
        let neoSchema: Neo4jGraphQL;

        beforeAll(() => {
            const typeDefs = /* GraphQL */ `
                type User @node {
                    name: String!
                    friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: DIRECTED)
                }
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
        });

        test("query", async () => {
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
                "CYPHER 5
                MATCH (this:User)
                CALL (this) {
                    MATCH (this)-[this0:FRIENDS_WITH]->(this1:User)
                    WITH DISTINCT this1
                    WITH this1 { .name } AS this1
                    RETURN collect(this1) AS var2
                }
                RETURN this { .name, friends: var2 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("query with filter", async () => {
            const query = /* GraphQL */ `
                query {
                    users(where: { friends: { some: { name: { eq: "John Smith" } } } }) {
                        name
                        friends {
                            name
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]->(this0:User)
                    WHERE this0.name = $param0
                }
                CALL (this) {
                    MATCH (this)-[this1:FRIENDS_WITH]->(this2:User)
                    WITH DISTINCT this2
                    WITH this2 { .name } AS this2
                    RETURN collect(this2) AS var3
                }
                RETURN this { .name, friends: var3 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\"
                }"
            `);
        });

        test("disconnect", async () => {
            const query = /* GraphQL */ `
                mutation {
                    updateUsers(
                        where: { friends: { some: { name: { eq: "John Smith" } } } }
                        update: { friends: { disconnect: { where: { node: { name: { eq: "Jane Smith" } } } } } }
                    ) {
                        users {
                            name
                            friends {
                                name
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:User)
                WITH *
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]->(this0:User)
                    WHERE this0.name = $param0
                }
                WITH *
                CALL (*) {
                    CALL (this) {
                        OPTIONAL MATCH (this)-[this1:FRIENDS_WITH]->(this2:User)
                        WHERE this2.name = $param1
                        WITH *
                        DELETE this1
                    }
                }
                WITH this
                CALL (this) {
                    MATCH (this)-[this3:FRIENDS_WITH]->(this4:User)
                    WITH DISTINCT this4
                    WITH this4 { .name } AS this4
                    RETURN collect(this4) AS var5
                }
                RETURN this { .name, friends: var5 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"param1\\": \\"Jane Smith\\"
                }"
            `);
        });

        test("update with nested delete", async () => {
            const query = /* GraphQL */ `
                mutation {
                    updateUsers(
                        where: { friends: { some: { name: { eq: "John Smith" } } } }
                        update: { friends: { delete: { where: { node: { name: { eq: "Jane Smith" } } } } } }
                    ) {
                        users {
                            name
                            friends {
                                name
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:User)
                WITH *
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]->(this0:User)
                    WHERE this0.name = $param0
                }
                WITH *
                CALL (*) {
                    OPTIONAL MATCH (this)-[this1:FRIENDS_WITH]->(this2:User)
                    WHERE this2.name = $param1
                    WITH this1, collect(DISTINCT this2) AS var3
                    CALL (var3) {
                        UNWIND var3 AS var4
                        DETACH DELETE var4
                    }
                }
                WITH this
                CALL (this) {
                    MATCH (this)-[this5:FRIENDS_WITH]->(this6:User)
                    WITH DISTINCT this6
                    WITH this6 { .name } AS this6
                    RETURN collect(this6) AS var7
                }
                RETURN this { .name, friends: var7 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"param1\\": \\"Jane Smith\\"
                }"
            `);
        });

        test("update", async () => {
            const query = /* GraphQL */ `
                mutation {
                    updateUsers(
                        where: { friends: { some: { name: { eq: "John Smith" } } } }
                        update: {
                            friends: {
                                update: {
                                    where: { node: { name: { eq: "Jane Smith" } } }
                                    node: { name_SET: "Janet Smith" }
                                }
                            }
                        }
                    ) {
                        users {
                            name
                            friends {
                                name
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:User)
                WITH *
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]->(this0:User)
                    WHERE this0.name = $param0
                }
                WITH *
                CALL (*) {
                    MATCH (this)-[this1:FRIENDS_WITH]->(this2:User)
                    WITH *
                    WHERE this2.name = $param1
                    SET
                        this2.name = $param2
                }
                WITH this
                CALL (this) {
                    MATCH (this)-[this3:FRIENDS_WITH]->(this4:User)
                    WITH DISTINCT this4
                    WITH this4 { .name } AS this4
                    RETURN collect(this4) AS var5
                }
                RETURN this { .name, friends: var5 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"param1\\": \\"Jane Smith\\",
                    \\"param2\\": \\"Janet Smith\\"
                }"
            `);
        });

        test("delete with nested delete", async () => {
            const query = /* GraphQL */ `
                mutation {
                    deleteUsers(
                        where: { friends: { some: { name: { eq: "John Smith" } } } }
                        delete: { friends: { where: { node: { name: { eq: "Jane Smith" } } } } }
                    ) {
                        nodesDeleted
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]->(this0:User)
                    WHERE this0.name = $param0
                }
                WITH *
                CALL (*) {
                    OPTIONAL MATCH (this)-[this1:FRIENDS_WITH]->(this2:User)
                    WHERE this2.name = $param1
                    WITH this1, collect(DISTINCT this2) AS var3
                    CALL (var3) {
                        UNWIND var3 AS var4
                        DETACH DELETE var4
                    }
                }
                WITH *
                DETACH DELETE this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"param1\\": \\"Jane Smith\\"
                }"
            `);
        });
    });

    describe("UNDIRECTED", () => {
        let neoSchema: Neo4jGraphQL;

        beforeAll(() => {
            const typeDefs = /* GraphQL */ `
                type User @node {
                    name: String!
                    friends: [User!]! @relationship(type: "FRIENDS_WITH", direction: OUT, queryDirection: UNDIRECTED)
                }
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
        });

        test("query", async () => {
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
                "CYPHER 5
                MATCH (this:User)
                CALL (this) {
                    MATCH (this)-[this0:FRIENDS_WITH]-(this1:User)
                    WITH DISTINCT this1
                    WITH this1 { .name } AS this1
                    RETURN collect(this1) AS var2
                }
                RETURN this { .name, friends: var2 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("query with filter", async () => {
            const query = /* GraphQL */ `
                query {
                    users(where: { friends: { some: { name: { eq: "John Smith" } } } }) {
                        name
                        friends {
                            name
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]-(this0:User)
                    WHERE this0.name = $param0
                }
                CALL (this) {
                    MATCH (this)-[this1:FRIENDS_WITH]-(this2:User)
                    WITH DISTINCT this2
                    WITH this2 { .name } AS this2
                    RETURN collect(this2) AS var3
                }
                RETURN this { .name, friends: var3 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\"
                }"
            `);
        });

        test("disconnect", async () => {
            const query = /* GraphQL */ `
                mutation {
                    updateUsers(
                        where: { friends: { some: { name: { eq: "John Smith" } } } }
                        update: { friends: { disconnect: { where: { node: { name: { eq: "Jane Smith" } } } } } }
                    ) {
                        users {
                            name
                            friends {
                                name
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:User)
                WITH *
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]-(this0:User)
                    WHERE this0.name = $param0
                }
                WITH *
                CALL (*) {
                    CALL (this) {
                        OPTIONAL MATCH (this)-[this1:FRIENDS_WITH]-(this2:User)
                        WHERE this2.name = $param1
                        WITH *
                        DELETE this1
                    }
                }
                WITH this
                CALL (this) {
                    MATCH (this)-[this3:FRIENDS_WITH]-(this4:User)
                    WITH DISTINCT this4
                    WITH this4 { .name } AS this4
                    RETURN collect(this4) AS var5
                }
                RETURN this { .name, friends: var5 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"param1\\": \\"Jane Smith\\"
                }"
            `);
        });

        test("update with nested delete", async () => {
            const query = /* GraphQL */ `
                mutation {
                    updateUsers(
                        where: { friends: { some: { name: { eq: "John Smith" } } } }
                        update: { friends: { delete: { where: { node: { name: { eq: "Jane Smith" } } } } } }
                    ) {
                        users {
                            name
                            friends {
                                name
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:User)
                WITH *
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]-(this0:User)
                    WHERE this0.name = $param0
                }
                WITH *
                CALL (*) {
                    OPTIONAL MATCH (this)-[this1:FRIENDS_WITH]-(this2:User)
                    WHERE this2.name = $param1
                    WITH this1, collect(DISTINCT this2) AS var3
                    CALL (var3) {
                        UNWIND var3 AS var4
                        DETACH DELETE var4
                    }
                }
                WITH this
                CALL (this) {
                    MATCH (this)-[this5:FRIENDS_WITH]-(this6:User)
                    WITH DISTINCT this6
                    WITH this6 { .name } AS this6
                    RETURN collect(this6) AS var7
                }
                RETURN this { .name, friends: var7 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"param1\\": \\"Jane Smith\\"
                }"
            `);
        });

        test("update", async () => {
            const query = /* GraphQL */ `
                mutation {
                    updateUsers(
                        where: { friends: { some: { name: { eq: "John Smith" } } } }
                        update: {
                            friends: {
                                update: {
                                    where: { node: { name: { eq: "Jane Smith" } } }
                                    node: { name_SET: "Janet Smith" }
                                }
                            }
                        }
                    ) {
                        users {
                            name
                            friends {
                                name
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:User)
                WITH *
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]-(this0:User)
                    WHERE this0.name = $param0
                }
                WITH *
                CALL (*) {
                    MATCH (this)-[this1:FRIENDS_WITH]-(this2:User)
                    WITH *
                    WHERE this2.name = $param1
                    SET
                        this2.name = $param2
                }
                WITH this
                CALL (this) {
                    MATCH (this)-[this3:FRIENDS_WITH]-(this4:User)
                    WITH DISTINCT this4
                    WITH this4 { .name } AS this4
                    RETURN collect(this4) AS var5
                }
                RETURN this { .name, friends: var5 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"param1\\": \\"Jane Smith\\",
                    \\"param2\\": \\"Janet Smith\\"
                }"
            `);
        });

        test("delete with nested delete", async () => {
            const query = /* GraphQL */ `
                mutation {
                    deleteUsers(
                        where: { friends: { some: { name: { eq: "John Smith" } } } }
                        delete: { friends: { where: { node: { name: { eq: "Jane Smith" } } } } }
                    ) {
                        nodesDeleted
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CYPHER 5
                MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]-(this0:User)
                    WHERE this0.name = $param0
                }
                WITH *
                CALL (*) {
                    OPTIONAL MATCH (this)-[this1:FRIENDS_WITH]-(this2:User)
                    WHERE this2.name = $param1
                    WITH this1, collect(DISTINCT this2) AS var3
                    CALL (var3) {
                        UNWIND var3 AS var4
                        DETACH DELETE var4
                    }
                }
                WITH *
                DETACH DELETE this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"param1\\": \\"Jane Smith\\"
                }"
            `);
        });
    });
});
