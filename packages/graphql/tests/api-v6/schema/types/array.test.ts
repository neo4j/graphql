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
                intList: [Int!]
                floatList: [Float!]
                idList: [ID!]
                booleanList: [Boolean!]
                dateList: [Date!]
                dateTimeList: [DateTime!]
                localDateTimeList: [LocalDateTime!]
                durationList: [Duration!]
                timeList: [Time!]
                localTimeList: [LocalTime!]
                bigIntList: [BigInt!]
                relatedNode: [RelatedNode!]!
                    @relationship(type: "RELATED_TO", direction: OUT, properties: "RelatedNodeProperties")
            }

            type RelatedNodeProperties @relationshipProperties {
                stringList: [String!]
                intList: [Int!]
                floatList: [Float!]
                idList: [ID!]
                booleanList: [Boolean!]
                dateList: [Date!]
                dateTimeList: [DateTime!]
                localDateTimeList: [LocalDateTime!]
                durationList: [Duration!]
                timeList: [Time!]
                localTimeList: [LocalTime!]
                bigIntList: [BigInt!]
            }

            type RelatedNode @node {
                stringList: [String!]
                intList: [Int!]
                floatList: [Float!]
                idList: [ID!]
                booleanList: [Boolean!]
                dateList: [Date!]
                dateTimeList: [DateTime!]
                localDateTimeList: [LocalDateTime!]
                durationList: [Duration!]
                timeList: [Time!]
                localTimeList: [LocalTime!]
                bigIntList: [BigInt!]
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

            input BigIntUpdate {
              set: BigInt
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

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            input DateTimeListWhere {
              equals: [DateTime!]
            }

            input DateTimeUpdate {
              set: DateTime
            }

            input DateUpdate {
              set: Date
            }

            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type DeleteResponse {
              info: DeleteInfo
            }

            \\"\\"\\"A duration, represented as an ISO 8601 duration string\\"\\"\\"
            scalar Duration

            input DurationListWhere {
              equals: [Duration!]
            }

            input DurationUpdate {
              set: Duration
            }

            input FloatListWhere {
              equals: [Float!]
            }

            input FloatUpdate {
              set: Float
            }

            input IDListWhere {
              equals: [ID!]
            }

            input IDUpdate {
              set: ID
            }

            input IntListWhere {
              equals: [Int!]
            }

            input IntUpdate {
              set: Int
            }

            \\"\\"\\"A local datetime, represented as 'YYYY-MM-DDTHH:MM:SS'\\"\\"\\"
            scalar LocalDateTime

            input LocalDateTimeListWhere {
              equals: [LocalDateTime!]
            }

            input LocalDateTimeUpdate {
              set: LocalDateTime
            }

            \\"\\"\\"
            A local time, represented as a time string without timezone information
            \\"\\"\\"
            scalar LocalTime

            input LocalTimeListWhere {
              equals: [LocalTime!]
            }

            input LocalTimeUpdate {
              set: LocalTime
            }

            type Mutation {
              createNodeTypes(input: [NodeTypeCreateInput!]!): NodeTypeCreateResponse
              createRelatedNodes(input: [RelatedNodeCreateInput!]!): RelatedNodeCreateResponse
              deleteNodeTypes(input: NodeTypeDeleteInput, where: NodeTypeOperationWhere): DeleteResponse
              deleteRelatedNodes(input: RelatedNodeDeleteInput, where: RelatedNodeOperationWhere): DeleteResponse
              updateNodeTypes(input: NodeTypeUpdateInput!, where: NodeTypeOperationWhere): NodeTypeUpdateResponse
              updateRelatedNodes(input: RelatedNodeUpdateInput!, where: RelatedNodeOperationWhere): RelatedNodeUpdateResponse
            }

            type NodeType {
              bigIntList: [BigInt!]
              booleanList: [Boolean!]
              dateList: [Date!]
              dateTimeList: [DateTime!]
              durationList: [Duration!]
              floatList: [Float!]
              idList: [ID!]
              intList: [Int!]
              localDateTimeList: [LocalDateTime!]
              localTimeList: [LocalTime!]
              relatedNode(where: NodeTypeRelatedNodeOperationWhere): NodeTypeRelatedNodeOperation
              stringList: [String!]
              timeList: [Time!]
            }

            type NodeTypeConnection {
              edges: [NodeTypeEdge]
              pageInfo: PageInfo
            }

            type NodeTypeCreateInfo {
              nodesCreated: Int!
              nodesDelete: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            input NodeTypeCreateInput {
              node: NodeTypeCreateNode!
            }

            input NodeTypeCreateNode {
              bigIntList: [BigInt!]
              booleanList: [Boolean!]
              dateList: [Date!]
              dateTimeList: [DateTime!]
              durationList: [Duration!]
              floatList: [Float!]
              idList: [ID!]
              intList: [Int!]
              localDateTimeList: [LocalDateTime!]
              localTimeList: [LocalTime!]
              stringList: [String!]
              timeList: [Time!]
            }

            type NodeTypeCreateResponse {
              info: CreateInfo
              nodeTypes: [NodeType!]!
            }

            input NodeTypeDeleteInput {
              node: NodeTypeDeleteNode
            }

            input NodeTypeDeleteNode {
              relatedNode: NodeTypeRelatedNodeDeleteOperation
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

            input NodeTypeRelatedNodeDeleteInput {
              input: RelatedNodeDeleteInput
              where: NodeTypeRelatedNodeOperationWhere
            }

            input NodeTypeRelatedNodeDeleteOperation {
              delete: NodeTypeRelatedNodeDeleteInput
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

            input NodeTypeUpdateInput {
              node: NodeTypeUpdateNode!
            }

            input NodeTypeUpdateNode {
              bigIntList: BigIntUpdate
              booleanList: IntUpdate
              dateList: DateUpdate
              dateTimeList: DateTimeUpdate
              durationList: DurationUpdate
              floatList: FloatUpdate
              idList: IDUpdate
              intList: IntUpdate
              localDateTimeList: LocalDateTimeUpdate
              localTimeList: LocalTimeUpdate
              stringList: StringUpdate
              timeList: TimeUpdate
            }

            type NodeTypeUpdateResponse {
              info: NodeTypeCreateInfo
              nodeTypes: [NodeType!]!
            }

            input NodeTypeWhere {
              AND: [NodeTypeWhere!]
              NOT: NodeTypeWhere
              OR: [NodeTypeWhere!]
              bigIntList: BigIntListWhere
              booleanList: BooleanWhere
              dateList: DateListWhere
              dateTimeList: DateTimeListWhere
              durationList: DurationListWhere
              floatList: FloatListWhere
              idList: IDListWhere
              intList: IntListWhere
              localDateTimeList: LocalDateTimeListWhere
              localTimeList: LocalTimeListWhere
              relatedNode: NodeTypeRelatedNodeNestedOperationWhere
              stringList: StringListWhere
              timeList: TimeListWhere
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
              booleanList: [Boolean!]
              dateList: [Date!]
              dateTimeList: [DateTime!]
              durationList: [Duration!]
              floatList: [Float!]
              idList: [ID!]
              intList: [Int!]
              localDateTimeList: [LocalDateTime!]
              localTimeList: [LocalTime!]
              stringList: [String!]
              timeList: [Time!]
            }

            type RelatedNodeConnection {
              edges: [RelatedNodeEdge]
              pageInfo: PageInfo
            }

            type RelatedNodeCreateInfo {
              nodesCreated: Int!
              nodesDelete: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            input RelatedNodeCreateInput {
              node: RelatedNodeCreateNode!
            }

            input RelatedNodeCreateNode {
              bigIntList: [BigInt!]
              booleanList: [Boolean!]
              dateList: [Date!]
              dateTimeList: [DateTime!]
              durationList: [Duration!]
              floatList: [Float!]
              idList: [ID!]
              intList: [Int!]
              localDateTimeList: [LocalDateTime!]
              localTimeList: [LocalTime!]
              stringList: [String!]
              timeList: [Time!]
            }

            type RelatedNodeCreateResponse {
              info: CreateInfo
              relatedNodes: [RelatedNode!]!
            }

            input RelatedNodeDeleteInput {
              node: RelatedNodeDeleteNode
            }

            input RelatedNodeDeleteNode {
              _emptyInput: Boolean
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
              booleanList: [Boolean!]
              dateList: [Date!]
              dateTimeList: [DateTime!]
              durationList: [Duration!]
              floatList: [Float!]
              idList: [ID!]
              intList: [Int!]
              localDateTimeList: [LocalDateTime!]
              localTimeList: [LocalTime!]
              stringList: [String!]
              timeList: [Time!]
            }

            input RelatedNodePropertiesWhere {
              AND: [RelatedNodePropertiesWhere!]
              NOT: RelatedNodePropertiesWhere
              OR: [RelatedNodePropertiesWhere!]
              bigIntList: BigIntListWhere
              booleanList: BooleanWhere
              dateList: DateListWhere
              dateTimeList: DateTimeListWhere
              durationList: DurationListWhere
              floatList: FloatListWhere
              idList: IDListWhere
              intList: IntListWhere
              localDateTimeList: LocalDateTimeListWhere
              localTimeList: LocalTimeListWhere
              stringList: StringListWhere
              timeList: TimeListWhere
            }

            input RelatedNodeUpdateInput {
              node: RelatedNodeUpdateNode!
            }

            input RelatedNodeUpdateNode {
              bigIntList: BigIntUpdate
              booleanList: IntUpdate
              dateList: DateUpdate
              dateTimeList: DateTimeUpdate
              durationList: DurationUpdate
              floatList: FloatUpdate
              idList: IDUpdate
              intList: IntUpdate
              localDateTimeList: LocalDateTimeUpdate
              localTimeList: LocalTimeUpdate
              stringList: StringUpdate
              timeList: TimeUpdate
            }

            type RelatedNodeUpdateResponse {
              info: RelatedNodeCreateInfo
              relatedNodes: [RelatedNode!]!
            }

            input RelatedNodeWhere {
              AND: [RelatedNodeWhere!]
              NOT: RelatedNodeWhere
              OR: [RelatedNodeWhere!]
              bigIntList: BigIntListWhere
              booleanList: BooleanWhere
              dateList: DateListWhere
              dateTimeList: DateTimeListWhere
              durationList: DurationListWhere
              floatList: FloatListWhere
              idList: IDListWhere
              intList: IntListWhere
              localDateTimeList: LocalDateTimeListWhere
              localTimeList: LocalTimeListWhere
              stringList: StringListWhere
              timeList: TimeListWhere
            }

            input StringListWhere {
              equals: [String!]
            }

            input StringUpdate {
              set: String
            }

            \\"\\"\\"A time, represented as an RFC3339 time string\\"\\"\\"
            scalar Time

            input TimeListWhere {
              equals: [Time!]
            }

            input TimeUpdate {
              set: Time
            }"
        `);
    });
});
