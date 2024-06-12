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

            \\"\\"\\"Input type for a cartesian point with a distance\\"\\"\\"
            input CartesianPointDistance {
              distance: Float!
              point: CartesianPointInput!
            }

            \\"\\"\\"Input type for a cartesian point\\"\\"\\"
            input CartesianPointInput {
              x: Float!
              y: Float!
              z: Float
            }

            input CartesianPointWhere {
              AND: [CartesianPointWhere!]
              NOT: CartesianPointWhere
              OR: [CartesianPointWhere!]
              distance: CartesianPointDistance
              equals: CartesianPointInput
              gt: CartesianPointDistance
              gte: CartesianPointDistance
              in: [CartesianPointInput!]
              lt: CartesianPointDistance
              lte: CartesianPointDistance
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

            type NodeTypeEdge {
              cursor: String
              node: NodeType
            }

            input NodeTypeEdgeWhere {
              AND: [NodeTypeEdgeWhere!]
              NOT: NodeTypeEdgeWhere
              OR: [NodeTypeEdgeWhere!]
              node: NodeTypeWhere
            }

            type NodeTypeOperation {
              connection(after: String, first: Int): NodeTypeConnection
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
              cartesianPoint: CartesianPointWhere
              cartesianPointNullable: CartesianPointWhere
              point: PointWhere
              pointNullable: PointWhere
              relatedNode: NodeTypeRelatedNodeNestedOperationWhere
            }

            type PageInfo {
              hasNextPage: Boolean
              hasPreviousPage: Boolean
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

            \\"\\"\\"Input type for a point with a distance\\"\\"\\"
            input PointDistance {
              \\"\\"\\"The distance in metres to be used when comparing two points\\"\\"\\"
              distance: Float!
              point: PointInput!
            }

            \\"\\"\\"Input type for a point\\"\\"\\"
            input PointInput {
              height: Float
              latitude: Float!
              longitude: Float!
            }

            input PointWhere {
              AND: [PointWhere!]
              NOT: PointWhere
              OR: [PointWhere!]
              distance: PointDistance
              equals: PointInput
              gt: PointDistance
              gte: PointDistance
              in: [PointInput!]
              lt: PointDistance
              lte: PointDistance
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

            type RelatedNodeEdge {
              cursor: String
              node: RelatedNode
            }

            input RelatedNodeEdgeWhere {
              AND: [RelatedNodeEdgeWhere!]
              NOT: RelatedNodeEdgeWhere
              OR: [RelatedNodeEdgeWhere!]
              node: RelatedNodeWhere
            }

            type RelatedNodeOperation {
              connection(after: String, first: Int): RelatedNodeConnection
            }

            input RelatedNodeOperationWhere {
              AND: [RelatedNodeOperationWhere!]
              NOT: RelatedNodeOperationWhere
              OR: [RelatedNodeOperationWhere!]
              edges: RelatedNodeEdgeWhere
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
              cartesianPoint: CartesianPointWhere
              cartesianPointNullable: CartesianPointWhere
              point: PointWhere
              pointNullable: PointWhere
            }

            input RelatedNodeWhere {
              AND: [RelatedNodeWhere!]
              NOT: RelatedNodeWhere
              OR: [RelatedNodeWhere!]
              cartesianPoint: CartesianPointWhere
              cartesianPointNullable: CartesianPointWhere
              point: PointWhere
              pointNullable: PointWhere
            }"
        `);
    });
});
