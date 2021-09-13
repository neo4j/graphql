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
import { gql } from "apollo-server";
import { Neo4jGraphQL } from "../../../src";

describe("Sort", () => {
    test("sort argument is not present when nothing to sort", () => {
        const typeDefs = gql`
            type Node1 {
                property: String!
                relatedTo: [Node2!]! @relationship(type: "RELATED_TO", direction: OUT)
            }

            type Node2 {
                relatedTo: [Node1!]! @relationship(type: "RELATED_TO", direction: OUT)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type CreateInfo {
              bookmark: String
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateNode1sMutationResponse {
              info: CreateInfo!
              node1s: [Node1!]!
            }

            type CreateNode2sMutationResponse {
              info: CreateInfo!
              node2s: [Node2!]!
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createNode1s(input: [Node1CreateInput!]!): CreateNode1sMutationResponse!
              createNode2s(input: [Node2CreateInput!]!): CreateNode2sMutationResponse!
              deleteNode1s(delete: Node1DeleteInput, where: Node1Where): DeleteInfo!
              deleteNode2s(delete: Node2DeleteInput, where: Node2Where): DeleteInfo!
              updateNode1s(connect: Node1ConnectInput, create: Node1RelationInput, delete: Node1DeleteInput, disconnect: Node1DisconnectInput, update: Node1UpdateInput, where: Node1Where): UpdateNode1sMutationResponse!
              updateNode2s(connect: Node2ConnectInput, create: Node2RelationInput, delete: Node2DeleteInput, disconnect: Node2DisconnectInput, update: Node2UpdateInput, where: Node2Where): UpdateNode2sMutationResponse!
            }

            type Node1 {
              property: String!
              relatedTo(options: Node2Options, where: Node2Where): [Node2!]!
              relatedToConnection(after: String, first: Int, where: Node1RelatedToConnectionWhere): Node1RelatedToConnection!
            }

            input Node1ConnectInput {
              relatedTo: [Node1RelatedToConnectFieldInput!]
            }

            input Node1ConnectWhere {
              node: Node1Where!
            }

            input Node1CreateInput {
              property: String!
              relatedTo: Node1RelatedToFieldInput
            }

            input Node1DeleteInput {
              relatedTo: [Node1RelatedToDeleteFieldInput!]
            }

            input Node1DisconnectInput {
              relatedTo: [Node1RelatedToDisconnectFieldInput!]
            }

            input Node1Options {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more Node1Sort objects to sort Node1s by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [Node1Sort]
            }

            input Node1RelatedToConnectFieldInput {
              connect: [Node2ConnectInput!]
              where: Node2ConnectWhere
            }

            type Node1RelatedToConnection {
              edges: [Node1RelatedToRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Node1RelatedToConnectionWhere {
              AND: [Node1RelatedToConnectionWhere!]
              OR: [Node1RelatedToConnectionWhere!]
              node: Node2Where
              node_NOT: Node2Where
            }

            input Node1RelatedToCreateFieldInput {
              node: Node2CreateInput!
            }

            input Node1RelatedToDeleteFieldInput {
              delete: Node2DeleteInput
              where: Node1RelatedToConnectionWhere
            }

            input Node1RelatedToDisconnectFieldInput {
              disconnect: Node2DisconnectInput
              where: Node1RelatedToConnectionWhere
            }

            input Node1RelatedToFieldInput {
              connect: [Node1RelatedToConnectFieldInput!]
              create: [Node1RelatedToCreateFieldInput!]
            }

            type Node1RelatedToRelationship {
              cursor: String!
              node: Node2!
            }

            input Node1RelatedToUpdateConnectionInput {
              node: Node2UpdateInput
            }

            input Node1RelatedToUpdateFieldInput {
              connect: [Node1RelatedToConnectFieldInput!]
              create: [Node1RelatedToCreateFieldInput!]
              delete: [Node1RelatedToDeleteFieldInput!]
              disconnect: [Node1RelatedToDisconnectFieldInput!]
              update: Node1RelatedToUpdateConnectionInput
              where: Node1RelatedToConnectionWhere
            }

            input Node1RelationInput {
              relatedTo: [Node1RelatedToCreateFieldInput!]
            }

            \\"\\"\\"Fields to sort Node1s by. The order in which sorts are applied is not guaranteed when specifying many fields in one Node1Sort object.\\"\\"\\"
            input Node1Sort {
              property: SortDirection
            }

            input Node1UpdateInput {
              property: String
              relatedTo: [Node1RelatedToUpdateFieldInput!]
            }

            input Node1Where {
              AND: [Node1Where!]
              OR: [Node1Where!]
              property: String
              property_CONTAINS: String
              property_ENDS_WITH: String
              property_IN: [String]
              property_NOT: String
              property_NOT_CONTAINS: String
              property_NOT_ENDS_WITH: String
              property_NOT_IN: [String]
              property_NOT_STARTS_WITH: String
              property_STARTS_WITH: String
              relatedTo: Node2Where
              relatedToConnection: Node1RelatedToConnectionWhere
              relatedToConnection_NOT: Node1RelatedToConnectionWhere
              relatedTo_NOT: Node2Where
            }

            type Node2 {
              relatedTo(options: Node1Options, where: Node1Where): [Node1!]!
              relatedToConnection(after: String, first: Int, sort: [Node2RelatedToConnectionSort!], where: Node2RelatedToConnectionWhere): Node2RelatedToConnection!
            }

            input Node2ConnectInput {
              relatedTo: [Node2RelatedToConnectFieldInput!]
            }

            input Node2ConnectWhere {
              node: Node2Where!
            }

            input Node2CreateInput {
              relatedTo: Node2RelatedToFieldInput
            }

            input Node2DeleteInput {
              relatedTo: [Node2RelatedToDeleteFieldInput!]
            }

            input Node2DisconnectInput {
              relatedTo: [Node2RelatedToDisconnectFieldInput!]
            }

            input Node2Options {
              limit: Int
              offset: Int
            }

            input Node2RelatedToConnectFieldInput {
              connect: [Node1ConnectInput!]
              where: Node1ConnectWhere
            }

            type Node2RelatedToConnection {
              edges: [Node2RelatedToRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input Node2RelatedToConnectionSort {
              node: Node1Sort
            }

            input Node2RelatedToConnectionWhere {
              AND: [Node2RelatedToConnectionWhere!]
              OR: [Node2RelatedToConnectionWhere!]
              node: Node1Where
              node_NOT: Node1Where
            }

            input Node2RelatedToCreateFieldInput {
              node: Node1CreateInput!
            }

            input Node2RelatedToDeleteFieldInput {
              delete: Node1DeleteInput
              where: Node2RelatedToConnectionWhere
            }

            input Node2RelatedToDisconnectFieldInput {
              disconnect: Node1DisconnectInput
              where: Node2RelatedToConnectionWhere
            }

            input Node2RelatedToFieldInput {
              connect: [Node2RelatedToConnectFieldInput!]
              create: [Node2RelatedToCreateFieldInput!]
            }

            type Node2RelatedToRelationship {
              cursor: String!
              node: Node1!
            }

            input Node2RelatedToUpdateConnectionInput {
              node: Node1UpdateInput
            }

            input Node2RelatedToUpdateFieldInput {
              connect: [Node2RelatedToConnectFieldInput!]
              create: [Node2RelatedToCreateFieldInput!]
              delete: [Node2RelatedToDeleteFieldInput!]
              disconnect: [Node2RelatedToDisconnectFieldInput!]
              update: Node2RelatedToUpdateConnectionInput
              where: Node2RelatedToConnectionWhere
            }

            input Node2RelationInput {
              relatedTo: [Node2RelatedToCreateFieldInput!]
            }

            input Node2UpdateInput {
              relatedTo: [Node2RelatedToUpdateFieldInput!]
            }

            input Node2Where {
              AND: [Node2Where!]
              OR: [Node2Where!]
              relatedTo: Node1Where
              relatedToConnection: Node2RelatedToConnectionWhere
              relatedToConnection_NOT: Node2RelatedToConnectionWhere
              relatedTo_NOT: Node1Where
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              node1s(options: Node1Options, where: Node1Where): [Node1!]!
              node1sCount(where: Node1Where): Int!
              node2s(options: Node2Options, where: Node2Where): [Node2!]!
              node2sCount(where: Node2Where): Int!
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateNode1sMutationResponse {
              info: UpdateInfo!
              node1s: [Node1!]!
            }

            type UpdateNode2sMutationResponse {
              info: UpdateInfo!
              node2s: [Node2!]!
            }
            "
        `);
    });
});
