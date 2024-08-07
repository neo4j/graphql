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

describe("Spatial Types", () => {
    test("should generate the right types for all the spatial types", async () => {
        const typeDefs = /* GraphQL */ `
            type NodeType @node {
                cartesianPoint: CartesianPoint!
                cartesianPointNullable: CartesianPoint
                point: Point!
                pointNullable: Point
                relatedNode: [RelatedNode!]!
                    @relationship(type: "RELATED_TO", direction: OUT, properties: "RelatedNodeProperties")
            }

            type RelatedNode @node {
                cartesianPoint: CartesianPoint!
                cartesianPointNullable: CartesianPoint
                point: Point!
                pointNullable: Point
            }

            type RelatedNodeProperties @relationshipProperties {
                cartesianPoint: CartesianPoint!
                cartesianPointNullable: CartesianPoint
                point: Point!
                pointNullable: Point
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
            A point in a two- or three-dimensional Cartesian coordinate system or in a three-dimensional cylindrical coordinate system. For more information, see https://neo4j.com/docs/graphql/4/type-definitions/types/spatial/#cartesian-point
            \\"\\"\\"
            type CartesianPoint {
              crs: String!
              srid: Int!
              x: Float!
              y: Float!
              z: Float
            }

            \\"\\"\\"Input type for a cartesian point\\"\\"\\"
            input CartesianPointInput {
              x: Float!
              y: Float!
              z: Float
            }

            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createNodeTypes(input: [NodeTypeCreateInput!]!): NodeTypeCreateResponse
              createRelatedNodes(input: [RelatedNodeCreateInput!]!): RelatedNodeCreateResponse
              deleteNodeTypes(where: NodeTypeOperationWhere): NodeTypeDeleteResponse
              deleteRelatedNodes(where: RelatedNodeOperationWhere): RelatedNodeDeleteResponse
            }

            type NodeType {
              cartesianPoint: CartesianPoint!
              cartesianPointNullable: CartesianPoint
              point: Point!
              pointNullable: Point
              relatedNode(where: NodeTypeRelatedNodeOperationWhere): NodeTypeRelatedNodeOperation
            }

            type NodeTypeConnection {
              edges: [NodeTypeEdge]
              pageInfo: PageInfo
            }

            input NodeTypeCreateInput {
              node: NodeTypeCreateNode!
            }

            input NodeTypeCreateNode {
              cartesianPoint: CartesianPointInput!
              cartesianPointNullable: CartesianPointInput
              point: PointInput!
              pointNullable: PointInput
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
              relatedNode: NodeTypeRelatedNodeNestedOperationWhere
            }

            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            \\"\\"\\"
            A point in a coordinate system. For more information, see https://neo4j.com/docs/graphql/4/type-definitions/types/spatial/#point
            \\"\\"\\"
            type Point {
              crs: String!
              height: Float
              latitude: Float!
              longitude: Float!
              srid: Int!
            }

            \\"\\"\\"Input type for a point\\"\\"\\"
            input PointInput {
              height: Float
              latitude: Float!
              longitude: Float!
            }

            type Query {
              nodeTypes(where: NodeTypeOperationWhere): NodeTypeOperation
              relatedNodes(where: RelatedNodeOperationWhere): RelatedNodeOperation
            }

            type RelatedNode {
              cartesianPoint: CartesianPoint!
              cartesianPointNullable: CartesianPoint
              point: Point!
              pointNullable: Point
            }

            type RelatedNodeConnection {
              edges: [RelatedNodeEdge]
              pageInfo: PageInfo
            }

            input RelatedNodeCreateInput {
              node: RelatedNodeCreateNode!
            }

            input RelatedNodeCreateNode {
              cartesianPoint: CartesianPointInput!
              cartesianPointNullable: CartesianPointInput
              point: PointInput!
              pointNullable: PointInput
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
              cartesianPoint: CartesianPoint!
              cartesianPointNullable: CartesianPoint
              point: Point!
              pointNullable: Point
            }

            input RelatedNodePropertiesWhere {
              AND: [RelatedNodePropertiesWhere!]
              NOT: RelatedNodePropertiesWhere
              OR: [RelatedNodePropertiesWhere!]
            }

            input RelatedNodeWhere {
              AND: [RelatedNodeWhere!]
              NOT: RelatedNodeWhere
              OR: [RelatedNodeWhere!]
            }"
        `);
    });
});
