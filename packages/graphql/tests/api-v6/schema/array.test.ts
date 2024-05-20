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
import { Neo4jGraphQL } from "../../../src";

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
                relatedNode: [RelatedNode!]!
                    @relationship(type: "RELATED_TO", direction: OUT, properties: "RelatedNodeProperties")
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
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getAuraSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
            }

            input FloatListWhere {
              equals: [Float!]
            }

            input FloatListWhereNullable {
              equals: [Float]
            }

            input IDListWhere {
              equals: [String!]
            }

            input IDListWhereNullable {
              equals: [String]
            }

            input IntListWhere {
              equals: [Int!]
            }

            input IntListWhereNullable {
              equals: [Int]
            }

            type NodeType {
              booleanList: [Boolean!]
              booleanListNullable: [Boolean]
              floatList: [Float!]
              floatListNullable: [Float]
              idList: [ID!]
              idListNullable: [ID]
              intList: [Int!]
              intListNullable: [Int]
              relatedNode(where: NodeTypeRelatedNodeOperationWhere): NodeTypeRelatedNodeOperation
              stringList: [String!]
              stringListNullable: [String]
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
              connection(sort: NodeTypeConnectionSort): NodeTypeConnection
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

            type NodeTypeRelatedNodeOperation {
              connection(sort: NodeTypeRelatedNodeConnectionSort): NodeTypeRelatedNodeConnection
            }

            input NodeTypeRelatedNodeOperationWhere {
              AND: [NodeTypeRelatedNodeOperationWhere!]
              NOT: NodeTypeRelatedNodeOperationWhere
              OR: [NodeTypeRelatedNodeOperationWhere!]
              edges: NodeTypeRelatedNodeEdgeWhere
            }

            input NodeTypeSort

            input NodeTypeWhere {
              AND: [NodeTypeWhere!]
              NOT: NodeTypeWhere
              OR: [NodeTypeWhere!]
              floatList: FloatListWhere
              floatListNullable: FloatListWhereNullable
              idList: IDListWhere
              idListNullable: IDListWhereNullable
              intList: IntListWhere
              intListNullable: IntListWhereNullable
              stringList: StringListWhere
              stringListNullable: StringListWhereNullable
            }

            type PageInfo {
              hasNextPage: Boolean
              hasPreviousPage: Boolean
            }

            type Query {
              nodeTypes(where: NodeTypeOperationWhere): NodeTypeOperation
              relatedNodes(where: RelatedNodeOperationWhere): RelatedNodeOperation
            }

            type RelatedNode {
              booleanList: [Boolean!]
              booleanListNullable: [Boolean]
              floatList: [Float!]
              floatListNullable: [Float]
              idList: [ID!]
              idListNullable: [ID]
              intList: [Int!]
              intListNullable: [Int]
              stringList: [String!]
              stringListNullable: [String]
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
              connection(sort: RelatedNodeConnectionSort): RelatedNodeConnection
            }

            input RelatedNodeOperationWhere {
              AND: [RelatedNodeOperationWhere!]
              NOT: RelatedNodeOperationWhere
              OR: [RelatedNodeOperationWhere!]
              edges: RelatedNodeEdgeWhere
            }

            type RelatedNodeProperties {
              booleanList: [Boolean!]
              booleanListNullable: [Boolean]
              floatList: [Float!]
              floatListNullable: [Float]
              idList: [ID!]
              idListNullable: [ID]
              intList: [Int!]
              intListNullable: [Int]
              stringList: [String!]
              stringListNullable: [String]
            }

            input RelatedNodePropertiesSort {
              booleanList: SortDirection
              booleanListNullable: SortDirection
              floatList: SortDirection
              floatListNullable: SortDirection
              idList: SortDirection
              idListNullable: SortDirection
              intList: SortDirection
              intListNullable: SortDirection
              stringList: SortDirection
              stringListNullable: SortDirection
            }

            input RelatedNodePropertiesWhere {
              AND: [RelatedNodePropertiesWhere!]
              NOT: RelatedNodePropertiesWhere
              OR: [RelatedNodePropertiesWhere!]
              floatList: FloatListWhere
              floatListNullable: FloatListWhereNullable
              idList: IDListWhere
              idListNullable: IDListWhereNullable
              intList: IntListWhere
              intListNullable: IntListWhereNullable
              stringList: StringListWhere
              stringListNullable: StringListWhereNullable
            }

            input RelatedNodeSort

            input RelatedNodeWhere {
              AND: [RelatedNodeWhere!]
              NOT: RelatedNodeWhere
              OR: [RelatedNodeWhere!]
              floatList: FloatListWhere
              floatListNullable: FloatListWhereNullable
              idList: IDListWhere
              idListNullable: IDListWhereNullable
              intList: IntListWhere
              intListNullable: IntListWhereNullable
              stringList: StringListWhere
              stringListNullable: StringListWhereNullable
            }

            enum SortDirection {
              ASC
              DESC
            }

            input StringListWhere {
              equals: [String!]
            }

            input StringListWhereNullable {
              equals: [String]
            }"
        `);
    });
});
