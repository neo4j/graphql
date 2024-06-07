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

describe("Scalars", () => {
    test("should generate the right types for all the scalars", async () => {
        const typeDefs = /* GraphQL */ `
            type NodeType @node {
                string: String
                int: Int
                float: Float
                id: ID
                boolean: Boolean
                relatedNode: [RelatedNode!]!
                    @relationship(type: "RELATED_TO", direction: OUT, properties: "RelatedNodeProperties")
            }

            type RelatedNode @node {
                string: String
                int: Int
                float: Float
                id: ID
                boolean: Boolean
            }

            type RelatedNodeProperties @relationshipProperties {
                string: String
                int: Int
                float: Float
                id: ID
                boolean: Boolean
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getAuraSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
            }

            input BooleanWhere {
              AND: [BooleanWhere!]
              NOT: BooleanWhere
              OR: [BooleanWhere!]
              equals: Boolean
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

            type NodeType {
              boolean: Boolean
              float: Float
              id: ID
              int: Int
              relatedNode(where: NodeTypeRelatedNodeOperationWhere): NodeTypeRelatedNodeOperation
              string: String
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
              boolean: SortDirection
              float: SortDirection
              id: SortDirection
              int: SortDirection
              string: SortDirection
            }

            input NodeTypeWhere {
              AND: [NodeTypeWhere!]
              NOT: NodeTypeWhere
              OR: [NodeTypeWhere!]
              boolean: BooleanWhere
              float: FloatWhere
              id: IDWhere
              int: IntWhere
              relatedNode: NodeTypeRelatedNodeNestedOperationWhere
              string: StringWhere
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
              boolean: Boolean
              float: Float
              id: ID
              int: Int
              string: String
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
              boolean: Boolean
              float: Float
              id: ID
              int: Int
              string: String
            }

            input RelatedNodePropertiesSort {
              boolean: SortDirection
              float: SortDirection
              id: SortDirection
              int: SortDirection
              string: SortDirection
            }

            input RelatedNodePropertiesWhere {
              AND: [RelatedNodePropertiesWhere!]
              NOT: RelatedNodePropertiesWhere
              OR: [RelatedNodePropertiesWhere!]
              boolean: BooleanWhere
              float: FloatWhere
              id: IDWhere
              int: IntWhere
              string: StringWhere
            }

            input RelatedNodeSort {
              boolean: SortDirection
              float: SortDirection
              id: SortDirection
              int: SortDirection
              string: SortDirection
            }

            input RelatedNodeWhere {
              AND: [RelatedNodeWhere!]
              NOT: RelatedNodeWhere
              OR: [RelatedNodeWhere!]
              boolean: BooleanWhere
              float: FloatWhere
              id: IDWhere
              int: IntWhere
              string: StringWhere
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
