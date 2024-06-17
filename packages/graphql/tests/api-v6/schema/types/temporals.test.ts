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

import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../../../src";
import { raiseOnInvalidSchema } from "../../../utils/raise-on-invalid-schema";

describe("Temporals", () => {
    test("should generate the right types for all the temporal types", async () => {
        const typeDefs = /* GraphQL */ `
            type NodeType @node {
                date: Date
                dateTime: DateTime
                localDateTime: LocalDateTime
                duration: Duration
                time: Time
                localTime: LocalTime
                relatedNode: [RelatedNode!]!
                    @relationship(type: "RELATED_TO", direction: OUT, properties: "RelatedNodeProperties")
            }

            type RelatedNode @node {
                date: Date
                dateTime: DateTime
                localDateTime: LocalDateTime
                duration: Duration
                time: Time
                localTime: LocalTime
            }

            type RelatedNodeProperties @relationshipProperties {
                date: Date
                dateTime: DateTime
                localDateTime: LocalDateTime
                duration: Duration
                time: Time
                localTime: LocalTime
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getAuraSchema();
        raiseOnInvalidSchema(schema);
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
            }

            \\"\\"\\"A date, represented as a 'yyyy-mm-dd' string\\"\\"\\"
            scalar Date

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            input DateTimeWhere {
              AND: [DateTimeWhere!]
              NOT: DateTimeWhere
              OR: [DateTimeWhere!]
              equals: DateTime
              gt: DateTime
              gte: DateTime
              in: [DateTime!]
              lt: DateTime
              lte: DateTime
            }

            input DateWhere {
              AND: [DateWhere!]
              NOT: DateWhere
              OR: [DateWhere!]
              equals: Date
              gt: Date
              gte: Date
              in: [Date!]
              lt: Date
              lte: Date
            }

            \\"\\"\\"A duration, represented as an ISO 8601 duration string\\"\\"\\"
            scalar Duration

            input DurationWhere {
              AND: [DurationWhere!]
              NOT: DurationWhere
              OR: [DurationWhere!]
              equals: Duration
              gt: Duration
              gte: Duration
              in: [Duration!]
              lt: Duration
              lte: Duration
            }

            \\"\\"\\"A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'\\"\\"\\"
            scalar LocalDateTime

            input LocalDateTimeWhere {
              AND: [LocalDateTimeWhere!]
              NOT: LocalDateTimeWhere
              OR: [LocalDateTimeWhere!]
              equals: LocalDateTime
              gt: LocalDateTime
              gte: LocalDateTime
              in: [LocalDateTime!]
              lt: LocalDateTime
              lte: LocalDateTime
            }

            \\"\\"\\"
            A local time, represented as a time string without timezone information
            \\"\\"\\"
            scalar LocalTime

            input LocalTimeWhere {
              AND: [LocalTimeWhere!]
              NOT: LocalTimeWhere
              OR: [LocalTimeWhere!]
              equals: LocalTime
              gt: LocalTime
              gte: LocalTime
              in: [LocalTime!]
              lt: LocalTime
              lte: LocalTime
            }

            type NodeType {
              date: Date
              dateTime: DateTime
              duration: Duration
              localDateTime: LocalDateTime
              localTime: LocalTime
              relatedNode(where: NodeTypeRelatedNodeOperationWhere): NodeTypeRelatedNodeOperation
              time: Time
            }

            type NodeTypeConnection {
              edges: [NodeTypeEdge]
              pageInfo: PageInfo
            }

            input NodeTypeConnectionSort {
              edges: [NodeTypeEdgeSort!]
            }

            type NodeTypeEdge {
              cursor: String
              node: NodeType
            }

            input NodeTypeEdgeSort {
              node: NodeTypeSort
            }

            input NodeTypeEdgeWhere {
              AND: [NodeTypeEdgeWhere!]
              NOT: NodeTypeEdgeWhere
              OR: [NodeTypeEdgeWhere!]
              node: NodeTypeWhere
            }

            type NodeTypeOperation {
              connection(after: String, first: Int, sort: NodeTypeConnectionSort): NodeTypeConnection
            }

            input NodeTypeOperationWhere {
              AND: [NodeTypeOperationWhere!]
              NOT: NodeTypeOperationWhere
              OR: [NodeTypeOperationWhere!]
              edges: NodeTypeEdgeWhere
            }

            type NodeTypeRelatedNodeConnection {
              edges: [NodeTypeRelatedNodeEdge]
              pageInfo: PageInfo
            }

            input NodeTypeRelatedNodeConnectionSort {
              edges: [NodeTypeRelatedNodeEdgeSort!]
            }

            type NodeTypeRelatedNodeEdge {
              cursor: String
              node: RelatedNode
              properties: RelatedNodeProperties
            }

            input NodeTypeRelatedNodeEdgeListWhere {
              AND: [NodeTypeRelatedNodeEdgeListWhere!]
              NOT: NodeTypeRelatedNodeEdgeListWhere
              OR: [NodeTypeRelatedNodeEdgeListWhere!]
              all: NodeTypeRelatedNodeEdgeWhere
              none: NodeTypeRelatedNodeEdgeWhere
              single: NodeTypeRelatedNodeEdgeWhere
              some: NodeTypeRelatedNodeEdgeWhere
            }

            input NodeTypeRelatedNodeEdgeSort {
              node: RelatedNodeSort
              properties: RelatedNodePropertiesSort
            }

            input NodeTypeRelatedNodeEdgeWhere {
              AND: [NodeTypeRelatedNodeEdgeWhere!]
              NOT: NodeTypeRelatedNodeEdgeWhere
              OR: [NodeTypeRelatedNodeEdgeWhere!]
              node: RelatedNodeWhere
              properties: RelatedNodePropertiesWhere
            }

            input NodeTypeRelatedNodeNestedOperationWhere {
              AND: [NodeTypeRelatedNodeNestedOperationWhere!]
              NOT: NodeTypeRelatedNodeNestedOperationWhere
              OR: [NodeTypeRelatedNodeNestedOperationWhere!]
              edges: NodeTypeRelatedNodeEdgeListWhere
            }

            type NodeTypeRelatedNodeOperation {
              connection(after: String, first: Int, sort: NodeTypeRelatedNodeConnectionSort): NodeTypeRelatedNodeConnection
            }

            input NodeTypeRelatedNodeOperationWhere {
              AND: [NodeTypeRelatedNodeOperationWhere!]
              NOT: NodeTypeRelatedNodeOperationWhere
              OR: [NodeTypeRelatedNodeOperationWhere!]
              edges: NodeTypeRelatedNodeEdgeWhere
            }

            input NodeTypeSort {
              date: SortDirection
              dateTime: SortDirection
              duration: SortDirection
              localDateTime: SortDirection
              localTime: SortDirection
              time: SortDirection
            }

            input NodeTypeWhere {
              AND: [NodeTypeWhere!]
              NOT: NodeTypeWhere
              OR: [NodeTypeWhere!]
              date: DateWhere
              dateTime: DateTimeWhere
              duration: DurationWhere
              localDateTime: LocalDateTimeWhere
              localTime: LocalTimeWhere
              relatedNode: NodeTypeRelatedNodeNestedOperationWhere
              time: TimeWhere
            }

            type PageInfo {
              endCursor: String
              hasNextPage: Boolean
              hasPreviousPage: Boolean
              startCursor: String
            }

            type Query {
              nodeTypes(where: NodeTypeOperationWhere): NodeTypeOperation
              relatedNodes(where: RelatedNodeOperationWhere): RelatedNodeOperation
            }

            type RelatedNode {
              date: Date
              dateTime: DateTime
              duration: Duration
              localDateTime: LocalDateTime
              localTime: LocalTime
              time: Time
            }

            type RelatedNodeConnection {
              edges: [RelatedNodeEdge]
              pageInfo: PageInfo
            }

            input RelatedNodeConnectionSort {
              edges: [RelatedNodeEdgeSort!]
            }

            type RelatedNodeEdge {
              cursor: String
              node: RelatedNode
            }

            input RelatedNodeEdgeSort {
              node: RelatedNodeSort
            }

            input RelatedNodeEdgeWhere {
              AND: [RelatedNodeEdgeWhere!]
              NOT: RelatedNodeEdgeWhere
              OR: [RelatedNodeEdgeWhere!]
              node: RelatedNodeWhere
            }

            type RelatedNodeOperation {
              connection(after: String, first: Int, sort: RelatedNodeConnectionSort): RelatedNodeConnection
            }

            input RelatedNodeOperationWhere {
              AND: [RelatedNodeOperationWhere!]
              NOT: RelatedNodeOperationWhere
              OR: [RelatedNodeOperationWhere!]
              edges: RelatedNodeEdgeWhere
            }

            type RelatedNodeProperties {
              date: Date
              dateTime: DateTime
              duration: Duration
              localDateTime: LocalDateTime
              localTime: LocalTime
              time: Time
            }

            input RelatedNodePropertiesSort {
              date: SortDirection
              dateTime: SortDirection
              duration: SortDirection
              localDateTime: SortDirection
              localTime: SortDirection
              time: SortDirection
            }

            input RelatedNodePropertiesWhere {
              AND: [RelatedNodePropertiesWhere!]
              NOT: RelatedNodePropertiesWhere
              OR: [RelatedNodePropertiesWhere!]
              date: DateWhere
              dateTime: DateTimeWhere
              duration: DurationWhere
              localDateTime: LocalDateTimeWhere
              localTime: LocalTimeWhere
              time: TimeWhere
            }

            input RelatedNodeSort {
              date: SortDirection
              dateTime: SortDirection
              duration: SortDirection
              localDateTime: SortDirection
              localTime: SortDirection
              time: SortDirection
            }

            input RelatedNodeWhere {
              AND: [RelatedNodeWhere!]
              NOT: RelatedNodeWhere
              OR: [RelatedNodeWhere!]
              date: DateWhere
              dateTime: DateTimeWhere
              duration: DurationWhere
              localDateTime: LocalDateTimeWhere
              localTime: LocalTimeWhere
              time: TimeWhere
            }

            enum SortDirection {
              ASC
              DESC
            }

            \\"\\"\\"A time, represented as an RFC3339 time string\\"\\"\\"
            scalar Time

            input TimeWhere {
              AND: [TimeWhere!]
              NOT: TimeWhere
              OR: [TimeWhere!]
              equals: Time
              gt: Time
              gte: Time
              in: [Time!]
              lt: Time
              lte: Time
            }"
        `);
    });
});
