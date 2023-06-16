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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("#360", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Event {
                id: ID!
                name: String
                start: DateTime
                end: DateTime
                activity: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Should exclude undefined members in AND", async () => {
        const query = gql`
            query ($rangeStart: DateTime, $rangeEnd: DateTime, $activity: String) {
                events(
                    where: { AND: [{ start_GTE: $rangeStart }, { start_LTE: $rangeEnd }, { activity: $activity }] }
                ) {
                    start
                    activity
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: { rangeStart: "2021-07-18T00:00:00+0100", rangeEnd: "2021-07-18T23:59:59+0100" },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Event\`)
            WHERE (this.start >= $param0 AND this.start <= $param1)
            RETURN this { start: apoc.date.convertFormat(toString(this.start), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), .activity } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2021,
                    \\"month\\": 7,
                    \\"day\\": 17,
                    \\"hour\\": 23,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                },
                \\"param1\\": {
                    \\"year\\": 2021,
                    \\"month\\": 7,
                    \\"day\\": 18,
                    \\"hour\\": 22,
                    \\"minute\\": 59,
                    \\"second\\": 59,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });

    test("Should exclude undefined members in OR", async () => {
        const query = gql`
            query ($rangeStart: DateTime, $rangeEnd: DateTime, $activity: String) {
                events(where: { OR: [{ start_GTE: $rangeStart }, { start_LTE: $rangeEnd }, { activity: $activity }] }) {
                    start
                    activity
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: { rangeStart: "2021-07-18T00:00:00+0100", rangeEnd: "2021-07-18T23:59:59+0100" },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Event\`)
            WHERE (this.start >= $param0 OR this.start <= $param1)
            RETURN this { start: apoc.date.convertFormat(toString(this.start), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), .activity } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2021,
                    \\"month\\": 7,
                    \\"day\\": 17,
                    \\"hour\\": 23,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                },
                \\"param1\\": {
                    \\"year\\": 2021,
                    \\"month\\": 7,
                    \\"day\\": 18,
                    \\"hour\\": 22,
                    \\"minute\\": 59,
                    \\"second\\": 59,
                    \\"nanosecond\\": 0,
                    \\"timeZoneOffsetSeconds\\": 0
                }
            }"
        `);
    });
});
