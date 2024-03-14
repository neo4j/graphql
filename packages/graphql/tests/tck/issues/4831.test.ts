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

describe("https://github.com/neo4j/graphql/issues/4831", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Test {
                testBoolean(value: Boolean): Boolean @cypher(statement: "RETURN $value as value", columnName: "value")
                testString(value: String): String @cypher(statement: "RETURN $value as value", columnName: "value")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {},
        });
    });

    describe("Boolean", () => {
        test("the parameter should be false when the cypher argument is false", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    tests {
                        testBoolean(value: false)
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Test)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        RETURN $param0 as value
                    }
                    WITH value AS this0
                    RETURN this0 AS var1
                }
                RETURN this { testBoolean: var1 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": false
                }"
            `);
        });

        test("the parameter should be true when the cypher argument is true", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    tests {
                        testBoolean(value: true)
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Test)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        RETURN $param0 as value
                    }
                    WITH value AS this0
                    RETURN this0 AS var1
                }
                RETURN this { testBoolean: var1 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": true
                }"
            `);
        });

        test("the parameter should be NULL when the cypher argument is not passed", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    tests {
                        testBoolean
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Test)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        RETURN NULL as value
                    }
                    WITH value AS this0
                    RETURN this0 AS var1
                }
                RETURN this { testBoolean: var1 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("the parameter should be NULL when the cypher argument passed is NULL", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    tests {
                        testBoolean(value: null)
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Test)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        RETURN NULL as value
                    }
                    WITH value AS this0
                    RETURN this0 AS var1
                }
                RETURN this { testBoolean: var1 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });

    describe("String", () => {
        test("the parameter should be an empty string when the cypher argument is an empty string", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    tests {
                        testString(value: "")
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Test)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        RETURN $param0 as value
                    }
                    WITH value AS this0
                    RETURN this0 AS var1
                }
                RETURN this { testString: var1 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"\\"
                }"
            `);
        });

        test("the parameter should be 'some-string' when the cypher argument is 'some-string'", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    tests {
                        testString(value: "some-string")
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Test)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        RETURN $param0 as value
                    }
                    WITH value AS this0
                    RETURN this0 AS var1
                }
                RETURN this { testString: var1 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"some-string\\"
                }"
            `);
        });

        test("the parameter should be NULL when the cypher argument is not passed", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    tests {
                        testString
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Test)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        RETURN NULL as value
                    }
                    WITH value AS this0
                    RETURN this0 AS var1
                }
                RETURN this { testString: var1 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("the parameter should be NULL when the cypher argument passed is NULL", async () => {
            const query = /* GraphQL */ `
                query ExampleQuery {
                    tests {
                        testString(value: null)
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Test)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        RETURN NULL as value
                    }
                    WITH value AS this0
                    RETURN this0 AS var1
                }
                RETURN this { testString: var1 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });
});
