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

describe("https://github.com/neo4j/graphql/issues/4838", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Test {
                test: Boolean! @cypher(statement: "RETURN true AS value", columnName: "value")
            }

            type ParentTest {
                tests: [Test!]! @relationship(type: "REL", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {},
        });
    });

    test("Empty input flag should be ignored on creation", async () => {
        const query = /* GraphQL */ `
            mutation Mutation {
                createTests(input: { _emptyInput: true }) {
                    tests {
                        test
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Test)
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                CALL {
                    WITH create_this1
                    WITH create_this1 AS this
                    RETURN true AS value
                }
                WITH value AS create_this2
                RETURN create_this2 AS create_var3
            }
            RETURN collect(create_this1 { test: create_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {}
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Empty input flag should be ignored on nested creation", async () => {
        const query = /* GraphQL */ `
            mutation {
                createParentTests(input: { tests: { create: { node: { _emptyInput: true } } } }) {
                    parentTests {
                        tests {
                            test
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
                CREATE (create_this1:ParentTest)
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.tests.create AS create_var2
                    WITH create_var2.node AS create_var3, create_var2.edge AS create_var4, create_this1
                    CREATE (create_this5:Test)
                    MERGE (create_this1)-[create_this6:REL]->(create_this5)
                    RETURN collect(NULL) AS create_var7
                }
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)-[create_this8:REL]->(create_this9:Test)
                CALL {
                    WITH create_this9
                    CALL {
                        WITH create_this9
                        WITH create_this9 AS this
                        RETURN true AS value
                    }
                    WITH value AS create_this10
                    RETURN create_this10 AS create_var11
                }
                WITH create_this9 { test: create_var11 } AS create_this9
                RETURN collect(create_this9) AS create_var12
            }
            RETURN collect(create_this1 { tests: create_var12 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"tests\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {}
                                }
                            ]
                        }
                    }
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
