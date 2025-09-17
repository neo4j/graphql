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

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Cypher directive with limit and ignoreGeneratedLimit flag", () => {
    const typeDefs = /* GraphQL */ `
        type Tag @limit(default: 10, max: 100) @node {
            id: Int
            name: String!
        }

        type TagGroup @node {
            id: ID
            tags(tagNames: [String]!, limit: Int): [Tag]
                @cypher(
                    statement: """
                    MATCH (t:Tag)
                    WHERE ANY(name IN $tagNames WHERE t.displayName = toLower(name))
                    RETURN t
                    LIMIT $limit
                    """
                    columnName: "t"
                )
        }

        type Query {
            getTagsByNames(tagNames: [String]!, limit: Int): [Tag]
                @cypher(
                    statement: """
                    MATCH (t:Tag)
                    WHERE ANY(name IN $tagNames
                        WHERE t.displayName = toLower(name))
                    RETURN t
                    LIMIT $limit
                    """
                    columnName: "t"
                )
        }
    `;
    const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
        typeDefs,
        features: {
            cypherDirective: {
                ignoreGeneratedLimit: true,
            },
        },
    });

    test("Top level cypher with limit param", async () => {
        const query = /* GraphQL */ `
            query {
                getTagsByNames(tagNames: ["a", "b", "c"], limit: 50) {
                    id
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (t:Tag)
                WHERE ANY(name IN $param0
                    WHERE t.displayName = toLower(name))
                RETURN t
                LIMIT $param1
            }
            WITH t AS this0
            WITH this0 { .id, .name } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"a\\",
                    \\"b\\",
                    \\"c\\"
                ],
                \\"param1\\": {
                    \\"low\\": 50,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Top level cypher with no limit param", async () => {
        const query = /* GraphQL */ `
            query {
                getTagsByNames(tagNames: ["a", "b", "c"]) {
                    id
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (t:Tag)
                WHERE ANY(name IN $param0
                    WHERE t.displayName = toLower(name))
                RETURN t
                LIMIT NULL
            }
            WITH t AS this0
            WITH this0 { .id, .name } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"a\\",
                    \\"b\\",
                    \\"c\\"
                ]
            }"
        `);
    });

    test("Nested cypher with limit param", async () => {
        const query = /* GraphQL */ `
            query {
                tagGroups {
                    tags(tagNames: ["a"], limit: 14) {
                        id
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:TagGroup)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (t:Tag)
                    WHERE ANY(name IN $param0 WHERE t.displayName = toLower(name))
                    RETURN t
                    LIMIT $param1
                }
                WITH t AS this0
                WITH this0 { .id, .name } AS this0
                RETURN collect(this0) AS var1
            }
            RETURN this { tags: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"a\\"
                ],
                \\"param1\\": {
                    \\"low\\": 14,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
