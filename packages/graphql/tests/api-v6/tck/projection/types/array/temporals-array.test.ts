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

    test("should be possible to querying temporal fields - Top-Level", async () => {
        const query = /* GraphQL */ `
            query {
                typeNodes {
                    connection {
                        edges {
                            node {
                                dateTimeNullable
                                dateTime
                                localDateTimeNullable
                                localDateTime
                                durationNullable
                                duration
                                timeNullable
                                time
                                localTimeNullable
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
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { dateTimeNullable: [var1 IN this0.dateTimeNullable | apoc.date.convertFormat(toString(var1), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\")], dateTime: [var2 IN this0.dateTime | apoc.date.convertFormat(toString(var2), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\")], localDateTimeNullable: this0.localDateTimeNullable, localDateTime: this0.localDateTime, durationNullable: this0.durationNullable, duration: this0.duration, timeNullable: this0.timeNullable, time: this0.time, localTimeNullable: this0.localTimeNullable, localTime: this0.localTime, __resolveType: \\"TypeNode\\" } }) AS var3
            }
            RETURN { connection: { edges: var3, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("should be possible to querying temporal fields - Nested", async () => {
        const query = /* GraphQL */ `
            query {
                typeNodes {
                    connection {
                        edges {
                            node {
                                relatedNode {
                                    connection {
                                        edges {
                                            node {
                                                dateTimeNullable
                                                dateTime
                                                localDateTimeNullable
                                                localDateTime
                                                durationNullable
                                                duration
                                                timeNullable
                                                time
                                                localTimeNullable
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
                    WITH collect({ node: relatedNode, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS relatedNode, edge.relationship AS this1
                        RETURN collect({ node: { dateTimeNullable: [var2 IN relatedNode.dateTimeNullable | apoc.date.convertFormat(toString(var2), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\")], dateTime: [var3 IN relatedNode.dateTime | apoc.date.convertFormat(toString(var3), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\")], localDateTimeNullable: relatedNode.localDateTimeNullable, localDateTime: relatedNode.localDateTime, durationNullable: relatedNode.durationNullable, duration: relatedNode.duration, timeNullable: relatedNode.timeNullable, time: relatedNode.time, localTimeNullable: relatedNode.localTimeNullable, localTime: relatedNode.localTime, __resolveType: \\"RelatedNode\\" } }) AS var4
                    }
                    RETURN { connection: { edges: var4, totalCount: totalCount } } AS var5
                }
                RETURN collect({ node: { relatedNode: var5, __resolveType: \\"TypeNode\\" } }) AS var6
            }
            RETURN { connection: { edges: var6, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("should be possible to querying temporal fields - Relationship properties", async () => {
        const query = /* GraphQL */ `
            query {
                typeNodes {
                    connection {
                        edges {
                            node {
                                relatedNode {
                                    connection {
                                        edges {
                                            properties {
                                                dateTimeNullable
                                                dateTime
                                                localDateTimeNullable
                                                localDateTime
                                                durationNullable
                                                duration
                                                timeNullable
                                                time
                                                localTimeNullable
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
                    WITH collect({ node: relatedNode, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS relatedNode, edge.relationship AS this1
                        RETURN collect({ properties: { dateTimeNullable: [var2 IN this1.dateTimeNullable | apoc.date.convertFormat(toString(var2), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\")], dateTime: [var3 IN this1.dateTime | apoc.date.convertFormat(toString(var3), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\")], localDateTimeNullable: this1.localDateTimeNullable, localDateTime: this1.localDateTime, durationNullable: this1.durationNullable, duration: this1.duration, timeNullable: this1.timeNullable, time: this1.time, localTimeNullable: this1.localTimeNullable, localTime: this1.localTime }, node: { __id: id(relatedNode), __resolveType: \\"RelatedNode\\" } }) AS var4
                    }
                    RETURN { connection: { edges: var4, totalCount: totalCount } } AS var5
                }
                RETURN collect({ node: { relatedNode: var5, __resolveType: \\"TypeNode\\" } }) AS var6
            }
            RETURN { connection: { edges: var6, totalCount: totalCount } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
