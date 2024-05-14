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
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher Time", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie {
                id: ID
                time: Time
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Read", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { time: "12:00:00" }) {
                    time
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.time = $param0
            RETURN this { .time } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("GTE Read", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { time_GTE: "13:45:33.250" }) {
                    time
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.time >= $param0
            RETURN this { .time } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"hour\\": 13,
                    \\"minute\\": 45,
                    \\"second\\": 33,
                    \\"nanosecond\\": 250000000,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("Simple Create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ time: "22:00:15.555-01:00" }]) {
                    movies {
                        time
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.time = create_var0.time
                RETURN create_this1
            }
            RETURN collect(create_this1 { .time }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"time\\": {
                            \\"hour\\": 22,
                            \\"minute\\": 0,
                            \\"second\\": 15,
                            \\"nanosecond\\": 555000000,
                            \\"timeZoneOffsetSeconds\\": -3600
                        }
                    }
                ]
            }"
        `);
    });

    test("Simple Update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { time: "09:24:40.845512+06:30" }) {
                    movies {
                        id
                        time
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            SET this.time = $this_update_time
            RETURN collect(DISTINCT this { .id, .time }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_time\\": {
                    \\"hour\\": 9,
                    \\"minute\\": 24,
                    \\"second\\": 40,
                    \\"nanosecond\\": 845512000,
                    \\"timeZoneOffsetSeconds\\": 23400
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Create with HH:MM format", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ time: "22:00" }]) {
                    movies {
                        time
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Movie)
                SET
                    create_this1.time = create_var0.time
                RETURN create_this1
            }
            RETURN collect(create_this1 { .time }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"time\\": {
                            \\"hour\\": 22,
                            \\"minute\\": 0,
                            \\"second\\": 0,
                            \\"nanosecond\\": 0,
                            \\"timeZoneOffsetSeconds\\": 0
                        }
                    }
                ]
            }"
        `);
    });
});
