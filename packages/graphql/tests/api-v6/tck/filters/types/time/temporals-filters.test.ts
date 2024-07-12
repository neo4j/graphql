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
                dateTime: DateTime
                localDateTime: LocalDateTime
                duration: Duration
                time: Time
                localTime: LocalTime
                relatedNode: [RelatedNode!]!
                    @relationship(type: "RELATED_TO", direction: OUT, properties: "RelatedNodeProperties")
            }

            type RelatedNodeProperties @relationshipProperties {
                dateTime: DateTime
                localDateTime: LocalDateTime
                duration: Duration
                time: Time
                localTime: LocalTime
            }

            type RelatedNode @node {
                dateTime: DateTime
                localDateTime: LocalDateTime
                duration: Duration
                time: Time
                localTime: LocalTime
            }
        `;
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should filter temporal types - Top-Level", async () => {
        const query = /* GraphQL */ `
            query {
                typeNodes(
                    where: {
                        node: {
                            dateTime: { equals: "2015-06-24T12:50:35.556+0100" }
                            localDateTime: { gt: "2003-09-14T12:00:00" }
                            duration: { gte: "P1Y" }
                            time: { lt: "22:00:15.555" }
                            localTime: { lte: "12:50:35.556" }
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
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { v6Api: true });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:TypeNode)
            WHERE (this0.dateTime = $param0 AND this0.localDateTime > $param1 AND (datetime() + this0.duration) >= (datetime() + $param2) AND this0.time < $param3 AND this0.localTime <= $param4)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { dateTime: apoc.date.convertFormat(toString(this0.dateTime), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), localDateTime: this0.localDateTime, duration: this0.duration, time: this0.time, localTime: this0.localTime, __resolveType: \\"TypeNode\\" } }) AS var1
            }
            RETURN { connection: { edges: var1, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2015,
                    \\"month\\": 6,
                    \\"day\\": 24,
                    \\"hour\\": 11,
                    \\"minute\\": 50,
                    \\"second\\": 35,
                    \\"nanosecond\\": 556000000,
                    \\"timeZoneOffsetSeconds\\": 0
                },
                \\"param1\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                },
                \\"param2\\": {
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
                },
                \\"param3\\": {
                    \\"hour\\": 22,
                    \\"minute\\": 0,
                    \\"second\\": 15,
                    \\"nanosecond\\": 555000000,
                    \\"timeZoneOffsetSeconds\\": 0
                },
                \\"param4\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 50,
                    \\"second\\": 35,
                    \\"nanosecond\\": 556000000
                }
            }"
        `);
    });

    test("should filter temporal types - Nested", async () => {
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
                                                dateTime: { equals: "2015-06-24T12:50:35.556+0100" }
                                                localDateTime: { gt: "2003-09-14T12:00:00" }
                                                duration: { gte: "P1Y" }
                                                time: { lt: "22:00:15.555" }
                                                localTime: { lte: "12:50:35.556" }
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
                    WHERE (relatedNode.dateTime = $param0 AND relatedNode.localDateTime > $param1 AND (datetime() + relatedNode.duration) >= (datetime() + $param2) AND relatedNode.time < $param3 AND relatedNode.localTime <= $param4)
                    WITH collect({ node: relatedNode, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS relatedNode, edge.relationship AS this1
                        RETURN collect({ node: { dateTime: apoc.date.convertFormat(toString(relatedNode.dateTime), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), localDateTime: relatedNode.localDateTime, duration: relatedNode.duration, time: relatedNode.time, localTime: relatedNode.localTime, __resolveType: \\"RelatedNode\\" } }) AS var2
                    }
                    RETURN { connection: { edges: var2, totalCount: totalCount } } AS var3
                }
                RETURN collect({ node: { relatedNode: var3, __resolveType: \\"TypeNode\\" } }) AS var4
            }
            RETURN { connection: { edges: var4, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2015,
                    \\"month\\": 6,
                    \\"day\\": 24,
                    \\"hour\\": 11,
                    \\"minute\\": 50,
                    \\"second\\": 35,
                    \\"nanosecond\\": 556000000,
                    \\"timeZoneOffsetSeconds\\": 0
                },
                \\"param1\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                },
                \\"param2\\": {
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
                },
                \\"param3\\": {
                    \\"hour\\": 22,
                    \\"minute\\": 0,
                    \\"second\\": 15,
                    \\"nanosecond\\": 555000000,
                    \\"timeZoneOffsetSeconds\\": 0
                },
                \\"param4\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 50,
                    \\"second\\": 35,
                    \\"nanosecond\\": 556000000
                }
            }"
        `);
    });

    test("should filter temporal types - Relationship properties", async () => {
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
                                                dateTime: { equals: "2015-06-24T12:50:35.556+0100" }
                                                localDateTime: { gt: "2003-09-14T12:00:00" }
                                                duration: { gte: "P1Y" }
                                                time: { lt: "22:00:15.555" }
                                                localTime: { lte: "12:50:35.556" }
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
                    WHERE (this1.dateTime = $param0 AND this1.localDateTime > $param1 AND (datetime() + this1.duration) >= (datetime() + $param2) AND this1.time < $param3 AND this1.localTime <= $param4)
                    WITH collect({ node: relatedNode, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS relatedNode, edge.relationship AS this1
                        RETURN collect({ properties: { dateTime: apoc.date.convertFormat(toString(this1.dateTime), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), localDateTime: this1.localDateTime, duration: this1.duration, time: this1.time, localTime: this1.localTime }, node: { __id: id(relatedNode), __resolveType: \\"RelatedNode\\" } }) AS var2
                    }
                    RETURN { connection: { edges: var2, totalCount: totalCount } } AS var3
                }
                RETURN collect({ node: { relatedNode: var3, __resolveType: \\"TypeNode\\" } }) AS var4
            }
            RETURN { connection: { edges: var4, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 2015,
                    \\"month\\": 6,
                    \\"day\\": 24,
                    \\"hour\\": 11,
                    \\"minute\\": 50,
                    \\"second\\": 35,
                    \\"nanosecond\\": 556000000,
                    \\"timeZoneOffsetSeconds\\": 0
                },
                \\"param1\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                },
                \\"param2\\": {
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
                },
                \\"param3\\": {
                    \\"hour\\": 22,
                    \\"minute\\": 0,
                    \\"second\\": 15,
                    \\"nanosecond\\": 555000000,
                    \\"timeZoneOffsetSeconds\\": 0
                },
                \\"param4\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 50,
                    \\"second\\": 35,
                    \\"nanosecond\\": 556000000
                }
            }"
        `);
    });
});
