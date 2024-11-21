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

describe("cypher directive filtering - Auth", () => {
    test("DateTime cypher field", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                special_time: DateTime
                    @cypher(
                        statement: """
                        RETURN datetime("2024-09-03T15:30:00Z") AS t
                        """
                        columnName: "t"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { special_time_GT: "2024-09-02T00:00:00Z" }) {
                    special_time
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
                    RETURN datetime(\\"2024-09-03T15:30:00Z\\") AS t
                }
                WITH t AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE var1 > $param0
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN datetime(\\"2024-09-03T15:30:00Z\\") AS t
                }
                WITH t AS this2
                RETURN this2 AS var3
            }
            RETURN this { .title, special_time: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2024,
                    \\"month\\": 9,
                    \\"day\\": 2,
                    \\"hour\\": 0,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("Duration cypher field", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                special_duration: Duration
                    @cypher(
                        statement: """
                        RETURN duration('P14DT16H12M') AS d
                        """
                        columnName: "d"
                    )
            }
        `;
        const query = /* GraphQL */ `
            query {
                movies(where: { special_duration_EQ: "P14DT16H12M" }) {
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
                    RETURN duration('P14DT16H12M') AS d
                }
                WITH d AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE var1 = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 0,
                    \\"days\\": 14,
                    \\"seconds\\": {
                        \\"low\\": 58320,
                        \\"high\\": 0
                    },
                    \\"nanoseconds\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });
});
