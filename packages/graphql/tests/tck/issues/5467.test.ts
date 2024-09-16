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

describe("https://github.com/neo4j/graphql/issues/5467", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Test {
                name: String!
                groups: [String!]
            }

            type Mutation {
                mergeTest(name: String!, groups: [String!]): Test
                    @cypher(
                        statement: """
                        MERGE (t:Test {name: $name}) SET t.groups = $groups
                        return t
                        """
                        columnName: "t"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("custom Cypher should correctly interpret array parameters with a single item", async () => {
        const query = /* GraphQL */ `
            mutation ($name: String!, $groups: [String!]) {
                mergeTest(name: $name, groups: $groups) {
                    name
                    groups
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                name: "test",
                groups: ["test"],
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MERGE (t:Test {name: $param0}) SET t.groups = $param1
                return t
            }
            WITH t AS this0
            WITH this0 { .name, .groups } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test\\",
                \\"param1\\": [
                    \\"test\\"
                ]
            }"
        `);
    });
});
