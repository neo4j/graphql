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

describe("https://github.com/neo4j/graphql/issues/5887", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Base {
                id: ID!
            }

            type A implements Base {
                id: ID!
            }

            type B implements Base {
                id: ID!
            }

            type Test {
                base: Base! @relationship(type: "HAS", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: { key: "secret" },
            },
        });
    });

    test("should return relationship when first interface match", async () => {
        const query = /* GraphQL */ `
            query {
                tests(where: { base: { id: "1" } }) {
                    base {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Test)
            OPTIONAL MATCH (this)-[:HAS]->(this0:A)
            WITH *, count(this0) AS var1
            OPTIONAL MATCH (this)-[:HAS]->(this2:B)
            WITH *, count(this2) AS var3
            WITH *
            WHERE ((var1 <> 0 AND this0.id = $param0) OR (var3 <> 0 AND this2.id = $param1))
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this4:HAS]->(this5:A)
                    WITH this5 { .id, __resolveType: \\"A\\", __id: id(this5) } AS this5
                    RETURN this5 AS var6
                    UNION
                    WITH *
                    MATCH (this)-[this7:HAS]->(this8:B)
                    WITH this8 { .id, __resolveType: \\"B\\", __id: id(this8) } AS this8
                    RETURN this8 AS var6
                }
                WITH var6
                RETURN head(collect(var6)) AS var6
            }
            RETURN this { base: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"1\\"
            }"
        `);
    });

    test("should return relationship when second interface match", async () => {
        const query = /* GraphQL */ `
            query {
                tests(where: { base: { id: "2" } }) {
                    base {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Test)
            OPTIONAL MATCH (this)-[:HAS]->(this0:A)
            WITH *, count(this0) AS var1
            OPTIONAL MATCH (this)-[:HAS]->(this2:B)
            WITH *, count(this2) AS var3
            WITH *
            WHERE ((var1 <> 0 AND this0.id = $param0) OR (var3 <> 0 AND this2.id = $param1))
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this4:HAS]->(this5:A)
                    WITH this5 { .id, __resolveType: \\"A\\", __id: id(this5) } AS this5
                    RETURN this5 AS var6
                    UNION
                    WITH *
                    MATCH (this)-[this7:HAS]->(this8:B)
                    WITH this8 { .id, __resolveType: \\"B\\", __id: id(this8) } AS this8
                    RETURN this8 AS var6
                }
                WITH var6
                RETURN head(collect(var6)) AS var6
            }
            RETURN this { base: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2\\",
                \\"param1\\": \\"2\\"
            }"
        `);
    });

    test("should not return relationship when no interface match", async () => {
        const query = /* GraphQL */ `
            query {
                tests(where: { base: { id: "x" } }) {
                    base {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Test)
            OPTIONAL MATCH (this)-[:HAS]->(this0:A)
            WITH *, count(this0) AS var1
            OPTIONAL MATCH (this)-[:HAS]->(this2:B)
            WITH *, count(this2) AS var3
            WITH *
            WHERE ((var1 <> 0 AND this0.id = $param0) OR (var3 <> 0 AND this2.id = $param1))
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this4:HAS]->(this5:A)
                    WITH this5 { .id, __resolveType: \\"A\\", __id: id(this5) } AS this5
                    RETURN this5 AS var6
                    UNION
                    WITH *
                    MATCH (this)-[this7:HAS]->(this8:B)
                    WITH this8 { .id, __resolveType: \\"B\\", __id: id(this8) } AS this8
                    RETURN this8 AS var6
                }
                WITH var6
                RETURN head(collect(var6)) AS var6
            }
            RETURN this { base: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"x\\",
                \\"param1\\": \\"x\\"
            }"
        `);
    });
});
