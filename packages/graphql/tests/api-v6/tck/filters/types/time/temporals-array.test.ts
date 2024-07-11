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

import { Neo4jGraphQL } from "../../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../../../tck/utils/tck-test-utils";

describe("Temporal types", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type TypeNode @node {
                dateTimeNullable: [DateTime]
                dateTime: [DateTime!]
                localDateTimeNullable: [LocalDateTime]
                localDateTime: [LocalDateTime!]
                durationNullable: [Duration]
                duration: [Duration!]
                timeNullable: [Time]
                time: [Time!]
                localTimeNullable: [LocalTime]
                localTime: [LocalTime!]
                relatedNode: [RelatedNode!]!
                    @relationship(type: "RELATED_TO", direction: OUT, properties: "RelatedNodeProperties")
            }

            type RelatedNodeProperties @relationshipProperties {
                dateTimeNullable: [DateTime]
                dateTime: [DateTime!]
                localDateTimeNullable: [LocalDateTime]
                localDateTime: [LocalDateTime!]
                durationNullable: [Duration]
                duration: [Duration!]
                timeNullable: [Time]
                time: [Time!]
                localTimeNullable: [LocalTime]
                localTime: [LocalTime!]
            }

            type RelatedNode @node {
                dateTimeNullable: [DateTime]
                dateTime: [DateTime!]
                localDateTimeNullable: [LocalDateTime]
                localDateTime: [LocalDateTime!]
                durationNullable: [Duration]
                duration: [Duration!]
                timeNullable: [Time]
                time: [Time!]
                localTimeNullable: [LocalTime]
                localTime: [LocalTime!]
            }
        `;
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should filter temporal array types - Top-Level", async () => {
        const query = /* GraphQL */ `
            query {
                typeNodes(
                    where: {
                        node: {
                            dateTime: { equals: ["2015-06-24T12:50:35.556+0100"] }
                            localDateTime: { equals: ["2003-09-14T12:00:00"] }
                            duration: { equals: ["P1Y"] }
                            time: { equals: ["22:00:15.555"] }
                            localTime: { equals: ["12:50:35.556"] }
                            dateTimeNullable: { equals: ["2015-06-24T12:50:35.556+0100"] }
                            localDateTimeNullable: { equals: ["2003-09-14T12:00:00"] }
                            durationNullable: { equals: ["P1Y"] }
                            timeNullable: { equals: ["22:00:15.555"] }
                            localTimeNullable: { equals: ["12:50:35.556"] }
                        }
                    }
                ) {
                    connection {
                        edges {
                            node {
                                dateTime
                                localDateTime
                                duration
                                time
                                localTime
                                dateTimeNullable
                                localDateTimeNullable
                                durationNullable
                                timeNullable
                                localTimeNullable
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:TypeNode)
            WHERE (this0.dateTimeNullable = $param0 AND this0.dateTime = $param1 AND this0.localDateTimeNullable = $param2 AND this0.localDateTime = $param3 AND this0.durationNullable = $param4 AND this0.duration = $param5 AND this0.timeNullable = $param6 AND this0.time = $param7 AND this0.localTimeNullable = $param8 AND this0.localTime = $param9)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { dateTime: [var1 IN this0.dateTime | apoc.date.convertFormat(toString(var1), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\")], localDateTime: this0.localDateTime, duration: this0.duration, time: this0.time, localTime: this0.localTime, dateTimeNullable: [var2 IN this0.dateTimeNullable | apoc.date.convertFormat(toString(var2), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\")], localDateTimeNullable: this0.localDateTimeNullable, durationNullable: this0.durationNullable, timeNullable: this0.timeNullable, localTimeNullable: this0.localTimeNullable, __resolveType: \\"TypeNode\\" } }) AS var3
            }
            RETURN { connection: { edges: var3, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"year\\": 2015,
                        \\"month\\": 6,
                        \\"day\\": 24,
                        \\"hour\\": 11,
                        \\"minute\\": 50,
                        \\"second\\": 35,
                        \\"nanosecond\\": 556000000,
                        \\"timeZoneOffsetSeconds\\": 0
                    }
                ],
                \\"param1\\": [
                    {
                        \\"year\\": 2015,
                        \\"month\\": 6,
                        \\"day\\": 24,
                        \\"hour\\": 11,
                        \\"minute\\": 50,
                        \\"second\\": 35,
                        \\"nanosecond\\": 556000000,
                        \\"timeZoneOffsetSeconds\\": 0
                    }
                ],
                \\"param2\\": [
                    {
                        \\"year\\": 2003,
                        \\"month\\": 9,
                        \\"day\\": 14,
                        \\"hour\\": 12,
                        \\"minute\\": 0,
                        \\"second\\": 0,
                        \\"nanosecond\\": 0
                    }
                ],
                \\"param3\\": [
                    {
                        \\"year\\": 2003,
                        \\"month\\": 9,
                        \\"day\\": 14,
                        \\"hour\\": 12,
                        \\"minute\\": 0,
                        \\"second\\": 0,
                        \\"nanosecond\\": 0
                    }
                ],
                \\"param4\\": [
                    {
                        \\"months\\": 12,
                        \\"days\\": 0,
                        \\"seconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        },
                        \\"nanoseconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        }
                    }
                ],
                \\"param5\\": [
                    {
                        \\"months\\": 12,
                        \\"days\\": 0,
                        \\"seconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        },
                        \\"nanoseconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        }
                    }
                ],
                \\"param6\\": [
                    {
                        \\"hour\\": 22,
                        \\"minute\\": 0,
                        \\"second\\": 15,
                        \\"nanosecond\\": 555000000,
                        \\"timeZoneOffsetSeconds\\": 0
                    }
                ],
                \\"param7\\": [
                    {
                        \\"hour\\": 22,
                        \\"minute\\": 0,
                        \\"second\\": 15,
                        \\"nanosecond\\": 555000000,
                        \\"timeZoneOffsetSeconds\\": 0
                    }
                ],
                \\"param8\\": [
                    {
                        \\"hour\\": 12,
                        \\"minute\\": 50,
                        \\"second\\": 35,
                        \\"nanosecond\\": 556000000
                    }
                ],
                \\"param9\\": [
                    {
                        \\"hour\\": 12,
                        \\"minute\\": 50,
                        \\"second\\": 35,
                        \\"nanosecond\\": 556000000
                    }
                ]
            }"
        `);
    });

    test("should filter temporal array types - Nested", async () => {
        const query = /* GraphQL */ `
            query {
                typeNodes {
                    connection {
                        edges {
                            node {
                                relatedNode(
                                    where: {
                                        edges: {
                                            node: {
                                                dateTime: { equals: ["2015-06-24T12:50:35.556+0100"] }
                                                localDateTime: { equals: ["2003-09-14T12:00:00"] }
                                                duration: { equals: ["P1Y"] }
                                                time: { equals: ["22:00:15.555"] }
                                                localTime: { equals: ["12:50:35.556"] }
                                                dateTimeNullable: { equals: ["2015-06-24T12:50:35.556+0100"] }
                                                localDateTimeNullable: { equals: ["2003-09-14T12:00:00"] }
                                                durationNullable: { equals: ["P1Y"] }
                                                timeNullable: { equals: ["22:00:15.555"] }
                                                localTimeNullable: { equals: ["12:50:35.556"] }
                                            }
                                        }
                                    }
                                ) {
                                    connection {
                                        edges {
                                            node {
                                                dateTime
                                                localDateTime
                                                duration
                                                time
                                                localTime
                                                dateTimeNullable
                                                localDateTimeNullable
                                                durationNullable
                                                timeNullable
                                                localTimeNullable
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:TypeNode)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:RELATED_TO]->(relatedNode:RelatedNode)
                    WHERE (relatedNode.dateTimeNullable = $param0 AND relatedNode.dateTime = $param1 AND relatedNode.localDateTimeNullable = $param2 AND relatedNode.localDateTime = $param3 AND relatedNode.durationNullable = $param4 AND relatedNode.duration = $param5 AND relatedNode.timeNullable = $param6 AND relatedNode.time = $param7 AND relatedNode.localTimeNullable = $param8 AND relatedNode.localTime = $param9)
                    WITH collect({ node: relatedNode, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS relatedNode, edge.relationship AS this1
                        RETURN collect({ node: { dateTime: [var2 IN relatedNode.dateTime | apoc.date.convertFormat(toString(var2), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\")], localDateTime: relatedNode.localDateTime, duration: relatedNode.duration, time: relatedNode.time, localTime: relatedNode.localTime, dateTimeNullable: [var3 IN relatedNode.dateTimeNullable | apoc.date.convertFormat(toString(var3), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\")], localDateTimeNullable: relatedNode.localDateTimeNullable, durationNullable: relatedNode.durationNullable, timeNullable: relatedNode.timeNullable, localTimeNullable: relatedNode.localTimeNullable, __resolveType: \\"RelatedNode\\" } }) AS var4
                    }
                    RETURN { connection: { edges: var4, totalCount: totalCount } } AS var5
                }
                RETURN collect({ node: { relatedNode: var5, __resolveType: \\"TypeNode\\" } }) AS var6
            }
            RETURN { connection: { edges: var6, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"year\\": 2015,
                        \\"month\\": 6,
                        \\"day\\": 24,
                        \\"hour\\": 11,
                        \\"minute\\": 50,
                        \\"second\\": 35,
                        \\"nanosecond\\": 556000000,
                        \\"timeZoneOffsetSeconds\\": 0
                    }
                ],
                \\"param1\\": [
                    {
                        \\"year\\": 2015,
                        \\"month\\": 6,
                        \\"day\\": 24,
                        \\"hour\\": 11,
                        \\"minute\\": 50,
                        \\"second\\": 35,
                        \\"nanosecond\\": 556000000,
                        \\"timeZoneOffsetSeconds\\": 0
                    }
                ],
                \\"param2\\": [
                    {
                        \\"year\\": 2003,
                        \\"month\\": 9,
                        \\"day\\": 14,
                        \\"hour\\": 12,
                        \\"minute\\": 0,
                        \\"second\\": 0,
                        \\"nanosecond\\": 0
                    }
                ],
                \\"param3\\": [
                    {
                        \\"year\\": 2003,
                        \\"month\\": 9,
                        \\"day\\": 14,
                        \\"hour\\": 12,
                        \\"minute\\": 0,
                        \\"second\\": 0,
                        \\"nanosecond\\": 0
                    }
                ],
                \\"param4\\": [
                    {
                        \\"months\\": 12,
                        \\"days\\": 0,
                        \\"seconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        },
                        \\"nanoseconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        }
                    }
                ],
                \\"param5\\": [
                    {
                        \\"months\\": 12,
                        \\"days\\": 0,
                        \\"seconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        },
                        \\"nanoseconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        }
                    }
                ],
                \\"param6\\": [
                    {
                        \\"hour\\": 22,
                        \\"minute\\": 0,
                        \\"second\\": 15,
                        \\"nanosecond\\": 555000000,
                        \\"timeZoneOffsetSeconds\\": 0
                    }
                ],
                \\"param7\\": [
                    {
                        \\"hour\\": 22,
                        \\"minute\\": 0,
                        \\"second\\": 15,
                        \\"nanosecond\\": 555000000,
                        \\"timeZoneOffsetSeconds\\": 0
                    }
                ],
                \\"param8\\": [
                    {
                        \\"hour\\": 12,
                        \\"minute\\": 50,
                        \\"second\\": 35,
                        \\"nanosecond\\": 556000000
                    }
                ],
                \\"param9\\": [
                    {
                        \\"hour\\": 12,
                        \\"minute\\": 50,
                        \\"second\\": 35,
                        \\"nanosecond\\": 556000000
                    }
                ]
            }"
        `);
    });

    test("should filter temporal array types - Relationship properties", async () => {
        const query = /* GraphQL */ `
            query {
                typeNodes {
                    connection {
                        edges {
                            node {
                                relatedNode(
                                    where: {
                                        edges: {
                                            properties: {
                                                dateTime: { equals: ["2015-06-24T12:50:35.556+0100"] }
                                                localDateTime: { equals: ["2003-09-14T12:00:00"] }
                                                duration: { equals: ["P1Y"] }
                                                time: { equals: ["22:00:15.555"] }
                                                localTime: { equals: ["12:50:35.556"] }
                                                dateTimeNullable: { equals: ["2015-06-24T12:50:35.556+0100"] }
                                                localDateTimeNullable: { equals: ["2003-09-14T12:00:00"] }
                                                durationNullable: { equals: ["P1Y"] }
                                                timeNullable: { equals: ["22:00:15.555"] }
                                                localTimeNullable: { equals: ["12:50:35.556"] }
                                            }
                                        }
                                    }
                                ) {
                                    connection {
                                        edges {
                                            properties {
                                                dateTime
                                                localDateTime
                                                duration
                                                time
                                                localTime
                                                dateTimeNullable
                                                localDateTimeNullable
                                                durationNullable
                                                timeNullable
                                                localTimeNullable
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:TypeNode)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:RELATED_TO]->(relatedNode:RelatedNode)
                    WHERE (this1.dateTimeNullable = $param0 AND this1.dateTime = $param1 AND this1.localDateTimeNullable = $param2 AND this1.localDateTime = $param3 AND this1.durationNullable = $param4 AND this1.duration = $param5 AND this1.timeNullable = $param6 AND this1.time = $param7 AND this1.localTimeNullable = $param8 AND this1.localTime = $param9)
                    WITH collect({ node: relatedNode, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS relatedNode, edge.relationship AS this1
                        RETURN collect({ properties: { dateTime: [var2 IN this1.dateTime | apoc.date.convertFormat(toString(var2), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\")], localDateTime: this1.localDateTime, duration: this1.duration, time: this1.time, localTime: this1.localTime, dateTimeNullable: [var3 IN this1.dateTimeNullable | apoc.date.convertFormat(toString(var3), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\")], localDateTimeNullable: this1.localDateTimeNullable, durationNullable: this1.durationNullable, timeNullable: this1.timeNullable, localTimeNullable: this1.localTimeNullable }, node: { __id: id(relatedNode), __resolveType: \\"RelatedNode\\" } }) AS var4
                    }
                    RETURN { connection: { edges: var4, totalCount: totalCount } } AS var5
                }
                RETURN collect({ node: { relatedNode: var5, __resolveType: \\"TypeNode\\" } }) AS var6
            }
            RETURN { connection: { edges: var6, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"year\\": 2015,
                        \\"month\\": 6,
                        \\"day\\": 24,
                        \\"hour\\": 11,
                        \\"minute\\": 50,
                        \\"second\\": 35,
                        \\"nanosecond\\": 556000000,
                        \\"timeZoneOffsetSeconds\\": 0
                    }
                ],
                \\"param1\\": [
                    {
                        \\"year\\": 2015,
                        \\"month\\": 6,
                        \\"day\\": 24,
                        \\"hour\\": 11,
                        \\"minute\\": 50,
                        \\"second\\": 35,
                        \\"nanosecond\\": 556000000,
                        \\"timeZoneOffsetSeconds\\": 0
                    }
                ],
                \\"param2\\": [
                    {
                        \\"year\\": 2003,
                        \\"month\\": 9,
                        \\"day\\": 14,
                        \\"hour\\": 12,
                        \\"minute\\": 0,
                        \\"second\\": 0,
                        \\"nanosecond\\": 0
                    }
                ],
                \\"param3\\": [
                    {
                        \\"year\\": 2003,
                        \\"month\\": 9,
                        \\"day\\": 14,
                        \\"hour\\": 12,
                        \\"minute\\": 0,
                        \\"second\\": 0,
                        \\"nanosecond\\": 0
                    }
                ],
                \\"param4\\": [
                    {
                        \\"months\\": 12,
                        \\"days\\": 0,
                        \\"seconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        },
                        \\"nanoseconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        }
                    }
                ],
                \\"param5\\": [
                    {
                        \\"months\\": 12,
                        \\"days\\": 0,
                        \\"seconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        },
                        \\"nanoseconds\\": {
                            \\"low\\": 0,
                            \\"high\\": 0
                        }
                    }
                ],
                \\"param6\\": [
                    {
                        \\"hour\\": 22,
                        \\"minute\\": 0,
                        \\"second\\": 15,
                        \\"nanosecond\\": 555000000,
                        \\"timeZoneOffsetSeconds\\": 0
                    }
                ],
                \\"param7\\": [
                    {
                        \\"hour\\": 22,
                        \\"minute\\": 0,
                        \\"second\\": 15,
                        \\"nanosecond\\": 555000000,
                        \\"timeZoneOffsetSeconds\\": 0
                    }
                ],
                \\"param8\\": [
                    {
                        \\"hour\\": 12,
                        \\"minute\\": 50,
                        \\"second\\": 35,
                        \\"nanosecond\\": 556000000
                    }
                ],
                \\"param9\\": [
                    {
                        \\"hour\\": 12,
                        \\"minute\\": 50,
                        \\"second\\": 35,
                        \\"nanosecond\\": 556000000
                    }
                ]
            }"
        `);
    });
});
