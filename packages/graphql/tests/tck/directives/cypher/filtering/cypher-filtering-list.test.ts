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

describe("cypher directive filtering - Lists", () => {
    test("Int cypher field AND String title field", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                custom_cypher_list: [String]
                    @cypher(
                        statement: """
                        RETURN ['a', 'b', 'c'] as list
                        """
                        columnName: "list"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { custom_cypher_list_INCLUDES: "a" }) {
                    title
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN ['a', 'b', 'c'] as list
                }
                UNWIND list AS var0
                WITH var0 AS this1
                RETURN collect(this1) AS var2
            }
            WITH *
            WHERE $param0 IN var2
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a\\"
            }"
        `);
    });
});
