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

describe("Scalars", () => {
    test("should generate the right types for all the scalars", async () => {
        const typeDefs = /* GraphQL */ `
            type NodeType @node {
                stringList: [String!]
                stringListNullable: [String]
                intList: [Int!]
                intListNullable: [Int]
                floatList: [Float!]
                floatListNullable: [Float]
                idList: [ID!]
                idListNullable: [ID]
                booleanList: [Boolean!]
                booleanListNullable: [Boolean]
                dateList: [Date!]
                dateListNullable: [Date]
                dateTimeList: [DateTime!]
                dateTimeListNullable: [DateTime]
                localDateTimeList: [LocalDateTime!]
                localDateTimeListNullable: [LocalDateTime]
                durationList: [Duration!]
                durationListNullable: [Duration]
                timeList: [Time!]
                timeListNullable: [Time]
                localTimeList: [LocalTime!]
                localTimeListNullable: [LocalTime]
                bigIntList: [BigInt!]
                bigIntListNullable: [BigInt]
                relatedNode: [RelatedNode!]!
                    @relationship(type: "RELATED_TO", direction: OUT, properties: "RelatedNodeProperties")
            }

            type RelatedNodeProperties @relationshipProperties {
                stringList: [String!]
                stringListNullable: [String]
                intList: [Int!]
                intListNullable: [Int]
                floatList: [Float!]
                floatListNullable: [Float]
                idList: [ID!]
                idListNullable: [ID]
                booleanList: [Boolean!]
                booleanListNullable: [Boolean]
                dateList: [Date!]
                dateListNullable: [Date]
                dateTimeList: [DateTime!]
                dateTimeListNullable: [DateTime]
                localDateTimeList: [LocalDateTime!]
                localDateTimeListNullable: [LocalDateTime]
                durationList: [Duration!]
                durationListNullable: [Duration]
                timeList: [Time!]
                timeListNullable: [Time]
                localTimeList: [LocalTime!]
                localTimeListNullable: [LocalTime]
                bigIntList: [BigInt!]
                bigIntListNullable: [BigInt]
            }

            type RelatedNode @node {
                stringList: [String!]
                stringListNullable: [String]
                intList: [Int!]
                intListNullable: [Int]
                floatList: [Float!]
                floatListNullable: [Float]
                idList: [ID!]
                idListNullable: [ID]
                booleanList: [Boolean!]
                booleanListNullable: [Boolean]
                dateList: [Date!]
                dateListNullable: [Date]
                dateTimeList: [DateTime!]
                dateTimeListNullable: [DateTime]
                localDateTimeList: [LocalDateTime!]
                localDateTimeListNullable: [LocalDateTime]
                durationList: [Duration!]
                durationListNullable: [Duration]
                timeList: [Time!]
                timeListNullable: [Time]
                localTimeList: [LocalTime!]
                localTimeListNullable: [LocalTime]
                bigIntList: [BigInt!]
                bigIntListNullable: [BigInt]
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getAuraSchema();
        raiseOnInvalidSchema(schema);
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            \\"\\"\\"
            A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.
            \\"\\"\\"
            scalar BigInt

            input BigIntListWhere {
              equals: [BigInt!]
            }

            input BigIntListWhereNullable {
              equals: [BigInt]
            }

            input BooleanWhere {
              AND: [BooleanWhere!]
              NOT: BooleanWhere
              OR: [BooleanWhere!]
              equals: Boolean
            }

            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            \\"\\"\\"A date, represented as a 'yyyy-mm-dd' string\\"\\"\\"
            scalar Date

            input DateListWhere {
              equals: [Date!]
            }

            input DateListWhereNullable {
              equals: [Date]
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            input DateTimeListWhere {
              equals: [DateTime!]
            }

            input DateTimeListWhereNullable {
              equals: [DateTime]
            }

            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            \\"\\"\\"A duration, represented as an ISO 8601 duration string\\"\\"\\"
            scalar Duration

            input DurationListWhere {
              equals: [Duration!]
            }

            input DurationListWhereNullable {
              equals: [Duration]
            }

            input FloatListWhere {
              equals: [Float!]
            }

            input FloatListWhereNullable {
              equals: [Float]
            }

            input IDListWhere {
              equals: [ID!]
            }

            input IDListWhereNullable {
              equals: [ID]
            }

            input IntListWhere {
              equals: [Int!]
            }

            input IntListWhereNullable {
              equals: [Int]
            }

            \\"\\"\\"A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'\\"\\"\\"
            scalar LocalDateTime

            input LocalDateTimeListWhere {
              equals: [LocalDateTime!]
            }

            input LocalDateTimeListWhereNullable {
              equals: [LocalDateTime]
            }

            \\"\\"\\"
            A local time, represented as a time string without timezone information
            \\"\\"\\"
            scalar LocalTime

            input LocalTimeListWhere {
              equals: [LocalTime!]
            }

            input LocalTimeListWhereNullable {
              equals: [LocalTime]
            }

            type Mutation {
              createNodeTypes(input: [NodeTypeCreateInput!]!): NodeTypeCreateResponse
              createRelatedNodes(input: [RelatedNodeCreateInput!]!): RelatedNodeCreateResponse
              deleteNodeTypes(where: NodeTypeOperationWhere): NodeTypeDeleteResponse
              deleteRelatedNodes(where: RelatedNodeOperationWhere): RelatedNodeDeleteResponse
            }

            type NodeType {
              bigIntList: [BigInt!]
              bigIntListNullable: [BigInt]
              booleanList: [Boolean!]
              booleanListNullable: [Boolean]
              dateList: [Date!]
              dateListNullable: [Date]
              dateTimeList: [DateTime!]
              dateTimeListNullable: [DateTime]
              durationList: [Duration!]
              durationListNullable: [Duration]
              floatList: [Float!]
              floatListNullable: [Float]
              idList: [ID!]
              idListNullable: [ID]
              intList: [Int!]
              intListNullable: [Int]
              localDateTimeList: [LocalDateTime!]
              localDateTimeListNullable: [LocalDateTime]
              localTimeList: [LocalTime!]
              localTimeListNullable: [LocalTime]
              relatedNode(where: NodeTypeRelatedNodeOperationWhere): NodeTypeRelatedNodeOperation
              stringList: [String!]
              stringListNullable: [String]
              timeList: [Time!]
              timeListNullable: [Time]
            }

            type NodeTypeConnection {
              edges: [NodeTypeEdge]
              pageInfo: PageInfo
            }

            input NodeTypeCreateInput {
              node: NodeTypeCreateNode!
            }

            input NodeTypeCreateNode {
              bigIntList: [BigInt!]
              bigIntListNullable: [BigInt]
              booleanList: [Boolean!]
              booleanListNullable: [Boolean]
              dateList: [Date!]
              dateListNullable: [Date]
              dateTimeList: [DateTime!]
              dateTimeListNullable: [DateTime]
              durationList: [Duration!]
              durationListNullable: [Duration]
              floatList: [Float!]
              floatListNullable: [Float]
              idList: [ID!]
              idListNullable: [ID]
              intList: [Int!]
              intListNullable: [Int]
              localDateTimeList: [LocalDateTime!]
              localDateTimeListNullable: [LocalDateTime]
              localTimeList: [LocalTime!]
              localTimeListNullable: [LocalTime]
              stringList: [String!]
              stringListNullable: [String]
              timeList: [Time!]
              timeListNullable: [Time]
            }

            type NodeTypeCreateResponse {
              info: CreateInfo
              nodeTypes: [NodeType!]!
            }

            type NodeTypeDeleteResponse {
              info: DeleteInfo
            }

            type NodeTypeEdge {
              cursor: String
              node: NodeType
            }

            type NodeTypeOperation {
              connection(after: String, first: Int): NodeTypeConnection
            }

            input NodeTypeOperationWhere {
              AND: [NodeTypeOperationWhere!]
              NOT: NodeTypeOperationWhere
              OR: [NodeTypeOperationWhere!]
              node: NodeTypeWhere
            }

            type NodeTypeRelatedNodeConnection {
              edges: [NodeTypeRelatedNodeEdge]
              pageInfo: PageInfo
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
              edges: NodeTypeRelatedNodeEdgeWhere
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
              all: NodeTypeRelatedNodeEdgeListWhere
              none: NodeTypeRelatedNodeEdgeListWhere
              single: NodeTypeRelatedNodeEdgeListWhere
              some: NodeTypeRelatedNodeEdgeListWhere
            }

            type NodeTypeRelatedNodeOperation {
              connection(after: String, first: Int): NodeTypeRelatedNodeConnection
            }

            input NodeTypeRelatedNodeOperationWhere {
              AND: [NodeTypeRelatedNodeOperationWhere!]
              NOT: NodeTypeRelatedNodeOperationWhere
              OR: [NodeTypeRelatedNodeOperationWhere!]
              edges: NodeTypeRelatedNodeEdgeWhere
            }

            input NodeTypeWhere {
              AND: [NodeTypeWhere!]
              NOT: NodeTypeWhere
              OR: [NodeTypeWhere!]
              bigIntList: BigIntListWhere
              bigIntListNullable: BigIntListWhereNullable
              booleanList: BooleanWhere
              booleanListNullable: BooleanWhere
              dateList: DateListWhere
              dateListNullable: DateListWhereNullable
              dateTimeList: DateTimeListWhere
              dateTimeListNullable: DateTimeListWhereNullable
              durationList: DurationListWhere
              durationListNullable: DurationListWhereNullable
              floatList: FloatListWhere
              floatListNullable: FloatListWhereNullable
              idList: IDListWhere
              idListNullable: IDListWhereNullable
              intList: IntListWhere
              intListNullable: IntListWhereNullable
              localDateTimeList: LocalDateTimeListWhere
              localDateTimeListNullable: LocalDateTimeListWhereNullable
              localTimeList: LocalTimeListWhere
              localTimeListNullable: LocalTimeListWhereNullable
              relatedNode: NodeTypeRelatedNodeNestedOperationWhere
              stringList: StringListWhere
              stringListNullable: StringListWhereNullable
              timeList: TimeListWhere
              timeListNullable: TimeListWhereNullable
            }

            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              nodeTypes(where: NodeTypeOperationWhere): NodeTypeOperation
              relatedNodes(where: RelatedNodeOperationWhere): RelatedNodeOperation
            }

            type RelatedNode {
              bigIntList: [BigInt!]
              bigIntListNullable: [BigInt]
              booleanList: [Boolean!]
              booleanListNullable: [Boolean]
              dateList: [Date!]
              dateListNullable: [Date]
              dateTimeList: [DateTime!]
              dateTimeListNullable: [DateTime]
              durationList: [Duration!]
              durationListNullable: [Duration]
              floatList: [Float!]
              floatListNullable: [Float]
              idList: [ID!]
              idListNullable: [ID]
              intList: [Int!]
              intListNullable: [Int]
              localDateTimeList: [LocalDateTime!]
              localDateTimeListNullable: [LocalDateTime]
              localTimeList: [LocalTime!]
              localTimeListNullable: [LocalTime]
              stringList: [String!]
              stringListNullable: [String]
              timeList: [Time!]
              timeListNullable: [Time]
            }

            type RelatedNodeConnection {
              edges: [RelatedNodeEdge]
              pageInfo: PageInfo
            }

            input RelatedNodeCreateInput {
              node: RelatedNodeCreateNode!
            }

            input RelatedNodeCreateNode {
              bigIntList: [BigInt!]
              bigIntListNullable: [BigInt]
              booleanList: [Boolean!]
              booleanListNullable: [Boolean]
              dateList: [Date!]
              dateListNullable: [Date]
              dateTimeList: [DateTime!]
              dateTimeListNullable: [DateTime]
              durationList: [Duration!]
              durationListNullable: [Duration]
              floatList: [Float!]
              floatListNullable: [Float]
              idList: [ID!]
              idListNullable: [ID]
              intList: [Int!]
              intListNullable: [Int]
              localDateTimeList: [LocalDateTime!]
              localDateTimeListNullable: [LocalDateTime]
              localTimeList: [LocalTime!]
              localTimeListNullable: [LocalTime]
              stringList: [String!]
              stringListNullable: [String]
              timeList: [Time!]
              timeListNullable: [Time]
            }

            type RelatedNodeCreateResponse {
              info: CreateInfo
              relatedNodes: [RelatedNode!]!
            }

            type RelatedNodeDeleteResponse {
              info: DeleteInfo
            }

            type RelatedNodeEdge {
              cursor: String
              node: RelatedNode
            }

            type RelatedNodeOperation {
              connection(after: String, first: Int): RelatedNodeConnection
            }

            input RelatedNodeOperationWhere {
              AND: [RelatedNodeOperationWhere!]
              NOT: RelatedNodeOperationWhere
              OR: [RelatedNodeOperationWhere!]
              node: RelatedNodeWhere
            }

            type RelatedNodeProperties {
              bigIntList: [BigInt!]
              bigIntListNullable: [BigInt]
              booleanList: [Boolean!]
              booleanListNullable: [Boolean]
              dateList: [Date!]
              dateListNullable: [Date]
              dateTimeList: [DateTime!]
              dateTimeListNullable: [DateTime]
              durationList: [Duration!]
              durationListNullable: [Duration]
              floatList: [Float!]
              floatListNullable: [Float]
              idList: [ID!]
              idListNullable: [ID]
              intList: [Int!]
              intListNullable: [Int]
              localDateTimeList: [LocalDateTime!]
              localDateTimeListNullable: [LocalDateTime]
              localTimeList: [LocalTime!]
              localTimeListNullable: [LocalTime]
              stringList: [String!]
              stringListNullable: [String]
              timeList: [Time!]
              timeListNullable: [Time]
            }

            input RelatedNodePropertiesWhere {
              AND: [RelatedNodePropertiesWhere!]
              NOT: RelatedNodePropertiesWhere
              OR: [RelatedNodePropertiesWhere!]
              bigIntList: BigIntListWhere
              bigIntListNullable: BigIntListWhereNullable
              booleanList: BooleanWhere
              booleanListNullable: BooleanWhere
              dateList: DateListWhere
              dateListNullable: DateListWhereNullable
              dateTimeList: DateTimeListWhere
              dateTimeListNullable: DateTimeListWhereNullable
              durationList: DurationListWhere
              durationListNullable: DurationListWhereNullable
              floatList: FloatListWhere
              floatListNullable: FloatListWhereNullable
              idList: IDListWhere
              idListNullable: IDListWhereNullable
              intList: IntListWhere
              intListNullable: IntListWhereNullable
              localDateTimeList: LocalDateTimeListWhere
              localDateTimeListNullable: LocalDateTimeListWhereNullable
              localTimeList: LocalTimeListWhere
              localTimeListNullable: LocalTimeListWhereNullable
              stringList: StringListWhere
              stringListNullable: StringListWhereNullable
              timeList: TimeListWhere
              timeListNullable: TimeListWhereNullable
            }

            input RelatedNodeWhere {
              AND: [RelatedNodeWhere!]
              NOT: RelatedNodeWhere
              OR: [RelatedNodeWhere!]
              bigIntList: BigIntListWhere
              bigIntListNullable: BigIntListWhereNullable
              booleanList: BooleanWhere
              booleanListNullable: BooleanWhere
              dateList: DateListWhere
              dateListNullable: DateListWhereNullable
              dateTimeList: DateTimeListWhere
              dateTimeListNullable: DateTimeListWhereNullable
              durationList: DurationListWhere
              durationListNullable: DurationListWhereNullable
              floatList: FloatListWhere
              floatListNullable: FloatListWhereNullable
              idList: IDListWhere
              idListNullable: IDListWhereNullable
              intList: IntListWhere
              intListNullable: IntListWhereNullable
              localDateTimeList: LocalDateTimeListWhere
              localDateTimeListNullable: LocalDateTimeListWhereNullable
              localTimeList: LocalTimeListWhere
              localTimeListNullable: LocalTimeListWhereNullable
              stringList: StringListWhere
              stringListNullable: StringListWhereNullable
              timeList: TimeListWhere
              timeListNullable: TimeListWhereNullable
            }

            input StringListWhere {
              equals: [String!]
            }

            input StringListWhereNullable {
              equals: [String]
            }

            \\"\\"\\"A time, represented as an RFC3339 time string\\"\\"\\"
            scalar Time

            input TimeListWhere {
              equals: [Time!]
            }

            input TimeListWhereNullable {
              equals: [Time]
            }"
        `);
    });
});
