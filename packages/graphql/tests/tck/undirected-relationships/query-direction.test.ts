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

        test("query with filter", async () => {
            const query = /* GraphQL */ `
                query {
                    users(where: { friends_SOME: { name_EQ: "John Smith" } }) {
                        name
                        friends {
                            name
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]->(this0:User)
                    WHERE this0.name = $param0
                }
                CALL {
                    WITH this
                    MATCH (this)-[this1:FRIENDS_WITH]->(this2:User)
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
                        where: { friends_SOME: { name_EQ: "John Smith" } }
                        update: { friends: { disconnect: { where: { node: { name_EQ: "Jane Smith" } } } } }
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
                "MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]->(this0:User)
                    WHERE this0.name = $param0
                }
                WITH this
                CALL {
                WITH this
                OPTIONAL MATCH (this)-[this_friends0_disconnect0_rel:FRIENDS_WITH]->(this_friends0_disconnect0:User)
                WHERE this_friends0_disconnect0.name = $updateUsers_args_update_friends0_disconnect0_where_User_this_friends0_disconnect0param0
                CALL {
                	WITH this_friends0_disconnect0, this_friends0_disconnect0_rel, this
                	WITH collect(this_friends0_disconnect0) as this_friends0_disconnect0, this_friends0_disconnect0_rel, this
                	UNWIND this_friends0_disconnect0 as x
                	DELETE this_friends0_disconnect0_rel
                }
                RETURN count(*) AS disconnect_this_friends0_disconnect_User
                }
                WITH *
                CALL {
                    WITH this
                    MATCH (this)-[update_this0:FRIENDS_WITH]->(update_this1:User)
                    WITH update_this1 { .name } AS update_this1
                    RETURN collect(update_this1) AS update_var2
                }
                RETURN collect(DISTINCT this { .name, friends: update_var2 }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"updateUsers_args_update_friends0_disconnect0_where_User_this_friends0_disconnect0param0\\": \\"Jane Smith\\",
                    \\"updateUsers\\": {
                        \\"args\\": {
                            \\"update\\": {
                                \\"friends\\": [
                                    {
                                        \\"disconnect\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"name_EQ\\": \\"Jane Smith\\"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("update with nested delete", async () => {
            const query = /* GraphQL */ `
                mutation {
                    updateUsers(
                        where: { friends_SOME: { name_EQ: "John Smith" } }
                        update: { friends: { delete: { where: { node: { name_EQ: "Jane Smith" } } } } }
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
                "MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]->(this0:User)
                    WHERE this0.name = $param0
                }
                WITH *
                CALL {
                WITH *
                OPTIONAL MATCH (this)-[this_friends0_delete0_relationship:FRIENDS_WITH]->(this_friends0_delete0:User)
                WHERE this_friends0_delete0.name = $updateUsers_args_update_friends0_delete0_where_this_friends0_delete0param0
                WITH this_friends0_delete0_relationship, collect(DISTINCT this_friends0_delete0) AS this_friends0_delete0_to_delete
                CALL {
                	WITH this_friends0_delete0_to_delete
                	UNWIND this_friends0_delete0_to_delete AS x
                	DETACH DELETE x
                }
                }
                WITH *
                CALL {
                    WITH this
                    MATCH (this)-[update_this0:FRIENDS_WITH]->(update_this1:User)
                    WITH update_this1 { .name } AS update_this1
                    RETURN collect(update_this1) AS update_var2
                }
                RETURN collect(DISTINCT this { .name, friends: update_var2 }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"updateUsers_args_update_friends0_delete0_where_this_friends0_delete0param0\\": \\"Jane Smith\\",
                    \\"updateUsers\\": {
                        \\"args\\": {
                            \\"update\\": {
                                \\"friends\\": [
                                    {
                                        \\"delete\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"name_EQ\\": \\"Jane Smith\\"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("update", async () => {
            const query = /* GraphQL */ `
                mutation {
                    updateUsers(
                        where: { friends_SOME: { name_EQ: "John Smith" } }
                        update: {
                            friends: {
                                where: { node: { name_EQ: "Jane Smith" } }
                                update: { node: { name_SET: "Janet Smith" } }
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
                "MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]->(this0:User)
                    WHERE this0.name = $param0
                }
                WITH this
                CALL {
                	WITH this
                	MATCH (this)-[this_friends_with0_relationship:FRIENDS_WITH]->(this_friends0:User)
                	WHERE this_friends0.name = $updateUsers_args_update_friends0_where_this_friends0param0
                	SET this_friends0.name = $this_update_friends0_name_SET
                	RETURN count(*) AS update_this_friends0
                }
                WITH *
                CALL {
                    WITH this
                    MATCH (this)-[update_this0:FRIENDS_WITH]->(update_this1:User)
                    WITH update_this1 { .name } AS update_this1
                    RETURN collect(update_this1) AS update_var2
                }
                RETURN collect(DISTINCT this { .name, friends: update_var2 }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"updateUsers_args_update_friends0_where_this_friends0param0\\": \\"Jane Smith\\",
                    \\"this_update_friends0_name_SET\\": \\"Janet Smith\\",
                    \\"updateUsers\\": {
                        \\"args\\": {
                            \\"update\\": {
                                \\"friends\\": [
                                    {
                                        \\"where\\": {
                                            \\"node\\": {
                                                \\"name_EQ\\": \\"Jane Smith\\"
                                            }
                                        },
                                        \\"update\\": {
                                            \\"node\\": {
                                                \\"name_SET\\": \\"Janet Smith\\"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("delete with nested delete", async () => {
            const query = /* GraphQL */ `
                mutation {
                    deleteUsers(
                        where: { friends_SOME: { name_EQ: "John Smith" } }
                        delete: { friends: { where: { node: { name_EQ: "Jane Smith" } } } }
                    ) {
                        nodesDeleted
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]->(this0:User)
                    WHERE this0.name = $param0
                }
                WITH *
                CALL {
                    WITH *
                    OPTIONAL MATCH (this)-[this1:FRIENDS_WITH]->(this2:User)
                    WHERE this2.name = $param1
                    WITH this1, collect(DISTINCT this2) AS var3
                    CALL {
                        WITH var3
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

        test("query with filter", async () => {
            const query = /* GraphQL */ `
                query {
                    users(where: { friends_SOME: { name_EQ: "John Smith" } }) {
                        name
                        friends {
                            name
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]-(this0:User)
                    WHERE this0.name = $param0
                }
                CALL {
                    WITH this
                    MATCH (this)-[this1:FRIENDS_WITH]-(this2:User)
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
                        where: { friends_SOME: { name_EQ: "John Smith" } }
                        update: { friends: { disconnect: { where: { node: { name_EQ: "Jane Smith" } } } } }
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
                "MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]-(this0:User)
                    WHERE this0.name = $param0
                }
                WITH this
                CALL {
                WITH this
                OPTIONAL MATCH (this)-[this_friends0_disconnect0_rel:FRIENDS_WITH]->(this_friends0_disconnect0:User)
                WHERE this_friends0_disconnect0.name = $updateUsers_args_update_friends0_disconnect0_where_User_this_friends0_disconnect0param0
                CALL {
                	WITH this_friends0_disconnect0, this_friends0_disconnect0_rel, this
                	WITH collect(this_friends0_disconnect0) as this_friends0_disconnect0, this_friends0_disconnect0_rel, this
                	UNWIND this_friends0_disconnect0 as x
                	DELETE this_friends0_disconnect0_rel
                }
                RETURN count(*) AS disconnect_this_friends0_disconnect_User
                }
                WITH *
                CALL {
                    WITH this
                    MATCH (this)-[update_this0:FRIENDS_WITH]-(update_this1:User)
                    WITH update_this1 { .name } AS update_this1
                    RETURN collect(update_this1) AS update_var2
                }
                RETURN collect(DISTINCT this { .name, friends: update_var2 }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"updateUsers_args_update_friends0_disconnect0_where_User_this_friends0_disconnect0param0\\": \\"Jane Smith\\",
                    \\"updateUsers\\": {
                        \\"args\\": {
                            \\"update\\": {
                                \\"friends\\": [
                                    {
                                        \\"disconnect\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"name_EQ\\": \\"Jane Smith\\"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("update with nested delete", async () => {
            const query = /* GraphQL */ `
                mutation {
                    updateUsers(
                        where: { friends_SOME: { name_EQ: "John Smith" } }
                        update: { friends: { delete: { where: { node: { name_EQ: "Jane Smith" } } } } }
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
                "MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]-(this0:User)
                    WHERE this0.name = $param0
                }
                WITH *
                CALL {
                WITH *
                OPTIONAL MATCH (this)-[this_friends0_delete0_relationship:FRIENDS_WITH]->(this_friends0_delete0:User)
                WHERE this_friends0_delete0.name = $updateUsers_args_update_friends0_delete0_where_this_friends0_delete0param0
                WITH this_friends0_delete0_relationship, collect(DISTINCT this_friends0_delete0) AS this_friends0_delete0_to_delete
                CALL {
                	WITH this_friends0_delete0_to_delete
                	UNWIND this_friends0_delete0_to_delete AS x
                	DETACH DELETE x
                }
                }
                WITH *
                CALL {
                    WITH this
                    MATCH (this)-[update_this0:FRIENDS_WITH]-(update_this1:User)
                    WITH update_this1 { .name } AS update_this1
                    RETURN collect(update_this1) AS update_var2
                }
                RETURN collect(DISTINCT this { .name, friends: update_var2 }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"updateUsers_args_update_friends0_delete0_where_this_friends0_delete0param0\\": \\"Jane Smith\\",
                    \\"updateUsers\\": {
                        \\"args\\": {
                            \\"update\\": {
                                \\"friends\\": [
                                    {
                                        \\"delete\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"name_EQ\\": \\"Jane Smith\\"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("update", async () => {
            const query = /* GraphQL */ `
                mutation {
                    updateUsers(
                        where: { friends_SOME: { name_EQ: "John Smith" } }
                        update: {
                            friends: {
                                where: { node: { name_EQ: "Jane Smith" } }
                                update: { node: { name_SET: "Janet Smith" } }
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
                "MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]-(this0:User)
                    WHERE this0.name = $param0
                }
                WITH this
                CALL {
                	WITH this
                	MATCH (this)-[this_friends_with0_relationship:FRIENDS_WITH]->(this_friends0:User)
                	WHERE this_friends0.name = $updateUsers_args_update_friends0_where_this_friends0param0
                	SET this_friends0.name = $this_update_friends0_name_SET
                	RETURN count(*) AS update_this_friends0
                }
                WITH *
                CALL {
                    WITH this
                    MATCH (this)-[update_this0:FRIENDS_WITH]-(update_this1:User)
                    WITH update_this1 { .name } AS update_this1
                    RETURN collect(update_this1) AS update_var2
                }
                RETURN collect(DISTINCT this { .name, friends: update_var2 }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"John Smith\\",
                    \\"updateUsers_args_update_friends0_where_this_friends0param0\\": \\"Jane Smith\\",
                    \\"this_update_friends0_name_SET\\": \\"Janet Smith\\",
                    \\"updateUsers\\": {
                        \\"args\\": {
                            \\"update\\": {
                                \\"friends\\": [
                                    {
                                        \\"where\\": {
                                            \\"node\\": {
                                                \\"name_EQ\\": \\"Jane Smith\\"
                                            }
                                        },
                                        \\"update\\": {
                                            \\"node\\": {
                                                \\"name_SET\\": \\"Janet Smith\\"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("delete with nested delete", async () => {
            const query = /* GraphQL */ `
                mutation {
                    deleteUsers(
                        where: { friends_SOME: { name_EQ: "John Smith" } }
                        delete: { friends: { where: { node: { name_EQ: "Jane Smith" } } } }
                    ) {
                        nodesDeleted
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:User)
                WHERE EXISTS {
                    MATCH (this)-[:FRIENDS_WITH]-(this0:User)
                    WHERE this0.name = $param0
                }
                WITH *
                CALL {
                    WITH *
                    OPTIONAL MATCH (this)-[this1:FRIENDS_WITH]-(this2:User)
                    WHERE this2.name = $param1
                    WITH this1, collect(DISTINCT this2) AS var3
                    CALL {
                        WITH var3
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
