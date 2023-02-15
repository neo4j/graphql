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

describe("https://github.com/neo4j/graphql/issues/2377", () => {
    test("enums should be available in onCreateInput type", async () => {
        const typeDefs = gql`
            enum ResourceType {
                ResourceA
                ResourceB
                ResourceC
            }

            enum Property {
                PropertyA
                PropertyB
                PropertyC
            }

            enum Tag {
                TagA
                TagB
                TagC
            }

            interface ResourceEntity {
                id: ID! @id(autogenerate: false)
                name: String
                """
                Allowed resource types (enums)
                """
                type: ResourceType!
                """
                Globally tracked tags for this resource (enum)
                """
                tags: [Tag!]
                properties: [Property!]
            }

            type Resource implements ResourceEntity {
                id: ID! @id(autogenerate: false)
                name: String
                type: ResourceType!
                externalIds: [ID!]
                """
                Globally tracked tags for this resource
                """
                tags: [Tag!]
                properties: [Property!]
                """
                Resources encapsulating the given resource (e.g., a github org contains a repo)
                """
                containedBy: [Resource!]! @relationship(type: "CONTAINS", direction: IN)
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [UPDATE])
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

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

            type CreateResourcesMutationResponse {
              info: CreateInfo!
              resources: [Resource!]!
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            type DateTimeAggregateSelectionNonNullable {
              max: DateTime!
              min: DateTime!
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IDAggregateSelectionNonNullable {
              longest: ID!
              shortest: ID!
            }

            type Mutation {
              createResources(input: [ResourceCreateInput!]!): CreateResourcesMutationResponse!
              deleteResources(delete: ResourceDeleteInput, where: ResourceWhere): DeleteInfo!
              updateResources(connect: ResourceConnectInput, connectOrCreate: ResourceConnectOrCreateInput, create: ResourceRelationInput, delete: ResourceDeleteInput, disconnect: ResourceDisconnectInput, update: ResourceUpdateInput, where: ResourceWhere): UpdateResourcesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            enum Property {
              PropertyA
              PropertyB
              PropertyC
            }

            type Query {
              resources(options: ResourceOptions, where: ResourceWhere): [Resource!]!
              resourcesAggregate(where: ResourceWhere): ResourceAggregateSelection!
              resourcesConnection(after: String, first: Int, sort: [ResourceSort], where: ResourceWhere): ResourcesConnection!
            }

            type Resource implements ResourceEntity {
              \\"\\"\\"
              Resources encapsulating the given resource (e.g., a github org contains a repo)
              \\"\\"\\"
              containedBy(directed: Boolean = true, options: ResourceOptions, where: ResourceWhere): [Resource!]!
              containedByAggregate(directed: Boolean = true, where: ResourceWhere): ResourceResourceContainedByAggregationSelection
              containedByConnection(after: String, directed: Boolean = true, first: Int, sort: [ResourceContainedByConnectionSort!], where: ResourceContainedByConnectionWhere): ResourceContainedByConnection!
              createdAt: DateTime!
              externalIds: [ID!]
              id: ID!
              name: String
              properties: [Property!]
              \\"\\"\\"Globally tracked tags for this resource\\"\\"\\"
              tags: [Tag!]
              type: ResourceType!
              updatedAt: DateTime!
            }

            type ResourceAggregateSelection {
              count: Int!
              createdAt: DateTimeAggregateSelectionNonNullable!
              id: IDAggregateSelectionNonNullable!
              name: StringAggregateSelectionNullable!
              updatedAt: DateTimeAggregateSelectionNonNullable!
            }

            input ResourceConnectInput {
              containedBy: [ResourceContainedByConnectFieldInput!]
            }

            input ResourceConnectOrCreateInput {
              containedBy: [ResourceContainedByConnectOrCreateFieldInput!]
            }

            input ResourceConnectOrCreateWhere {
              node: ResourceUniqueWhere!
            }

            input ResourceConnectWhere {
              node: ResourceWhere!
            }

            input ResourceContainedByAggregateInput {
              AND: [ResourceContainedByAggregateInput!]
              NOT: ResourceContainedByAggregateInput
              OR: [ResourceContainedByAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: ResourceContainedByNodeAggregationWhereInput
            }

            input ResourceContainedByConnectFieldInput {
              connect: [ResourceConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: ResourceConnectWhere
            }

            input ResourceContainedByConnectOrCreateFieldInput {
              onCreate: ResourceContainedByConnectOrCreateFieldInputOnCreate!
              where: ResourceConnectOrCreateWhere!
            }

            input ResourceContainedByConnectOrCreateFieldInputOnCreate {
              node: ResourceOnCreateInput!
            }

            type ResourceContainedByConnection {
              edges: [ResourceContainedByRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ResourceContainedByConnectionSort {
              node: ResourceSort
            }

            input ResourceContainedByConnectionWhere {
              AND: [ResourceContainedByConnectionWhere!]
              NOT: ResourceContainedByConnectionWhere
              OR: [ResourceContainedByConnectionWhere!]
              node: ResourceWhere
              node_NOT: ResourceWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ResourceContainedByCreateFieldInput {
              node: ResourceCreateInput!
            }

            input ResourceContainedByDeleteFieldInput {
              delete: ResourceDeleteInput
              where: ResourceContainedByConnectionWhere
            }

            input ResourceContainedByDisconnectFieldInput {
              disconnect: ResourceDisconnectInput
              where: ResourceContainedByConnectionWhere
            }

            input ResourceContainedByFieldInput {
              connect: [ResourceContainedByConnectFieldInput!]
              connectOrCreate: [ResourceContainedByConnectOrCreateFieldInput!]
              create: [ResourceContainedByCreateFieldInput!]
            }

            input ResourceContainedByNodeAggregationWhereInput {
              AND: [ResourceContainedByNodeAggregationWhereInput!]
              NOT: ResourceContainedByNodeAggregationWhereInput
              OR: [ResourceContainedByNodeAggregationWhereInput!]
              createdAt_EQUAL: DateTime @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              createdAt_GT: DateTime @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              createdAt_GTE: DateTime @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              createdAt_LT: DateTime @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              createdAt_LTE: DateTime @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              createdAt_MAX_EQUAL: DateTime
              createdAt_MAX_GT: DateTime
              createdAt_MAX_GTE: DateTime
              createdAt_MAX_LT: DateTime
              createdAt_MAX_LTE: DateTime
              createdAt_MIN_EQUAL: DateTime
              createdAt_MIN_GT: DateTime
              createdAt_MIN_GTE: DateTime
              createdAt_MIN_LT: DateTime
              createdAt_MIN_LTE: DateTime
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              name_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
              name_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              name_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              updatedAt_EQUAL: DateTime @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              updatedAt_GT: DateTime @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              updatedAt_GTE: DateTime @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              updatedAt_LT: DateTime @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              updatedAt_LTE: DateTime @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              updatedAt_MAX_EQUAL: DateTime
              updatedAt_MAX_GT: DateTime
              updatedAt_MAX_GTE: DateTime
              updatedAt_MAX_LT: DateTime
              updatedAt_MAX_LTE: DateTime
              updatedAt_MIN_EQUAL: DateTime
              updatedAt_MIN_GT: DateTime
              updatedAt_MIN_GTE: DateTime
              updatedAt_MIN_LT: DateTime
              updatedAt_MIN_LTE: DateTime
            }

            type ResourceContainedByRelationship {
              cursor: String!
              node: Resource!
            }

            input ResourceContainedByUpdateConnectionInput {
              node: ResourceUpdateInput
            }

            input ResourceContainedByUpdateFieldInput {
              connect: [ResourceContainedByConnectFieldInput!]
              connectOrCreate: [ResourceContainedByConnectOrCreateFieldInput!]
              create: [ResourceContainedByCreateFieldInput!]
              delete: [ResourceContainedByDeleteFieldInput!]
              disconnect: [ResourceContainedByDisconnectFieldInput!]
              update: ResourceContainedByUpdateConnectionInput
              where: ResourceContainedByConnectionWhere
            }

            input ResourceCreateInput {
              containedBy: ResourceContainedByFieldInput
              externalIds: [ID!]
              id: ID!
              name: String
              properties: [Property!]
              tags: [Tag!]
              type: ResourceType!
            }

            input ResourceDeleteInput {
              containedBy: [ResourceContainedByDeleteFieldInput!]
            }

            input ResourceDisconnectInput {
              containedBy: [ResourceContainedByDisconnectFieldInput!]
            }

            type ResourceEdge {
              cursor: String!
              node: Resource!
            }

            interface ResourceEntity {
              id: ID!
              name: String
              properties: [Property!]
              \\"\\"\\"Globally tracked tags for this resource (enum)\\"\\"\\"
              tags: [Tag!]
              \\"\\"\\"Allowed resource types (enums)\\"\\"\\"
              type: ResourceType!
            }

            input ResourceOnCreateInput {
              externalIds: [ID!]
              id: ID!
              name: String
              properties: [Property!]
              tags: [Tag!]
              type: ResourceType!
            }

            input ResourceOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ResourceSort objects to sort Resources by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ResourceSort!]
            }

            input ResourceRelationInput {
              containedBy: [ResourceContainedByCreateFieldInput!]
            }

            type ResourceResourceContainedByAggregationSelection {
              count: Int!
              node: ResourceResourceContainedByNodeAggregateSelection
            }

            type ResourceResourceContainedByNodeAggregateSelection {
              createdAt: DateTimeAggregateSelectionNonNullable!
              id: IDAggregateSelectionNonNullable!
              name: StringAggregateSelectionNullable!
              updatedAt: DateTimeAggregateSelectionNonNullable!
            }

            \\"\\"\\"
            Fields to sort Resources by. The order in which sorts are applied is not guaranteed when specifying many fields in one ResourceSort object.
            \\"\\"\\"
            input ResourceSort {
              createdAt: SortDirection
              id: SortDirection
              name: SortDirection
              type: SortDirection
              updatedAt: SortDirection
            }

            enum ResourceType {
              ResourceA
              ResourceB
              ResourceC
            }

            input ResourceUniqueWhere {
              id: ID
            }

            input ResourceUpdateInput {
              containedBy: [ResourceContainedByUpdateFieldInput!]
              externalIds: [ID!]
              externalIds_POP: Int
              externalIds_PUSH: [ID!]
              id: ID
              name: String
              properties: [Property!]
              tags: [Tag!]
              type: ResourceType
            }

            input ResourceWhere {
              AND: [ResourceWhere!]
              NOT: ResourceWhere
              OR: [ResourceWhere!]
              containedBy: ResourceWhere @deprecated(reason: \\"Use \`containedBy_SOME\` instead.\\")
              containedByAggregate: ResourceContainedByAggregateInput
              containedByConnection: ResourceContainedByConnectionWhere @deprecated(reason: \\"Use \`containedByConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Resources where all of the related containedByConnections match this filter
              \\"\\"\\"
              containedByConnection_ALL: ResourceContainedByConnectionWhere
              \\"\\"\\"
              Return Resources where none of the related containedByConnections match this filter
              \\"\\"\\"
              containedByConnection_NONE: ResourceContainedByConnectionWhere
              containedByConnection_NOT: ResourceContainedByConnectionWhere @deprecated(reason: \\"Use \`containedByConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Resources where one of the related containedByConnections match this filter
              \\"\\"\\"
              containedByConnection_SINGLE: ResourceContainedByConnectionWhere
              \\"\\"\\"
              Return Resources where some of the related containedByConnections match this filter
              \\"\\"\\"
              containedByConnection_SOME: ResourceContainedByConnectionWhere
              \\"\\"\\"
              Return Resources where all of the related containedBies match this filter
              \\"\\"\\"
              containedBy_ALL: ResourceWhere
              \\"\\"\\"
              Return Resources where none of the related containedBies match this filter
              \\"\\"\\"
              containedBy_NONE: ResourceWhere
              containedBy_NOT: ResourceWhere @deprecated(reason: \\"Use \`containedBy_NONE\` instead.\\")
              \\"\\"\\"
              Return Resources where one of the related containedBies match this filter
              \\"\\"\\"
              containedBy_SINGLE: ResourceWhere
              \\"\\"\\"
              Return Resources where some of the related containedBies match this filter
              \\"\\"\\"
              containedBy_SOME: ResourceWhere
              createdAt: DateTime
              createdAt_GT: DateTime
              createdAt_GTE: DateTime
              createdAt_IN: [DateTime!]
              createdAt_LT: DateTime
              createdAt_LTE: DateTime
              createdAt_NOT: DateTime @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              createdAt_NOT_IN: [DateTime!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              externalIds: [ID!]
              externalIds_INCLUDES: ID
              externalIds_NOT: [ID!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              externalIds_NOT_INCLUDES: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID!]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: ID
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              properties: [Property!]
              properties_INCLUDES: Property
              properties_NOT: [Property!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              properties_NOT_INCLUDES: Property @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              tags: [Tag!]
              tags_INCLUDES: Tag
              tags_NOT: [Tag!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              tags_NOT_INCLUDES: Tag @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              type: ResourceType
              type_IN: [ResourceType!]
              type_NOT: ResourceType @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              type_NOT_IN: [ResourceType!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              updatedAt: DateTime
              updatedAt_GT: DateTime
              updatedAt_GTE: DateTime
              updatedAt_IN: [DateTime!]
              updatedAt_LT: DateTime
              updatedAt_LTE: DateTime
              updatedAt_NOT: DateTime @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              updatedAt_NOT_IN: [DateTime!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            type ResourcesConnection {
              edges: [ResourceEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelectionNullable {
              longest: String
              shortest: String
            }

            enum Tag {
              TagA
              TagB
              TagC
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateResourcesMutationResponse {
              info: UpdateInfo!
              resources: [Resource!]!
            }"
        `);
    });
});
