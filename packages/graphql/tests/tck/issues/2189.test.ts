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

describe("https://github.com/neo4j/graphql/issues/2189", () => {
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        const typeDefs = `
            type Test_Item {
                uuid: ID! @id @unique
                int: Int
                str: String
                bool: Boolean

                feedback: Test_Feedback @relationship(type: "TEST_RELATIONSHIP", direction: IN)
                feedbackCypher: Test_Feedback
                    @cypher(
                        statement: """
                        OPTIONAL MATCH (this)<-[:TEST_RELATIONSHIP]-(t:Test_Feedback)
                        RETURN t
                        LIMIT 1
                        """,
                        columnName: "t"
                    )
            }
            type Test_Feedback {
                uuid: ID! @id @unique
                int: Int
                str: String
                bool: Boolean

                item: Test_Item @relationship(type: "TEST_RELATIONSHIP", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Mutation followed by query with Cypher field should return 2 nodes", async () => {
        const query = /* GraphQL */ `
            mutation {
                createTestItems(
                    input: [
                        { feedback: { create: { node: { str: "hi there" } } }, int: 1, str: "one", bool: false }
                        { int: 2, str: "two", bool: true }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Test_Item)
                SET
                    create_this1.int = create_var0.int,
                    create_this1.str = create_var0.str,
                    create_this1.bool = create_var0.bool,
                    create_this1.uuid = randomUUID()
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.feedback.create AS create_var2
                    CREATE (create_this3:Test_Feedback)
                    SET
                        create_this3.str = create_var2.node.str,
                        create_this3.uuid = randomUUID()
                    MERGE (create_this1)<-[create_this4:TEST_RELATIONSHIP]-(create_this3)
                    WITH create_this3
                    CALL {
                        WITH create_this3
                        MATCH (create_this3)-[create_this3_item_Test_Item_unique:TEST_RELATIONSHIP]->(:Test_Item)
                        WITH count(create_this3_item_Test_Item_unique) AS c
                        WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDTest_Feedback.item must be less than or equal to one\\", [0])
                        RETURN c AS create_this3_item_Test_Item_unique_ignored
                    }
                    RETURN collect(NULL) AS create_var5
                }
                WITH create_this1
                CALL {
                    WITH create_this1
                    MATCH (create_this1)<-[create_this1_feedback_Test_Feedback_unique:TEST_RELATIONSHIP]-(:Test_Feedback)
                    WITH count(create_this1_feedback_Test_Feedback_unique) AS c
                    WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDTest_Item.feedback must be less than or equal to one\\", [0])
                    RETURN c AS create_this1_feedback_Test_Feedback_unique_ignored
                }
                RETURN create_this1
            }
            RETURN \\"Query cannot conclude with CALL\\""
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"int\\": {
                            \\"low\\": 1,
                            \\"high\\": 0
                        },
                        \\"str\\": \\"one\\",
                        \\"bool\\": false,
                        \\"feedback\\": {
                            \\"create\\": {
                                \\"node\\": {
                                    \\"str\\": \\"hi there\\"
                                }
                            }
                        }
                    },
                    {
                        \\"int\\": {
                            \\"low\\": 2,
                            \\"high\\": 0
                        },
                        \\"str\\": \\"two\\",
                        \\"bool\\": true
                    }
                ]
            }"
        `);
    });

    test("Mutation followed by query without Cypher field should return 2 nodes", async () => {
        const query = /* GraphQL */ `
            mutation {
                createTestItems(
                    input: [
                        { feedback: { create: { node: { str: "hi there" } } }, int: 1, str: "one", bool: false }
                        { int: 2, str: "two", bool: true }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Test_Item)
                SET
                    create_this1.int = create_var0.int,
                    create_this1.str = create_var0.str,
                    create_this1.bool = create_var0.bool,
                    create_this1.uuid = randomUUID()
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.feedback.create AS create_var2
                    CREATE (create_this3:Test_Feedback)
                    SET
                        create_this3.str = create_var2.node.str,
                        create_this3.uuid = randomUUID()
                    MERGE (create_this1)<-[create_this4:TEST_RELATIONSHIP]-(create_this3)
                    WITH create_this3
                    CALL {
                        WITH create_this3
                        MATCH (create_this3)-[create_this3_item_Test_Item_unique:TEST_RELATIONSHIP]->(:Test_Item)
                        WITH count(create_this3_item_Test_Item_unique) AS c
                        WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDTest_Feedback.item must be less than or equal to one\\", [0])
                        RETURN c AS create_this3_item_Test_Item_unique_ignored
                    }
                    RETURN collect(NULL) AS create_var5
                }
                WITH create_this1
                CALL {
                    WITH create_this1
                    MATCH (create_this1)<-[create_this1_feedback_Test_Feedback_unique:TEST_RELATIONSHIP]-(:Test_Feedback)
                    WITH count(create_this1_feedback_Test_Feedback_unique) AS c
                    WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDTest_Item.feedback must be less than or equal to one\\", [0])
                    RETURN c AS create_this1_feedback_Test_Feedback_unique_ignored
                }
                RETURN create_this1
            }
            RETURN \\"Query cannot conclude with CALL\\""
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"int\\": {
                            \\"low\\": 1,
                            \\"high\\": 0
                        },
                        \\"str\\": \\"one\\",
                        \\"bool\\": false,
                        \\"feedback\\": {
                            \\"create\\": {
                                \\"node\\": {
                                    \\"str\\": \\"hi there\\"
                                }
                            }
                        }
                    },
                    {
                        \\"int\\": {
                            \\"low\\": 2,
                            \\"high\\": 0
                        },
                        \\"str\\": \\"two\\",
                        \\"bool\\": true
                    }
                ]
            }"
        `);
    });

    test("Mutation with Cypher relationship in projection should return 2 nodes", async () => {
        const query = /* GraphQL */ `
            mutation {
                createTestItems(
                    input: [
                        { feedback: { create: { node: { str: "hi there" } } }, int: 1, str: "one", bool: false }
                        { int: 2, str: "two", bool: true }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                    testItems {
                        bool
                        int
                        str
                        uuid
                        feedbackCypher {
                            bool
                            str
                            int
                            uuid
                        }
                        feedback {
                            uuid
                            int
                            str
                            bool
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Test_Item)
                SET
                    create_this1.int = create_var0.int,
                    create_this1.str = create_var0.str,
                    create_this1.bool = create_var0.bool,
                    create_this1.uuid = randomUUID()
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.feedback.create AS create_var2
                    CREATE (create_this3:Test_Feedback)
                    SET
                        create_this3.str = create_var2.node.str,
                        create_this3.uuid = randomUUID()
                    MERGE (create_this1)<-[create_this4:TEST_RELATIONSHIP]-(create_this3)
                    WITH create_this3
                    CALL {
                        WITH create_this3
                        MATCH (create_this3)-[create_this3_item_Test_Item_unique:TEST_RELATIONSHIP]->(:Test_Item)
                        WITH count(create_this3_item_Test_Item_unique) AS c
                        WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDTest_Feedback.item must be less than or equal to one\\", [0])
                        RETURN c AS create_this3_item_Test_Item_unique_ignored
                    }
                    RETURN collect(NULL) AS create_var5
                }
                WITH create_this1
                CALL {
                    WITH create_this1
                    MATCH (create_this1)<-[create_this1_feedback_Test_Feedback_unique:TEST_RELATIONSHIP]-(:Test_Feedback)
                    WITH count(create_this1_feedback_Test_Feedback_unique) AS c
                    WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDTest_Item.feedback must be less than or equal to one\\", [0])
                    RETURN c AS create_this1_feedback_Test_Feedback_unique_ignored
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                CALL {
                    WITH create_this1
                    WITH create_this1 AS this
                    OPTIONAL MATCH (this)<-[:TEST_RELATIONSHIP]-(t:Test_Feedback)
                    RETURN t
                    LIMIT 1
                }
                WITH t AS create_this6
                WITH create_this6 { .bool, .str, .int, .uuid } AS create_this6
                RETURN head(collect(create_this6)) AS create_var7
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this8:TEST_RELATIONSHIP]-(create_this9:Test_Feedback)
                WITH create_this9 { .uuid, .int, .str, .bool } AS create_this9
                RETURN head(collect(create_this9)) AS create_var10
            }
            RETURN collect(create_this1 { .bool, .int, .str, .uuid, feedbackCypher: create_var7, feedback: create_var10 }) AS data"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"int\\": {
                            \\"low\\": 1,
                            \\"high\\": 0
                        },
                        \\"str\\": \\"one\\",
                        \\"bool\\": false,
                        \\"feedback\\": {
                            \\"create\\": {
                                \\"node\\": {
                                    \\"str\\": \\"hi there\\"
                                }
                            }
                        }
                    },
                    {
                        \\"int\\": {
                            \\"low\\": 2,
                            \\"high\\": 0
                        },
                        \\"str\\": \\"two\\",
                        \\"bool\\": true
                    }
                ]
            }"
        `);
    });

    test("Mutation without Cypher relationship in projection should return 2 nodes", async () => {
        const query = /* GraphQL */ `
            mutation {
                createTestItems(
                    input: [
                        { feedback: { create: { node: { str: "hi there" } } }, int: 1, str: "one", bool: false }
                        { int: 2, str: "two", bool: true }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                    testItems {
                        bool
                        int
                        str
                        uuid
                        feedback {
                            uuid
                            int
                            str
                            bool
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Test_Item)
                SET
                    create_this1.int = create_var0.int,
                    create_this1.str = create_var0.str,
                    create_this1.bool = create_var0.bool,
                    create_this1.uuid = randomUUID()
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.feedback.create AS create_var2
                    CREATE (create_this3:Test_Feedback)
                    SET
                        create_this3.str = create_var2.node.str,
                        create_this3.uuid = randomUUID()
                    MERGE (create_this1)<-[create_this4:TEST_RELATIONSHIP]-(create_this3)
                    WITH create_this3
                    CALL {
                        WITH create_this3
                        MATCH (create_this3)-[create_this3_item_Test_Item_unique:TEST_RELATIONSHIP]->(:Test_Item)
                        WITH count(create_this3_item_Test_Item_unique) AS c
                        WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDTest_Feedback.item must be less than or equal to one\\", [0])
                        RETURN c AS create_this3_item_Test_Item_unique_ignored
                    }
                    RETURN collect(NULL) AS create_var5
                }
                WITH create_this1
                CALL {
                    WITH create_this1
                    MATCH (create_this1)<-[create_this1_feedback_Test_Feedback_unique:TEST_RELATIONSHIP]-(:Test_Feedback)
                    WITH count(create_this1_feedback_Test_Feedback_unique) AS c
                    WHERE apoc.util.validatePredicate(NOT (c <= 1), \\"@neo4j/graphql/RELATIONSHIP-REQUIREDTest_Item.feedback must be less than or equal to one\\", [0])
                    RETURN c AS create_this1_feedback_Test_Feedback_unique_ignored
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)<-[create_this6:TEST_RELATIONSHIP]-(create_this7:Test_Feedback)
                WITH create_this7 { .uuid, .int, .str, .bool } AS create_this7
                RETURN head(collect(create_this7)) AS create_var8
            }
            RETURN collect(create_this1 { .bool, .int, .str, .uuid, feedback: create_var8 }) AS data"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"int\\": {
                            \\"low\\": 1,
                            \\"high\\": 0
                        },
                        \\"str\\": \\"one\\",
                        \\"bool\\": false,
                        \\"feedback\\": {
                            \\"create\\": {
                                \\"node\\": {
                                    \\"str\\": \\"hi there\\"
                                }
                            }
                        }
                    },
                    {
                        \\"int\\": {
                            \\"low\\": 2,
                            \\"high\\": 0
                        },
                        \\"str\\": \\"two\\",
                        \\"bool\\": true
                    }
                ]
            }"
        `);
    });
});
