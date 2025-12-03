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

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count {
              nodes: Int!
            }

            type CountConnection {
              edges: Int!
              nodes: Int!
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

            \\"\\"\\"Filters for an aggregation of an DateTime input field\\"\\"\\"
            input DateTimeScalarAggregationFilters {
              max: DateTimeScalarFilters
              min: DateTimeScalarFilters
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

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            \\"\\"\\"ID list filters\\"\\"\\"
            input IDListFilters {
              eq: [ID!]
              includes: ID
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              in: [ID!]
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            \\"\\"\\"Int filters\\"\\"\\"
            input IntScalarFilters {
              eq: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
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
            input PropertyListEnumScalarFilters {
              eq: [Property!]
              includes: Property
            }

            \\"\\"\\"Mutations for a list for Property\\"\\"\\"
            input PropertyListEnumScalarMutations {
              pop: Property
              push: [Property!]
              set: [Property!]
            }

            type Query {
              resourceEntities(limit: Int, offset: Int, sort: [ResourceEntitySort!], where: ResourceEntityWhere): [ResourceEntity!]!
              resourceEntitiesConnection(after: String, first: Int, sort: [ResourceEntitySort!], where: ResourceEntityWhere): ResourceEntitiesConnection!
              resources(limit: Int, offset: Int, sort: [ResourceSort!], where: ResourceWhere): [Resource!]!
              resourcesConnection(after: String, first: Int, sort: [ResourceSort!], where: ResourceWhere): ResourcesConnection!
            }

            type Resource implements ResourceEntity {
              \\"\\"\\"
              Resources encapsulating the given resource (e.g., a github org contains a repo)
              \\"\\"\\"
              containedBy(limit: Int, offset: Int, sort: [ResourceSort!], where: ResourceWhere): [Resource!]!
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

            type ResourceAggregate {
              count: Count!
              node: ResourceAggregateNode!
            }

            type ResourceAggregateNode {
              createdAt: DateTimeAggregateSelection!
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: ResourceContainedByNodeAggregationWhereInput
            }

            input ResourceContainedByConnectFieldInput {
              connect: [ResourceConnectInput!]
              where: ResourceConnectWhere
            }

            type ResourceContainedByConnection {
              aggregate: ResourceResourceContainedByAggregateSelection!
              edges: [ResourceContainedByRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ResourceContainedByConnectionAggregateInput {
              AND: [ResourceContainedByConnectionAggregateInput!]
              NOT: ResourceContainedByConnectionAggregateInput
              OR: [ResourceContainedByConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: ResourceContainedByNodeAggregationWhereInput
            }

            input ResourceContainedByConnectionFilters {
              \\"\\"\\"
              Filter Resources by aggregating results on related ResourceContainedByConnections
              \\"\\"\\"
              aggregate: ResourceContainedByConnectionAggregateInput
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
              createdAt: DateTimeScalarAggregationFilters
              createdAt_MAX_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { eq: ... } } }' instead.\\")
              createdAt_MAX_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { gt: ... } } }' instead.\\")
              createdAt_MAX_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { gte: ... } } }' instead.\\")
              createdAt_MAX_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { lt: ... } } }' instead.\\")
              createdAt_MAX_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { max: { lte: ... } } }' instead.\\")
              createdAt_MIN_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { eq: ... } } }' instead.\\")
              createdAt_MIN_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { gt: ... } } }' instead.\\")
              createdAt_MIN_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { gte: ... } } }' instead.\\")
              createdAt_MIN_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { lt: ... } } }' instead.\\")
              createdAt_MIN_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'createdAt: { min: { lte: ... } } }' instead.\\")
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
              updatedAt: DateTimeScalarAggregationFilters
              updatedAt_MAX_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'updatedAt: { max: { eq: ... } } }' instead.\\")
              updatedAt_MAX_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'updatedAt: { max: { gt: ... } } }' instead.\\")
              updatedAt_MAX_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'updatedAt: { max: { gte: ... } } }' instead.\\")
              updatedAt_MAX_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'updatedAt: { max: { lt: ... } } }' instead.\\")
              updatedAt_MAX_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'updatedAt: { max: { lte: ... } } }' instead.\\")
              updatedAt_MIN_EQUAL: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'updatedAt: { min: { eq: ... } } }' instead.\\")
              updatedAt_MIN_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'updatedAt: { min: { gt: ... } } }' instead.\\")
              updatedAt_MIN_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'updatedAt: { min: { gte: ... } } }' instead.\\")
              updatedAt_MIN_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'updatedAt: { min: { lt: ... } } }' instead.\\")
              updatedAt_MIN_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter 'updatedAt: { min: { lte: ... } } }' instead.\\")
            }

            type ResourceContainedByRelationship {
              cursor: String!
              node: Resource!
            }

            input ResourceContainedByUpdateConnectionInput {
              node: ResourceUpdateInput
              where: ResourceContainedByConnectionWhere
            }

            input ResourceContainedByUpdateFieldInput {
              connect: [ResourceContainedByConnectFieldInput!]
              create: [ResourceContainedByCreateFieldInput!]
              delete: [ResourceContainedByDeleteFieldInput!]
              disconnect: [ResourceContainedByDisconnectFieldInput!]
              update: ResourceContainedByUpdateConnectionInput
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
              aggregate: ResourceEntityAggregate!
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

            type ResourceEntityAggregate {
              count: Count!
              node: ResourceEntityAggregateNode!
            }

            type ResourceEntityAggregateNode {
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
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              properties: PropertyListEnumScalarFilters
              properties_EQ: [Property!] @deprecated(reason: \\"Please use the relevant generic filter properties: { eq: ... }\\")
              properties_INCLUDES: Property @deprecated(reason: \\"Please use the relevant generic filter properties: { includes: ... }\\")
              tags: TagListEnumScalarFilters
              tags_EQ: [Tag!] @deprecated(reason: \\"Please use the relevant generic filter tags: { eq: ... }\\")
              tags_INCLUDES: Tag @deprecated(reason: \\"Please use the relevant generic filter tags: { includes: ... }\\")
              type: ResourceTypeEnumScalarFilters
              type_EQ: ResourceType @deprecated(reason: \\"Please use the relevant generic filter type: { eq: ... }\\")
              type_IN: [ResourceType!] @deprecated(reason: \\"Please use the relevant generic filter type: { in: ... }\\")
              typename: [ResourceEntityImplementation!]
            }

            input ResourceRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Resources match this filter\\"\\"\\"
              all: ResourceWhere
              \\"\\"\\"Filter type where none of the related Resources match this filter\\"\\"\\"
              none: ResourceWhere
              \\"\\"\\"Filter type where one of the related Resources match this filter\\"\\"\\"
              single: ResourceWhere
              \\"\\"\\"Filter type where some of the related Resources match this filter\\"\\"\\"
              some: ResourceWhere
            }

            type ResourceResourceContainedByAggregateSelection {
              count: CountConnection!
              node: ResourceResourceContainedByNodeAggregateSelection
            }

            type ResourceResourceContainedByNodeAggregateSelection {
              createdAt: DateTimeAggregateSelection!
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
              eq: ResourceType
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
              containedBy: ResourceRelationshipFilters
              containedByAggregate: ResourceContainedByAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the containedByConnection filter, please use { containedByConnection: { aggregate: {...} } } instead\\")
              containedByConnection: ResourceContainedByConnectionFilters
              \\"\\"\\"
              Return Resources where all of the related ResourceContainedByConnections match this filter
              \\"\\"\\"
              containedByConnection_ALL: ResourceContainedByConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'containedByConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Resources where none of the related ResourceContainedByConnections match this filter
              \\"\\"\\"
              containedByConnection_NONE: ResourceContainedByConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'containedByConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Resources where one of the related ResourceContainedByConnections match this filter
              \\"\\"\\"
              containedByConnection_SINGLE: ResourceContainedByConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'containedByConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Resources where some of the related ResourceContainedByConnections match this filter
              \\"\\"\\"
              containedByConnection_SOME: ResourceContainedByConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'containedByConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Resources where all of the related Resources match this filter\\"\\"\\"
              containedBy_ALL: ResourceWhere @deprecated(reason: \\"Please use the relevant generic filter 'containedBy: { all: ... }' instead.\\")
              \\"\\"\\"Return Resources where none of the related Resources match this filter\\"\\"\\"
              containedBy_NONE: ResourceWhere @deprecated(reason: \\"Please use the relevant generic filter 'containedBy: { none: ... }' instead.\\")
              \\"\\"\\"Return Resources where one of the related Resources match this filter\\"\\"\\"
              containedBy_SINGLE: ResourceWhere @deprecated(reason: \\"Please use the relevant generic filter 'containedBy: {  single: ... }' instead.\\")
              \\"\\"\\"Return Resources where some of the related Resources match this filter\\"\\"\\"
              containedBy_SOME: ResourceWhere @deprecated(reason: \\"Please use the relevant generic filter 'containedBy: {  some: ... }' instead.\\")
              createdAt: DateTimeScalarFilters
              createdAt_EQ: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { eq: ... }\\")
              createdAt_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { gt: ... }\\")
              createdAt_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { gte: ... }\\")
              createdAt_IN: [DateTime!] @deprecated(reason: \\"Please use the relevant generic filter createdAt: { in: ... }\\")
              createdAt_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { lt: ... }\\")
              createdAt_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter createdAt: { lte: ... }\\")
              externalIds: IDListFilters
              externalIds_EQ: [ID!] @deprecated(reason: \\"Please use the relevant generic filter externalIds: { eq: ... }\\")
              externalIds_INCLUDES: ID @deprecated(reason: \\"Please use the relevant generic filter externalIds: { includes: ... }\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              properties: PropertyListEnumScalarFilters
              properties_EQ: [Property!] @deprecated(reason: \\"Please use the relevant generic filter properties: { eq: ... }\\")
              properties_INCLUDES: Property @deprecated(reason: \\"Please use the relevant generic filter properties: { includes: ... }\\")
              tags: TagListEnumScalarFilters
              tags_EQ: [Tag!] @deprecated(reason: \\"Please use the relevant generic filter tags: { eq: ... }\\")
              tags_INCLUDES: Tag @deprecated(reason: \\"Please use the relevant generic filter tags: { includes: ... }\\")
              type: ResourceTypeEnumScalarFilters
              type_EQ: ResourceType @deprecated(reason: \\"Please use the relevant generic filter type: { eq: ... }\\")
              type_IN: [ResourceType!] @deprecated(reason: \\"Please use the relevant generic filter type: { in: ... }\\")
              updatedAt: DateTimeScalarFilters
              updatedAt_EQ: DateTime @deprecated(reason: \\"Please use the relevant generic filter updatedAt: { eq: ... }\\")
              updatedAt_GT: DateTime @deprecated(reason: \\"Please use the relevant generic filter updatedAt: { gt: ... }\\")
              updatedAt_GTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter updatedAt: { gte: ... }\\")
              updatedAt_IN: [DateTime!] @deprecated(reason: \\"Please use the relevant generic filter updatedAt: { in: ... }\\")
              updatedAt_LT: DateTime @deprecated(reason: \\"Please use the relevant generic filter updatedAt: { lt: ... }\\")
              updatedAt_LTE: DateTime @deprecated(reason: \\"Please use the relevant generic filter updatedAt: { lte: ... }\\")
            }

            type ResourcesConnection {
              aggregate: ResourceAggregate!
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

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
            }

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              in: [String!]
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
            input TagListEnumScalarFilters {
              eq: [Tag!]
              includes: Tag
            }

            \\"\\"\\"Mutations for a list for Tag\\"\\"\\"
            input TagListEnumScalarMutations {
              pop: Tag
              push: [Tag!]
              set: [Tag!]
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
