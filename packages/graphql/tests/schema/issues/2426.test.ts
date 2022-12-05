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

describe("https://github.com/neo4j/graphql/issues/2426", () => {
    test("schema should contain a loose non-null guard for union relationships", async () => {
        const typeDefs = gql`
            type A {
                uuid: ID! @id
            }

            type B {
                uuid: ID! @id
            }

            union C = A | B

            type D {
                uuid: ID! @id
                test: String!
                optionalUnion: C @relationship(type: "RELATED", direction: OUT)
                requiredUnion: C! @relationship(type: "RELATED", direction: OUT)
                arrayUnion: [C!]! @relationship(type: "RELATED", direction: OUT)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type A {
              uuid: ID!
            }

            type AAggregateSelection {
              count: Int!
              uuid: IDAggregateSelectionNonNullable!
            }

            input AConnectOrCreateWhere {
              node: AUniqueWhere!
            }

            input AConnectWhere {
              node: AWhere!
            }

            input ACreateInput {
              \\"\\"\\"
              Appears because this input type would be empty otherwise because this type is composed of just generated and/or relationship properties. See https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/
              \\"\\"\\"
              _emptyInput: Boolean
            }

            type AEdge {
              cursor: String!
              node: A!
            }

            input AOnCreateInput {
              \\"\\"\\"
              Appears because this input type would be empty otherwise because this type is composed of just generated and/or relationship properties. See https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/
              \\"\\"\\"
              _emptyInput: Boolean
            }

            input AOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ASort objects to sort As by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ASort!]
            }

            \\"\\"\\"
            Fields to sort As by. The order in which sorts are applied is not guaranteed when specifying many fields in one ASort object.
            \\"\\"\\"
            input ASort {
              uuid: SortDirection
            }

            input AUniqueWhere {
              uuid: ID
            }

            input AUpdateInput {
              \\"\\"\\"
              Appears because this input type would be empty otherwise because this type is composed of just generated and/or relationship properties. See https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/
              \\"\\"\\"
              _emptyInput: Boolean
            }

            input AWhere {
              AND: [AWhere!]
              OR: [AWhere!]
              uuid: ID
              uuid_CONTAINS: ID
              uuid_ENDS_WITH: ID
              uuid_IN: [ID!]
              uuid_NOT: ID
              uuid_NOT_CONTAINS: ID
              uuid_NOT_ENDS_WITH: ID
              uuid_NOT_IN: [ID!]
              uuid_NOT_STARTS_WITH: ID
              uuid_STARTS_WITH: ID
            }

            type AsConnection {
              edges: [AEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type B {
              uuid: ID!
            }

            type BAggregateSelection {
              count: Int!
              uuid: IDAggregateSelectionNonNullable!
            }

            input BConnectOrCreateWhere {
              node: BUniqueWhere!
            }

            input BConnectWhere {
              node: BWhere!
            }

            input BCreateInput {
              \\"\\"\\"
              Appears because this input type would be empty otherwise because this type is composed of just generated and/or relationship properties. See https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/
              \\"\\"\\"
              _emptyInput: Boolean
            }

            type BEdge {
              cursor: String!
              node: B!
            }

            input BOnCreateInput {
              \\"\\"\\"
              Appears because this input type would be empty otherwise because this type is composed of just generated and/or relationship properties. See https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/
              \\"\\"\\"
              _emptyInput: Boolean
            }

            input BOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more BSort objects to sort Bs by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [BSort!]
            }

            \\"\\"\\"
            Fields to sort Bs by. The order in which sorts are applied is not guaranteed when specifying many fields in one BSort object.
            \\"\\"\\"
            input BSort {
              uuid: SortDirection
            }

            input BUniqueWhere {
              uuid: ID
            }

            input BUpdateInput {
              \\"\\"\\"
              Appears because this input type would be empty otherwise because this type is composed of just generated and/or relationship properties. See https://neo4j.com/docs/graphql-manual/current/troubleshooting/faqs/
              \\"\\"\\"
              _emptyInput: Boolean
            }

            input BWhere {
              AND: [BWhere!]
              OR: [BWhere!]
              uuid: ID
              uuid_CONTAINS: ID
              uuid_ENDS_WITH: ID
              uuid_IN: [ID!]
              uuid_NOT: ID
              uuid_NOT_CONTAINS: ID
              uuid_NOT_ENDS_WITH: ID
              uuid_NOT_IN: [ID!]
              uuid_NOT_STARTS_WITH: ID
              uuid_STARTS_WITH: ID
            }

            type BsConnection {
              edges: [BEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            union C = A | B

            input CWhere {
              A: AWhere
              B: BWhere
            }

            type CreateAsMutationResponse {
              as: [A!]!
              info: CreateInfo!
            }

            type CreateBsMutationResponse {
              bs: [B!]!
              info: CreateInfo!
            }

            type CreateDsMutationResponse {
              ds: [D!]!
              info: CreateInfo!
            }

            type CreateInfo {
              bookmark: String
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type D {
              arrayUnion(directed: Boolean = true, options: QueryOptions, where: CWhere): [C!]!
              arrayUnionConnection(after: String, directed: Boolean = true, first: Int, where: DArrayUnionConnectionWhere): DArrayUnionConnection!
              optionalUnion(directed: Boolean = true, options: QueryOptions, where: CWhere): C
              optionalUnionConnection(after: String, directed: Boolean = true, first: Int, where: DOptionalUnionConnectionWhere): DOptionalUnionConnection!
              requiredUnion(directed: Boolean = true, options: QueryOptions, where: CWhere): C!
              requiredUnionConnection(after: String, directed: Boolean = true, first: Int, where: DRequiredUnionConnectionWhere): DRequiredUnionConnection!
              test: String!
              uuid: ID!
            }

            type DAggregateSelection {
              count: Int!
              test: StringAggregateSelectionNonNullable!
              uuid: IDAggregateSelectionNonNullable!
            }

            input DArrayUnionAConnectFieldInput {
              where: AConnectWhere
            }

            input DArrayUnionAConnectOrCreateFieldInput {
              onCreate: DArrayUnionAConnectOrCreateFieldInputOnCreate!
              where: AConnectOrCreateWhere!
            }

            input DArrayUnionAConnectOrCreateFieldInputOnCreate {
              node: AOnCreateInput!
            }

            input DArrayUnionAConnectionWhere {
              AND: [DArrayUnionAConnectionWhere!]
              OR: [DArrayUnionAConnectionWhere!]
              node: AWhere
              node_NOT: AWhere
            }

            input DArrayUnionACreateFieldInput {
              node: ACreateInput!
            }

            input DArrayUnionADeleteFieldInput {
              where: DArrayUnionAConnectionWhere
            }

            input DArrayUnionADisconnectFieldInput {
              where: DArrayUnionAConnectionWhere
            }

            input DArrayUnionAFieldInput {
              connect: [DArrayUnionAConnectFieldInput!]
              connectOrCreate: [DArrayUnionAConnectOrCreateFieldInput!]
              create: [DArrayUnionACreateFieldInput!]
            }

            input DArrayUnionAUpdateConnectionInput {
              node: AUpdateInput
            }

            input DArrayUnionAUpdateFieldInput {
              connect: [DArrayUnionAConnectFieldInput!]
              connectOrCreate: [DArrayUnionAConnectOrCreateFieldInput!]
              create: [DArrayUnionACreateFieldInput!]
              delete: [DArrayUnionADeleteFieldInput!]
              disconnect: [DArrayUnionADisconnectFieldInput!]
              update: DArrayUnionAUpdateConnectionInput
              where: DArrayUnionAConnectionWhere
            }

            input DArrayUnionBConnectFieldInput {
              where: BConnectWhere
            }

            input DArrayUnionBConnectOrCreateFieldInput {
              onCreate: DArrayUnionBConnectOrCreateFieldInputOnCreate!
              where: BConnectOrCreateWhere!
            }

            input DArrayUnionBConnectOrCreateFieldInputOnCreate {
              node: BOnCreateInput!
            }

            input DArrayUnionBConnectionWhere {
              AND: [DArrayUnionBConnectionWhere!]
              OR: [DArrayUnionBConnectionWhere!]
              node: BWhere
              node_NOT: BWhere
            }

            input DArrayUnionBCreateFieldInput {
              node: BCreateInput!
            }

            input DArrayUnionBDeleteFieldInput {
              where: DArrayUnionBConnectionWhere
            }

            input DArrayUnionBDisconnectFieldInput {
              where: DArrayUnionBConnectionWhere
            }

            input DArrayUnionBFieldInput {
              connect: [DArrayUnionBConnectFieldInput!]
              connectOrCreate: [DArrayUnionBConnectOrCreateFieldInput!]
              create: [DArrayUnionBCreateFieldInput!]
            }

            input DArrayUnionBUpdateConnectionInput {
              node: BUpdateInput
            }

            input DArrayUnionBUpdateFieldInput {
              connect: [DArrayUnionBConnectFieldInput!]
              connectOrCreate: [DArrayUnionBConnectOrCreateFieldInput!]
              create: [DArrayUnionBCreateFieldInput!]
              delete: [DArrayUnionBDeleteFieldInput!]
              disconnect: [DArrayUnionBDisconnectFieldInput!]
              update: DArrayUnionBUpdateConnectionInput
              where: DArrayUnionBConnectionWhere
            }

            input DArrayUnionConnectInput {
              A: [DArrayUnionAConnectFieldInput!]
              B: [DArrayUnionBConnectFieldInput!]
            }

            input DArrayUnionConnectOrCreateInput {
              A: [DArrayUnionAConnectOrCreateFieldInput!]
              B: [DArrayUnionBConnectOrCreateFieldInput!]
            }

            type DArrayUnionConnection {
              edges: [DArrayUnionRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input DArrayUnionConnectionWhere {
              A: DArrayUnionAConnectionWhere
              B: DArrayUnionBConnectionWhere
            }

            input DArrayUnionCreateFieldInput {
              A: [DArrayUnionACreateFieldInput!]
              B: [DArrayUnionBCreateFieldInput!]
            }

            input DArrayUnionCreateInput {
              A: DArrayUnionAFieldInput
              B: DArrayUnionBFieldInput
            }

            input DArrayUnionDeleteInput {
              A: [DArrayUnionADeleteFieldInput!]
              B: [DArrayUnionBDeleteFieldInput!]
            }

            input DArrayUnionDisconnectInput {
              A: [DArrayUnionADisconnectFieldInput!]
              B: [DArrayUnionBDisconnectFieldInput!]
            }

            type DArrayUnionRelationship {
              cursor: String!
              node: C!
            }

            input DArrayUnionUpdateInput {
              A: [DArrayUnionAUpdateFieldInput!]
              B: [DArrayUnionBUpdateFieldInput!]
            }

            input DConnectInput {
              arrayUnion: DArrayUnionConnectInput
              optionalUnion: DOptionalUnionConnectInput
              requiredUnion: DRequiredUnionConnectInput
            }

            input DConnectOrCreateInput {
              arrayUnion: DArrayUnionConnectOrCreateInput
              optionalUnion: DOptionalUnionConnectOrCreateInput
              requiredUnion: DRequiredUnionConnectOrCreateInput
            }

            input DCreateInput {
              arrayUnion: DArrayUnionCreateInput
              optionalUnion: DOptionalUnionCreateInput
              requiredUnion: DRequiredUnionCreateInput!
              test: String!
            }

            input DDeleteInput {
              arrayUnion: DArrayUnionDeleteInput
              optionalUnion: DOptionalUnionDeleteInput
              requiredUnion: DRequiredUnionDeleteInput
            }

            input DDisconnectInput {
              arrayUnion: DArrayUnionDisconnectInput
              optionalUnion: DOptionalUnionDisconnectInput
              requiredUnion: DRequiredUnionDisconnectInput
            }

            type DEdge {
              cursor: String!
              node: D!
            }

            input DOptionalUnionAConnectFieldInput {
              where: AConnectWhere
            }

            input DOptionalUnionAConnectOrCreateFieldInput {
              onCreate: DOptionalUnionAConnectOrCreateFieldInputOnCreate!
              where: AConnectOrCreateWhere!
            }

            input DOptionalUnionAConnectOrCreateFieldInputOnCreate {
              node: AOnCreateInput!
            }

            input DOptionalUnionAConnectionWhere {
              AND: [DOptionalUnionAConnectionWhere!]
              OR: [DOptionalUnionAConnectionWhere!]
              node: AWhere
              node_NOT: AWhere
            }

            input DOptionalUnionACreateFieldInput {
              node: ACreateInput!
            }

            input DOptionalUnionADeleteFieldInput {
              where: DOptionalUnionAConnectionWhere
            }

            input DOptionalUnionADisconnectFieldInput {
              where: DOptionalUnionAConnectionWhere
            }

            input DOptionalUnionAFieldInput {
              connect: DOptionalUnionAConnectFieldInput
              connectOrCreate: DOptionalUnionAConnectOrCreateFieldInput
              create: DOptionalUnionACreateFieldInput
            }

            input DOptionalUnionAUpdateConnectionInput {
              node: AUpdateInput
            }

            input DOptionalUnionAUpdateFieldInput {
              connect: DOptionalUnionAConnectFieldInput
              connectOrCreate: DOptionalUnionAConnectOrCreateFieldInput
              create: DOptionalUnionACreateFieldInput
              delete: DOptionalUnionADeleteFieldInput
              disconnect: DOptionalUnionADisconnectFieldInput
              update: DOptionalUnionAUpdateConnectionInput
              where: DOptionalUnionAConnectionWhere
            }

            input DOptionalUnionBConnectFieldInput {
              where: BConnectWhere
            }

            input DOptionalUnionBConnectOrCreateFieldInput {
              onCreate: DOptionalUnionBConnectOrCreateFieldInputOnCreate!
              where: BConnectOrCreateWhere!
            }

            input DOptionalUnionBConnectOrCreateFieldInputOnCreate {
              node: BOnCreateInput!
            }

            input DOptionalUnionBConnectionWhere {
              AND: [DOptionalUnionBConnectionWhere!]
              OR: [DOptionalUnionBConnectionWhere!]
              node: BWhere
              node_NOT: BWhere
            }

            input DOptionalUnionBCreateFieldInput {
              node: BCreateInput!
            }

            input DOptionalUnionBDeleteFieldInput {
              where: DOptionalUnionBConnectionWhere
            }

            input DOptionalUnionBDisconnectFieldInput {
              where: DOptionalUnionBConnectionWhere
            }

            input DOptionalUnionBFieldInput {
              connect: DOptionalUnionBConnectFieldInput
              connectOrCreate: DOptionalUnionBConnectOrCreateFieldInput
              create: DOptionalUnionBCreateFieldInput
            }

            input DOptionalUnionBUpdateConnectionInput {
              node: BUpdateInput
            }

            input DOptionalUnionBUpdateFieldInput {
              connect: DOptionalUnionBConnectFieldInput
              connectOrCreate: DOptionalUnionBConnectOrCreateFieldInput
              create: DOptionalUnionBCreateFieldInput
              delete: DOptionalUnionBDeleteFieldInput
              disconnect: DOptionalUnionBDisconnectFieldInput
              update: DOptionalUnionBUpdateConnectionInput
              where: DOptionalUnionBConnectionWhere
            }

            input DOptionalUnionConnectInput {
              A: DOptionalUnionAConnectFieldInput
              B: DOptionalUnionBConnectFieldInput
            }

            input DOptionalUnionConnectOrCreateInput {
              A: DOptionalUnionAConnectOrCreateFieldInput
              B: DOptionalUnionBConnectOrCreateFieldInput
            }

            type DOptionalUnionConnection {
              edges: [DOptionalUnionRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input DOptionalUnionConnectionWhere {
              A: DOptionalUnionAConnectionWhere
              B: DOptionalUnionBConnectionWhere
            }

            input DOptionalUnionCreateFieldInput {
              A: [DOptionalUnionACreateFieldInput!]
              B: [DOptionalUnionBCreateFieldInput!]
            }

            input DOptionalUnionCreateInput {
              A: DOptionalUnionAFieldInput
              B: DOptionalUnionBFieldInput
            }

            input DOptionalUnionDeleteInput {
              A: DOptionalUnionADeleteFieldInput
              B: DOptionalUnionBDeleteFieldInput
            }

            input DOptionalUnionDisconnectInput {
              A: DOptionalUnionADisconnectFieldInput
              B: DOptionalUnionBDisconnectFieldInput
            }

            type DOptionalUnionRelationship {
              cursor: String!
              node: C!
            }

            input DOptionalUnionUpdateInput {
              A: DOptionalUnionAUpdateFieldInput
              B: DOptionalUnionBUpdateFieldInput
            }

            input DOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more DSort objects to sort Ds by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [DSort!]
            }

            input DRelationInput {
              arrayUnion: DArrayUnionCreateFieldInput
              optionalUnion: DOptionalUnionCreateFieldInput
              requiredUnion: DRequiredUnionCreateFieldInput
            }

            input DRequiredUnionAConnectFieldInput {
              where: AConnectWhere
            }

            input DRequiredUnionAConnectOrCreateFieldInput {
              onCreate: DRequiredUnionAConnectOrCreateFieldInputOnCreate!
              where: AConnectOrCreateWhere!
            }

            input DRequiredUnionAConnectOrCreateFieldInputOnCreate {
              node: AOnCreateInput!
            }

            input DRequiredUnionAConnectionWhere {
              AND: [DRequiredUnionAConnectionWhere!]
              OR: [DRequiredUnionAConnectionWhere!]
              node: AWhere
              node_NOT: AWhere
            }

            input DRequiredUnionACreateFieldInput {
              node: ACreateInput!
            }

            input DRequiredUnionADeleteFieldInput {
              where: DRequiredUnionAConnectionWhere
            }

            input DRequiredUnionADisconnectFieldInput {
              where: DRequiredUnionAConnectionWhere
            }

            input DRequiredUnionAFieldInput {
              connect: DRequiredUnionAConnectFieldInput
              connectOrCreate: DRequiredUnionAConnectOrCreateFieldInput
              create: DRequiredUnionACreateFieldInput
            }

            input DRequiredUnionAUpdateConnectionInput {
              node: AUpdateInput
            }

            input DRequiredUnionAUpdateFieldInput {
              connect: DRequiredUnionAConnectFieldInput
              connectOrCreate: DRequiredUnionAConnectOrCreateFieldInput
              create: DRequiredUnionACreateFieldInput
              delete: DRequiredUnionADeleteFieldInput
              disconnect: DRequiredUnionADisconnectFieldInput
              update: DRequiredUnionAUpdateConnectionInput
              where: DRequiredUnionAConnectionWhere
            }

            input DRequiredUnionBConnectFieldInput {
              where: BConnectWhere
            }

            input DRequiredUnionBConnectOrCreateFieldInput {
              onCreate: DRequiredUnionBConnectOrCreateFieldInputOnCreate!
              where: BConnectOrCreateWhere!
            }

            input DRequiredUnionBConnectOrCreateFieldInputOnCreate {
              node: BOnCreateInput!
            }

            input DRequiredUnionBConnectionWhere {
              AND: [DRequiredUnionBConnectionWhere!]
              OR: [DRequiredUnionBConnectionWhere!]
              node: BWhere
              node_NOT: BWhere
            }

            input DRequiredUnionBCreateFieldInput {
              node: BCreateInput!
            }

            input DRequiredUnionBDeleteFieldInput {
              where: DRequiredUnionBConnectionWhere
            }

            input DRequiredUnionBDisconnectFieldInput {
              where: DRequiredUnionBConnectionWhere
            }

            input DRequiredUnionBFieldInput {
              connect: DRequiredUnionBConnectFieldInput
              connectOrCreate: DRequiredUnionBConnectOrCreateFieldInput
              create: DRequiredUnionBCreateFieldInput
            }

            input DRequiredUnionBUpdateConnectionInput {
              node: BUpdateInput
            }

            input DRequiredUnionBUpdateFieldInput {
              connect: DRequiredUnionBConnectFieldInput
              connectOrCreate: DRequiredUnionBConnectOrCreateFieldInput
              create: DRequiredUnionBCreateFieldInput
              delete: DRequiredUnionBDeleteFieldInput
              disconnect: DRequiredUnionBDisconnectFieldInput
              update: DRequiredUnionBUpdateConnectionInput
              where: DRequiredUnionBConnectionWhere
            }

            input DRequiredUnionConnectInput {
              A: DRequiredUnionAConnectFieldInput
              B: DRequiredUnionBConnectFieldInput
            }

            input DRequiredUnionConnectOrCreateInput {
              A: DRequiredUnionAConnectOrCreateFieldInput
              B: DRequiredUnionBConnectOrCreateFieldInput
            }

            type DRequiredUnionConnection {
              edges: [DRequiredUnionRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input DRequiredUnionConnectionWhere {
              A: DRequiredUnionAConnectionWhere
              B: DRequiredUnionBConnectionWhere
            }

            input DRequiredUnionCreateFieldInput {
              A: [DRequiredUnionACreateFieldInput!]
              B: [DRequiredUnionBCreateFieldInput!]
            }

            input DRequiredUnionCreateInput {
              A: DRequiredUnionAFieldInput
              B: DRequiredUnionBFieldInput
            }

            input DRequiredUnionDeleteInput {
              A: DRequiredUnionADeleteFieldInput
              B: DRequiredUnionBDeleteFieldInput
            }

            input DRequiredUnionDisconnectInput {
              A: DRequiredUnionADisconnectFieldInput
              B: DRequiredUnionBDisconnectFieldInput
            }

            type DRequiredUnionRelationship {
              cursor: String!
              node: C!
            }

            input DRequiredUnionUpdateInput {
              A: DRequiredUnionAUpdateFieldInput
              B: DRequiredUnionBUpdateFieldInput
            }

            \\"\\"\\"
            Fields to sort Ds by. The order in which sorts are applied is not guaranteed when specifying many fields in one DSort object.
            \\"\\"\\"
            input DSort {
              test: SortDirection
              uuid: SortDirection
            }

            input DUpdateInput {
              arrayUnion: DArrayUnionUpdateInput
              optionalUnion: DOptionalUnionUpdateInput
              requiredUnion: DRequiredUnionUpdateInput
              test: String
            }

            input DWhere {
              AND: [DWhere!]
              OR: [DWhere!]
              arrayUnionConnection: DArrayUnionConnectionWhere @deprecated(reason: \\"Use \`arrayUnionConnection_SOME\` instead.\\")
              arrayUnionConnection_ALL: DArrayUnionConnectionWhere
              arrayUnionConnection_NONE: DArrayUnionConnectionWhere
              arrayUnionConnection_NOT: DArrayUnionConnectionWhere @deprecated(reason: \\"Use \`arrayUnionConnection_NONE\` instead.\\")
              arrayUnionConnection_SINGLE: DArrayUnionConnectionWhere
              arrayUnionConnection_SOME: DArrayUnionConnectionWhere
              optionalUnionConnection: DOptionalUnionConnectionWhere
              optionalUnionConnection_NOT: DOptionalUnionConnectionWhere
              requiredUnionConnection: DRequiredUnionConnectionWhere
              requiredUnionConnection_NOT: DRequiredUnionConnectionWhere
              test: String
              test_CONTAINS: String
              test_ENDS_WITH: String
              test_IN: [String!]
              test_NOT: String
              test_NOT_CONTAINS: String
              test_NOT_ENDS_WITH: String
              test_NOT_IN: [String!]
              test_NOT_STARTS_WITH: String
              test_STARTS_WITH: String
              uuid: ID
              uuid_CONTAINS: ID
              uuid_ENDS_WITH: ID
              uuid_IN: [ID!]
              uuid_NOT: ID
              uuid_NOT_CONTAINS: ID
              uuid_NOT_ENDS_WITH: ID
              uuid_NOT_IN: [ID!]
              uuid_NOT_STARTS_WITH: ID
              uuid_STARTS_WITH: ID
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type DsConnection {
              edges: [DEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type IDAggregateSelectionNonNullable {
              longest: ID!
              shortest: ID!
            }

            type Mutation {
              createAs(input: [ACreateInput!]!): CreateAsMutationResponse!
              createBs(input: [BCreateInput!]!): CreateBsMutationResponse!
              createDs(input: [DCreateInput!]!): CreateDsMutationResponse!
              deleteAs(where: AWhere): DeleteInfo!
              deleteBs(where: BWhere): DeleteInfo!
              deleteDs(delete: DDeleteInput, where: DWhere): DeleteInfo!
              updateAs(update: AUpdateInput, where: AWhere): UpdateAsMutationResponse!
              updateBs(update: BUpdateInput, where: BWhere): UpdateBsMutationResponse!
              updateDs(connect: DConnectInput, connectOrCreate: DConnectOrCreateInput, create: DRelationInput, delete: DDeleteInput, disconnect: DDisconnectInput, update: DUpdateInput, where: DWhere): UpdateDsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              as(options: AOptions, where: AWhere): [A!]!
              asAggregate(where: AWhere): AAggregateSelection!
              asConnection(after: String, first: Int, sort: [ASort], where: AWhere): AsConnection!
              bs(options: BOptions, where: BWhere): [B!]!
              bsAggregate(where: BWhere): BAggregateSelection!
              bsConnection(after: String, first: Int, sort: [BSort], where: BWhere): BsConnection!
              ds(options: DOptions, where: DWhere): [D!]!
              dsAggregate(where: DWhere): DAggregateSelection!
              dsConnection(after: String, first: Int, sort: [DSort], where: DWhere): DsConnection!
            }

            input QueryOptions {
              limit: Int
              offset: Int
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelectionNonNullable {
              longest: String!
              shortest: String!
            }

            type UpdateAsMutationResponse {
              as: [A!]!
              info: UpdateInfo!
            }

            type UpdateBsMutationResponse {
              bs: [B!]!
              info: UpdateInfo!
            }

            type UpdateDsMutationResponse {
              ds: [D!]!
              info: UpdateInfo!
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }"
        `);
    });
});
