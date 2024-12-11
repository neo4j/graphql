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
import { gql } from "graphql-tag";
import { lexicographicSortSchema } from "graphql/utilities";
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
                id: ID!
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

            type Resource implements ResourceEntity @node {
                id: ID!
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

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateResourcesMutationResponse {
              info: CreateInfo!
              resources: [Resource!]!
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            type DateTimeAggregateSelection {
              max: DateTime
              min: DateTime
            }

            \\"\\"\\"DateTime filters\\"\\"\\"
            input DateTimeScalarFilters {
              eq: DateTime
              gt: DateTime
              gte: DateTime
              in: [DateTime!]
              lt: DateTime
              lte: DateTime
            }

            \\"\\"\\"DateTime mutations\\"\\"\\"
            input DateTimeScalarMutations {
              set: DateTime
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            \\"\\"\\"ID list filters\\"\\"\\"
            input IDListFilters {
              eq: [IDScalarFilters!]
              includes: IDScalarFilters
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              gt: ID
              gte: ID
              in: [ID!]
              lt: ID
              lte: ID
              matches: ID
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            \\"\\"\\"Mutations for a list for ID\\"\\"\\"
            input ListIDMutations {
              pop: Int
              push: [ID!]
              set: [ID!]
            }

            type Mutation {
              createResources(input: [ResourceCreateInput!]!): CreateResourcesMutationResponse!
              deleteResources(delete: ResourceDeleteInput, where: ResourceWhere): DeleteInfo!
              updateResources(update: ResourceUpdateInput, where: ResourceWhere): UpdateResourcesMutationResponse!
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

            \\"\\"\\"Property filters\\"\\"\\"
            input PropertyEnumScalarFilters {
              equals: Property
              in: [Property!]
            }

            \\"\\"\\"Mutations for a list for Property\\"\\"\\"
            input PropertyListEnumScalarMutations {
              pop: Property
              push: [Property!]!
              set: [Property!]!
            }

            type Query {
              resourceEntities(limit: Int, offset: Int, sort: [ResourceEntitySort!], where: ResourceEntityWhere): [ResourceEntity!]!
              resourceEntitiesAggregate(where: ResourceEntityWhere): ResourceEntityAggregateSelection!
              resourceEntitiesConnection(after: String, first: Int, sort: [ResourceEntitySort!], where: ResourceEntityWhere): ResourceEntitiesConnection!
              resources(limit: Int, offset: Int, sort: [ResourceSort!], where: ResourceWhere): [Resource!]!
              resourcesAggregate(where: ResourceWhere): ResourceAggregateSelection!
              resourcesConnection(after: String, first: Int, sort: [ResourceSort!], where: ResourceWhere): ResourcesConnection!
            }

            type Resource implements ResourceEntity {
              \\"\\"\\"
              Resources encapsulating the given resource (e.g., a github org contains a repo)
              \\"\\"\\"
              containedBy(limit: Int, offset: Int, sort: [ResourceSort!], where: ResourceWhere): [Resource!]!
              containedByAggregate(where: ResourceWhere): ResourceResourceContainedByAggregationSelection
              containedByConnection(after: String, first: Int, sort: [ResourceContainedByConnectionSort!], where: ResourceContainedByConnectionWhere): ResourceContainedByConnection!
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
              createdAt: DateTimeAggregateSelection!
              id: IDAggregateSelection!
              name: StringAggregateSelection!
              updatedAt: DateTimeAggregateSelection!
            }

            input ResourceConnectInput {
              containedBy: [ResourceContainedByConnectFieldInput!]
            }

            input ResourceConnectWhere {
              node: ResourceWhere!
            }

            input ResourceContainedByAggregateInput {
              AND: [ResourceContainedByAggregateInput!]
              NOT: ResourceContainedByAggregateInput
              OR: [ResourceContainedByAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: ResourceContainedByNodeAggregationWhereInput
            }

            input ResourceContainedByConnectFieldInput {
              connect: [ResourceConnectInput!]
              where: ResourceConnectWhere
            }

            type ResourceContainedByConnection {
              edges: [ResourceContainedByRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ResourceContainedByConnectionFilters {
              \\"\\"\\"
              Return Resources where all of the related ResourceContainedByConnections match this filter
              \\"\\"\\"
              all: ResourceContainedByConnectionWhere
              \\"\\"\\"
              Return Resources where none of the related ResourceContainedByConnections match this filter
              \\"\\"\\"
              none: ResourceContainedByConnectionWhere
              \\"\\"\\"
              Return Resources where one of the related ResourceContainedByConnections match this filter
              \\"\\"\\"
              single: ResourceContainedByConnectionWhere
              \\"\\"\\"
              Return Resources where some of the related ResourceContainedByConnections match this filter
              \\"\\"\\"
              some: ResourceContainedByConnectionWhere
            }

            input ResourceContainedByConnectionSort {
              node: ResourceSort
            }

            input ResourceContainedByConnectionWhere {
              AND: [ResourceContainedByConnectionWhere!]
              NOT: ResourceContainedByConnectionWhere
              OR: [ResourceContainedByConnectionWhere!]
              node: ResourceWhere
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
              create: [ResourceContainedByCreateFieldInput!]
            }

            input ResourceContainedByNodeAggregationWhereInput {
              AND: [ResourceContainedByNodeAggregationWhereInput!]
              NOT: ResourceContainedByNodeAggregationWhereInput
              OR: [ResourceContainedByNodeAggregationWhereInput!]
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
              id_MAX_EQUAL: ID
              id_MAX_GT: ID
              id_MAX_GTE: ID
              id_MAX_LT: ID
              id_MAX_LTE: ID
              id_MIN_EQUAL: ID
              id_MIN_GT: ID
              id_MIN_GTE: ID
              id_MIN_LT: ID
              id_MIN_LTE: ID
              name_AVERAGE_LENGTH_EQUAL: Float
              name_AVERAGE_LENGTH_GT: Float
              name_AVERAGE_LENGTH_GTE: Float
              name_AVERAGE_LENGTH_LT: Float
              name_AVERAGE_LENGTH_LTE: Float
              name_LONGEST_LENGTH_EQUAL: Int
              name_LONGEST_LENGTH_GT: Int
              name_LONGEST_LENGTH_GTE: Int
              name_LONGEST_LENGTH_LT: Int
              name_LONGEST_LENGTH_LTE: Int
              name_SHORTEST_LENGTH_EQUAL: Int
              name_SHORTEST_LENGTH_GT: Int
              name_SHORTEST_LENGTH_GTE: Int
              name_SHORTEST_LENGTH_LT: Int
              name_SHORTEST_LENGTH_LTE: Int
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

            input ResourceContainedByRelationshipFilters {
              \\"\\"\\"Return Resources where all of the related Resources match this filter\\"\\"\\"
              all: ResourceWhere
              \\"\\"\\"Return Resources where none of the related Resources match this filter\\"\\"\\"
              none: ResourceWhere
              \\"\\"\\"Return Resources where one of the related Resources match this filter\\"\\"\\"
              single: ResourceWhere
              \\"\\"\\"Return Resources where some of the related Resources match this filter\\"\\"\\"
              some: ResourceWhere
            }

            input ResourceContainedByUpdateConnectionInput {
              node: ResourceUpdateInput
            }

            input ResourceContainedByUpdateFieldInput {
              connect: [ResourceContainedByConnectFieldInput!]
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
              updatedAt: DateTime!
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

            type ResourceEntitiesConnection {
              edges: [ResourceEntityEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type ResourceEntityAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              name: StringAggregateSelection!
            }

            type ResourceEntityEdge {
              cursor: String!
              node: ResourceEntity!
            }

            enum ResourceEntityImplementation {
              Resource
            }

            \\"\\"\\"
            Fields to sort ResourceEntities by. The order in which sorts are applied is not guaranteed when specifying many fields in one ResourceEntitySort object.
            \\"\\"\\"
            input ResourceEntitySort {
              id: SortDirection
              name: SortDirection
              type: SortDirection
            }

            input ResourceEntityWhere {
              AND: [ResourceEntityWhere!]
              NOT: ResourceEntityWhere
              OR: [ResourceEntityWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID!]
              id_STARTS_WITH: ID
              name: StringScalarFilters
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_STARTS_WITH: String
              properties: PropertyEnumScalarFilters
              properties_EQ: [Property!]
              properties_INCLUDES: Property
              tags: TagEnumScalarFilters
              tags_EQ: [Tag!]
              tags_INCLUDES: Tag
              type: ResourceTypeEnumScalarFilters
              type_EQ: ResourceType
              type_IN: [ResourceType!]
              typename_IN: [ResourceEntityImplementation!]
            }

            type ResourceResourceContainedByAggregationSelection {
              count: Int!
              node: ResourceResourceContainedByNodeAggregateSelection
            }

            type ResourceResourceContainedByNodeAggregateSelection {
              createdAt: DateTimeAggregateSelection!
              id: IDAggregateSelection!
              name: StringAggregateSelection!
              updatedAt: DateTimeAggregateSelection!
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

            \\"\\"\\"ResourceType filters\\"\\"\\"
            input ResourceTypeEnumScalarFilters {
              equals: ResourceType
              in: [ResourceType!]
            }

            \\"\\"\\"ResourceType mutations\\"\\"\\"
            input ResourceTypeEnumScalarMutations {
              set: ResourceType
            }

            input ResourceUpdateInput {
              containedBy: [ResourceContainedByUpdateFieldInput!]
              createdAt: DateTimeScalarMutations
              createdAt_SET: DateTime @deprecated(reason: \\"Please use the generic mutation 'createdAt: { set: ... } }' instead.\\")
              externalIds: ListIDMutations
              externalIds_POP: Int @deprecated(reason: \\"Please use the generic mutation 'externalIds: { pop: ... } }' instead.\\")
              externalIds_PUSH: [ID!] @deprecated(reason: \\"Please use the generic mutation 'externalIds: { push: ... } }' instead.\\")
              externalIds_SET: [ID!] @deprecated(reason: \\"Please use the generic mutation 'externalIds: { set: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
              properties: PropertyListEnumScalarMutations
              properties_SET: [Property!] @deprecated(reason: \\"Please use the generic mutation 'properties: { set: ... } }' instead.\\")
              tags: TagListEnumScalarMutations
              tags_SET: [Tag!] @deprecated(reason: \\"Please use the generic mutation 'tags: { set: ... } }' instead.\\")
              type: ResourceTypeEnumScalarMutations
              type_SET: ResourceType @deprecated(reason: \\"Please use the generic mutation 'type: { set: ... } }' instead.\\")
            }

            input ResourceWhere {
              AND: [ResourceWhere!]
              NOT: ResourceWhere
              OR: [ResourceWhere!]
              containedBy: ResourceContainedByRelationshipFilters
              containedByAggregate: ResourceContainedByAggregateInput
              containedByConnection: ResourceContainedByConnectionFilters
              \\"\\"\\"
              Return Resources where all of the related ResourceContainedByConnections match this filter
              \\"\\"\\"
              containedByConnection_ALL: ResourceContainedByConnectionWhere
              \\"\\"\\"
              Return Resources where none of the related ResourceContainedByConnections match this filter
              \\"\\"\\"
              containedByConnection_NONE: ResourceContainedByConnectionWhere
              \\"\\"\\"
              Return Resources where one of the related ResourceContainedByConnections match this filter
              \\"\\"\\"
              containedByConnection_SINGLE: ResourceContainedByConnectionWhere
              \\"\\"\\"
              Return Resources where some of the related ResourceContainedByConnections match this filter
              \\"\\"\\"
              containedByConnection_SOME: ResourceContainedByConnectionWhere
              \\"\\"\\"Return Resources where all of the related Resources match this filter\\"\\"\\"
              containedBy_ALL: ResourceWhere
              \\"\\"\\"Return Resources where none of the related Resources match this filter\\"\\"\\"
              containedBy_NONE: ResourceWhere
              \\"\\"\\"Return Resources where one of the related Resources match this filter\\"\\"\\"
              containedBy_SINGLE: ResourceWhere
              \\"\\"\\"Return Resources where some of the related Resources match this filter\\"\\"\\"
              containedBy_SOME: ResourceWhere
              createdAt: DateTimeScalarFilters
              createdAt_EQ: DateTime
              createdAt_GT: DateTime
              createdAt_GTE: DateTime
              createdAt_IN: [DateTime!]
              createdAt_LT: DateTime
              createdAt_LTE: DateTime
              externalIds: IDListFilters
              externalIds_EQ: [ID!]
              externalIds_INCLUDES: ID
              id: IDScalarFilters
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID!]
              id_STARTS_WITH: ID
              name: StringScalarFilters
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_STARTS_WITH: String
              properties: PropertyEnumScalarFilters
              properties_EQ: [Property!]
              properties_INCLUDES: Property
              tags: TagEnumScalarFilters
              tags_EQ: [Tag!]
              tags_INCLUDES: Tag
              type: ResourceTypeEnumScalarFilters
              type_EQ: ResourceType
              type_IN: [ResourceType!]
              updatedAt: DateTimeScalarFilters
              updatedAt_EQ: DateTime
              updatedAt_GT: DateTime
              updatedAt_GTE: DateTime
              updatedAt_IN: [DateTime!]
              updatedAt_LT: DateTime
              updatedAt_LTE: DateTime
            }

            type ResourcesConnection {
              edges: [ResourceEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
            enum SortDirection {
              \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
              ASC
              \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
              DESC
            }

            type StringAggregateSelection {
              longest: String
              shortest: String
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              gt: String
              gte: String
              in: [String!]
              lt: String
              lte: String
              matches: String
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
            }

            enum Tag {
              TagA
              TagB
              TagC
            }

            \\"\\"\\"Tag filters\\"\\"\\"
            input TagEnumScalarFilters {
              equals: Tag
              in: [Tag!]
            }

            \\"\\"\\"Mutations for a list for Tag\\"\\"\\"
            input TagListEnumScalarMutations {
              pop: Tag
              push: [Tag!]!
              set: [Tag!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
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
