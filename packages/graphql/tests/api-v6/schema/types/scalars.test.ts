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
                string: String!
                int: Int!
                float: Float!
                id: ID!
                boolean: Boolean!
                bigInt: BigInt!
                stringNullable: String
                intNullable: Int
                floatNullable: Float
                idNullable: ID
                booleanNullable: Boolean
                bigIntNullable: BigInt
                relatedNode: [RelatedNode!]!
                    @relationship(type: "RELATED_TO", direction: OUT, properties: "RelatedNodeProperties")
            }

            type RelatedNode @node {
                string: String!
                int: Int!
                float: Float!
                id: ID!
                boolean: Boolean!
                bigInt: BigInt!
                stringNullable: String
                intNullable: Int
                floatNullable: Float
                idNullable: ID
                booleanNullable: Boolean
                bigIntNullable: BigInt
            }

            type RelatedNodeProperties @relationshipProperties {
                string: String!
                int: Int!
                float: Float!
                id: ID!
                boolean: Boolean!
                bigInt: BigInt!
                stringNullable: String
                intNullable: Int
                floatNullable: Float
                idNullable: ID
                booleanNullable: Boolean
                bigIntNullable: BigInt
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

            input BigIntWhere {
              AND: [BigIntWhere!]
              NOT: BigIntWhere
              OR: [BigIntWhere!]
              equals: BigInt
              gt: BigInt
              gte: BigInt
              in: [BigInt!]
              lt: BigInt
              lte: BigInt
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

            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type DeleteResponse {
              info: DeleteInfo
            }

            input FloatWhere {
              AND: [FloatWhere!]
              NOT: FloatWhere
              OR: [FloatWhere!]
              equals: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            input IDWhere {
              AND: [IDWhere!]
              NOT: IDWhere
              OR: [IDWhere!]
              contains: ID
              endsWith: ID
              equals: ID
              in: [ID!]
              startsWith: ID
            }

            input IntWhere {
              AND: [IntWhere!]
              NOT: IntWhere
              OR: [IntWhere!]
              equals: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            type Mutation {
              createNodeTypes(input: [NodeTypeCreateInput!]!): NodeTypeCreateResponse
              createRelatedNodes(input: [RelatedNodeCreateInput!]!): RelatedNodeCreateResponse
              deleteNodeTypes(where: NodeTypeOperationWhere): DeleteResponse
              deleteRelatedNodes(where: RelatedNodeOperationWhere): DeleteResponse
            }

            type NodeType {
              bigInt: BigInt!
              bigIntNullable: BigInt
              boolean: Boolean!
              booleanNullable: Boolean
              float: Float!
              floatNullable: Float
              id: ID!
              idNullable: ID
              int: Int!
              intNullable: Int
              relatedNode(where: NodeTypeRelatedNodeOperationWhere): NodeTypeRelatedNodeOperation
              string: String!
              stringNullable: String
            }

            type NodeTypeConnection {
              edges: [NodeTypeEdge]
              pageInfo: PageInfo
            }

            input NodeTypeConnectionSort {
              node: NodeTypeSort
            }

            input NodeTypeCreateInput {
              node: NodeTypeCreateNode!
            }

            input NodeTypeCreateNode {
              bigInt: BigInt!
              bigIntNullable: BigInt
              boolean: Boolean!
              booleanNullable: Boolean
              float: Float!
              floatNullable: Float
              id: ID!
              idNullable: ID
              int: Int!
              intNullable: Int
              string: String!
              stringNullable: String
            }

            type NodeTypeCreateResponse {
              info: CreateInfo
              nodeTypes: [NodeType!]!
            }

            type NodeTypeEdge {
              cursor: String
              node: NodeType
            }

            type NodeTypeOperation {
              connection(after: String, first: Int, sort: [NodeTypeConnectionSort!]): NodeTypeConnection
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

            input NodeTypeRelatedNodeConnectionSort {
              edges: NodeTypeRelatedNodeEdgeSort
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
              all: NodeTypeRelatedNodeEdgeListWhere
              none: NodeTypeRelatedNodeEdgeListWhere
              single: NodeTypeRelatedNodeEdgeListWhere
              some: NodeTypeRelatedNodeEdgeListWhere
            }

            type NodeTypeRelatedNodeOperation {
              connection(after: String, first: Int, sort: [NodeTypeRelatedNodeConnectionSort!]): NodeTypeRelatedNodeConnection
            }

            input NodeTypeRelatedNodeOperationWhere {
              AND: [NodeTypeRelatedNodeOperationWhere!]
              NOT: NodeTypeRelatedNodeOperationWhere
              OR: [NodeTypeRelatedNodeOperationWhere!]
              edges: NodeTypeRelatedNodeEdgeWhere
            }

            input NodeTypeSort {
              bigInt: SortDirection
              bigIntNullable: SortDirection
              boolean: SortDirection
              booleanNullable: SortDirection
              float: SortDirection
              floatNullable: SortDirection
              id: SortDirection
              idNullable: SortDirection
              int: SortDirection
              intNullable: SortDirection
              string: SortDirection
              stringNullable: SortDirection
            }

            input NodeTypeWhere {
              AND: [NodeTypeWhere!]
              NOT: NodeTypeWhere
              OR: [NodeTypeWhere!]
              bigInt: BigIntWhere
              bigIntNullable: BigIntWhere
              boolean: BooleanWhere
              booleanNullable: BooleanWhere
              float: FloatWhere
              floatNullable: FloatWhere
              id: IDWhere
              idNullable: IDWhere
              int: IntWhere
              intNullable: IntWhere
              relatedNode: NodeTypeRelatedNodeNestedOperationWhere
              string: StringWhere
              stringNullable: StringWhere
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
              bigInt: BigInt!
              bigIntNullable: BigInt
              boolean: Boolean!
              booleanNullable: Boolean
              float: Float!
              floatNullable: Float
              id: ID!
              idNullable: ID
              int: Int!
              intNullable: Int
              string: String!
              stringNullable: String
            }

            type RelatedNodeConnection {
              edges: [RelatedNodeEdge]
              pageInfo: PageInfo
            }

            input RelatedNodeConnectionSort {
              node: RelatedNodeSort
            }

            input RelatedNodeCreateInput {
              node: RelatedNodeCreateNode!
            }

            input RelatedNodeCreateNode {
              bigInt: BigInt!
              bigIntNullable: BigInt
              boolean: Boolean!
              booleanNullable: Boolean
              float: Float!
              floatNullable: Float
              id: ID!
              idNullable: ID
              int: Int!
              intNullable: Int
              string: String!
              stringNullable: String
            }

            type RelatedNodeCreateResponse {
              info: CreateInfo
              relatedNodes: [RelatedNode!]!
            }

            type RelatedNodeEdge {
              cursor: String
              node: RelatedNode
            }

            type RelatedNodeOperation {
              connection(after: String, first: Int, sort: [RelatedNodeConnectionSort!]): RelatedNodeConnection
            }

            input RelatedNodeOperationWhere {
              AND: [RelatedNodeOperationWhere!]
              NOT: RelatedNodeOperationWhere
              OR: [RelatedNodeOperationWhere!]
              node: RelatedNodeWhere
            }

            type RelatedNodeProperties {
              bigInt: BigInt!
              bigIntNullable: BigInt
              boolean: Boolean!
              booleanNullable: Boolean
              float: Float!
              floatNullable: Float
              id: ID!
              idNullable: ID
              int: Int!
              intNullable: Int
              string: String!
              stringNullable: String
            }

            input RelatedNodePropertiesSort {
              bigInt: SortDirection
              bigIntNullable: SortDirection
              boolean: SortDirection
              booleanNullable: SortDirection
              float: SortDirection
              floatNullable: SortDirection
              id: SortDirection
              idNullable: SortDirection
              int: SortDirection
              intNullable: SortDirection
              string: SortDirection
              stringNullable: SortDirection
            }

            input RelatedNodePropertiesWhere {
              AND: [RelatedNodePropertiesWhere!]
              NOT: RelatedNodePropertiesWhere
              OR: [RelatedNodePropertiesWhere!]
              bigInt: BigIntWhere
              bigIntNullable: BigIntWhere
              boolean: BooleanWhere
              booleanNullable: BooleanWhere
              float: FloatWhere
              floatNullable: FloatWhere
              id: IDWhere
              idNullable: IDWhere
              int: IntWhere
              intNullable: IntWhere
              string: StringWhere
              stringNullable: StringWhere
            }

            input RelatedNodeSort {
              bigInt: SortDirection
              bigIntNullable: SortDirection
              boolean: SortDirection
              booleanNullable: SortDirection
              float: SortDirection
              floatNullable: SortDirection
              id: SortDirection
              idNullable: SortDirection
              int: SortDirection
              intNullable: SortDirection
              string: SortDirection
              stringNullable: SortDirection
            }

            input RelatedNodeWhere {
              AND: [RelatedNodeWhere!]
              NOT: RelatedNodeWhere
              OR: [RelatedNodeWhere!]
              bigInt: BigIntWhere
              bigIntNullable: BigIntWhere
              boolean: BooleanWhere
              booleanNullable: BooleanWhere
              float: FloatWhere
              floatNullable: FloatWhere
              id: IDWhere
              idNullable: IDWhere
              int: IntWhere
              intNullable: IntWhere
              string: StringWhere
              stringNullable: StringWhere
            }

            enum SortDirection {
              ASC
              DESC
            }

            input StringWhere {
              AND: [StringWhere!]
              NOT: StringWhere
              OR: [StringWhere!]
              contains: String
              endsWith: String
              equals: String
              in: [String!]
              startsWith: String
            }"
        `);
    });
});
