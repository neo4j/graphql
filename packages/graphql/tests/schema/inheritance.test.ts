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
import { Neo4jGraphQL } from "../../src";

describe("inheritance", () => {
    test("various graphql entities should correctly perform inheritance", async () => {
        const typeDefs = gql`
            directive @customDirectiveField on FIELD_DEFINITION
            directive @customDirectiveObj on OBJECT
            directive @customDirectiveInter on INTERFACE

            interface Person @customDirectiveInter {
                name: String @customDirectiveField
                friends: [Person!]! @declareRelationship @customDirectiveField
            }

            type Actor implements Person @customDirectiveObj @node {
                name: String
                friends: [Person!]! @relationship(type: "FRIENDS_WITH", direction: OUT, properties: "FriendsWith")
            }

            type FriendsWith @relationshipProperties {
                since: Int
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            directive @customDirectiveField on FIELD_DEFINITION

            directive @customDirectiveInter on INTERFACE

            directive @customDirectiveObj on OBJECT

            type Actor implements Person @customDirectiveObj {
              friends(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              friendsConnection(after: String, first: Int, sort: [PersonFriendsConnectionSort!], where: PersonFriendsConnectionWhere): PersonFriendsConnection!
              name: String
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              friends: ActorFriendsFieldInput
              name: String
            }

            input ActorDeleteInput {
              friends: [ActorFriendsDeleteFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            input ActorFriendsAggregateInput {
              AND: [ActorFriendsAggregateInput!]
              NOT: ActorFriendsAggregateInput
              OR: [ActorFriendsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: FriendsWithAggregationWhereInput
              node: ActorFriendsNodeAggregationWhereInput
            }

            input ActorFriendsConnectFieldInput {
              connect: PersonConnectInput
              edge: FriendsWithCreateInput
              where: PersonConnectWhere
            }

            input ActorFriendsConnectionAggregateInput {
              AND: [ActorFriendsConnectionAggregateInput!]
              NOT: ActorFriendsConnectionAggregateInput
              OR: [ActorFriendsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: FriendsWithAggregationWhereInput
              node: ActorFriendsNodeAggregationWhereInput
            }

            input ActorFriendsConnectionFilters {
              \\"\\"\\"
              Filter Actors by aggregating results on related PersonFriendsConnections
              \\"\\"\\"
              aggregate: ActorFriendsConnectionAggregateInput
              \\"\\"\\"
              Return Actors where all of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              all: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              none: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              single: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              some: PersonFriendsConnectionWhere
            }

            input ActorFriendsCreateFieldInput {
              edge: FriendsWithCreateInput
              node: PersonCreateInput!
            }

            input ActorFriendsDeleteFieldInput {
              delete: PersonDeleteInput
              where: PersonFriendsConnectionWhere
            }

            input ActorFriendsDisconnectFieldInput {
              disconnect: PersonDisconnectInput
              where: PersonFriendsConnectionWhere
            }

            input ActorFriendsFieldInput {
              connect: [ActorFriendsConnectFieldInput!]
              create: [ActorFriendsCreateFieldInput!]
            }

            input ActorFriendsNodeAggregationWhereInput {
              AND: [ActorFriendsNodeAggregationWhereInput!]
              NOT: ActorFriendsNodeAggregationWhereInput
              OR: [ActorFriendsNodeAggregationWhereInput!]
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
            }

            input ActorFriendsUpdateConnectionInput {
              edge: FriendsWithUpdateInput
              node: PersonUpdateInput
              where: PersonFriendsConnectionWhere
            }

            input ActorFriendsUpdateFieldInput {
              connect: [ActorFriendsConnectFieldInput!]
              create: [ActorFriendsCreateFieldInput!]
              delete: [ActorFriendsDeleteFieldInput!]
              disconnect: [ActorFriendsDisconnectFieldInput!]
              update: ActorFriendsUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              friends: [ActorFriendsUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              friends: PersonRelationshipFilters
              friendsAggregate: ActorFriendsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the friendsConnection filter, please use { friendsConnection: { aggregate: {...} } } instead\\")
              friendsConnection: ActorFriendsConnectionFilters
              \\"\\"\\"
              Return Actors where all of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_ALL: PersonFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_NONE: PersonFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SINGLE: PersonFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SOME: PersonFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related People match this filter\\"\\"\\"
              friends_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related People match this filter\\"\\"\\"
              friends_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related People match this filter\\"\\"\\"
              friends_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related People match this filter\\"\\"\\"
              friends_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count {
              nodes: Int!
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
              info: CreateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
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

            \\"\\"\\"
            The edge properties for the following fields:
            * Actor.friends
            \\"\\"\\"
            type FriendsWith {
              since: Int
            }

            input FriendsWithAggregationWhereInput {
              AND: [FriendsWithAggregationWhereInput!]
              NOT: FriendsWithAggregationWhereInput
              OR: [FriendsWithAggregationWhereInput!]
              since: IntScalarAggregationFilters
              since_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'since: { average: { eq: ... } } }' instead.\\")
              since_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'since: { average: { gt: ... } } }' instead.\\")
              since_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'since: { average: { gte: ... } } }' instead.\\")
              since_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'since: { average: { lt: ... } } }' instead.\\")
              since_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'since: { average: { lte: ... } } }' instead.\\")
              since_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { max: { eq: ... } } }' instead.\\")
              since_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { max: { gt: ... } } }' instead.\\")
              since_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { max: { gte: ... } } }' instead.\\")
              since_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { max: { lt: ... } } }' instead.\\")
              since_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { max: { lte: ... } } }' instead.\\")
              since_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { min: { eq: ... } } }' instead.\\")
              since_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { min: { gt: ... } } }' instead.\\")
              since_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { min: { gte: ... } } }' instead.\\")
              since_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { min: { lt: ... } } }' instead.\\")
              since_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { min: { lte: ... } } }' instead.\\")
              since_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { sum: { eq: ... } } }' instead.\\")
              since_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { sum: { gt: ... } } }' instead.\\")
              since_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { sum: { gte: ... } } }' instead.\\")
              since_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { sum: { lt: ... } } }' instead.\\")
              since_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'since: { sum: { lte: ... } } }' instead.\\")
            }

            input FriendsWithCreateInput {
              since: Int
            }

            input FriendsWithSort {
              since: SortDirection
            }

            input FriendsWithUpdateInput {
              since: IntScalarMutations
              since_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'since: { decrement: ... } }' instead.\\")
              since_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'since: { increment: ... } }' instead.\\")
              since_SET: Int @deprecated(reason: \\"Please use the generic mutation 'since: { set: ... } }' instead.\\")
            }

            input FriendsWithWhere {
              AND: [FriendsWithWhere!]
              NOT: FriendsWithWhere
              OR: [FriendsWithWhere!]
              since: IntScalarFilters
              since_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter since: { eq: ... }\\")
              since_GT: Int @deprecated(reason: \\"Please use the relevant generic filter since: { gt: ... }\\")
              since_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter since: { gte: ... }\\")
              since_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter since: { in: ... }\\")
              since_LT: Int @deprecated(reason: \\"Please use the relevant generic filter since: { lt: ... }\\")
              since_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter since: { lte: ... }\\")
            }

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
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

            \\"\\"\\"Int mutations\\"\\"\\"
            input IntScalarMutations {
              add: Int
              set: Int
              subtract: Int
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type PeopleConnection {
              aggregate: PersonAggregate!
              edges: [PersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface Person @customDirectiveInter {
              friends(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]! @customDirectiveField
              friendsConnection(after: String, first: Int, sort: [PersonFriendsConnectionSort!], where: PersonFriendsConnectionWhere): PersonFriendsConnection!
              name: String @customDirectiveField
            }

            type PersonAggregate {
              count: Count!
              node: PersonAggregateNode!
            }

            type PersonAggregateNode {
              name: StringAggregateSelection!
            }

            input PersonConnectInput {
              friends: [PersonFriendsConnectFieldInput!]
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            input PersonCreateInput {
              Actor: ActorCreateInput
            }

            input PersonDeleteInput {
              friends: [PersonFriendsDeleteFieldInput!]
            }

            input PersonDisconnectInput {
              friends: [PersonFriendsDisconnectFieldInput!]
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            input PersonFriendsAggregateInput {
              AND: [PersonFriendsAggregateInput!]
              NOT: PersonFriendsAggregateInput
              OR: [PersonFriendsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: PersonFriendsEdgeAggregationWhereInput
              node: PersonFriendsNodeAggregationWhereInput
            }

            input PersonFriendsConnectFieldInput {
              connect: PersonConnectInput
              edge: PersonFriendsEdgeCreateInput
              where: PersonConnectWhere
            }

            type PersonFriendsConnection {
              edges: [PersonFriendsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonFriendsConnectionAggregateInput {
              AND: [PersonFriendsConnectionAggregateInput!]
              NOT: PersonFriendsConnectionAggregateInput
              OR: [PersonFriendsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: PersonFriendsEdgeAggregationWhereInput
              node: PersonFriendsNodeAggregationWhereInput
            }

            input PersonFriendsConnectionFilters {
              \\"\\"\\"
              Filter People by aggregating results on related PersonFriendsConnections
              \\"\\"\\"
              aggregate: PersonFriendsConnectionAggregateInput
              \\"\\"\\"
              Return People where all of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              all: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              none: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return People where one of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              single: PersonFriendsConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              some: PersonFriendsConnectionWhere
            }

            input PersonFriendsConnectionSort {
              edge: PersonFriendsEdgeSort
              node: PersonSort
            }

            input PersonFriendsConnectionWhere {
              AND: [PersonFriendsConnectionWhere!]
              NOT: PersonFriendsConnectionWhere
              OR: [PersonFriendsConnectionWhere!]
              edge: PersonFriendsEdgeWhere
              node: PersonWhere
            }

            input PersonFriendsCreateFieldInput {
              edge: PersonFriendsEdgeCreateInput
              node: PersonCreateInput!
            }

            input PersonFriendsDeleteFieldInput {
              delete: PersonDeleteInput
              where: PersonFriendsConnectionWhere
            }

            input PersonFriendsDisconnectFieldInput {
              disconnect: PersonDisconnectInput
              where: PersonFriendsConnectionWhere
            }

            input PersonFriendsEdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              FriendsWith: FriendsWithAggregationWhereInput
            }

            input PersonFriendsEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              FriendsWith: FriendsWithCreateInput
            }

            input PersonFriendsEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              FriendsWith: FriendsWithSort
            }

            input PersonFriendsEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              FriendsWith: FriendsWithUpdateInput
            }

            input PersonFriendsEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Actor
              \\"\\"\\"
              FriendsWith: FriendsWithWhere
            }

            input PersonFriendsNodeAggregationWhereInput {
              AND: [PersonFriendsNodeAggregationWhereInput!]
              NOT: PersonFriendsNodeAggregationWhereInput
              OR: [PersonFriendsNodeAggregationWhereInput!]
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
            }

            type PersonFriendsRelationship {
              cursor: String!
              node: Person!
              properties: PersonFriendsRelationshipProperties!
            }

            union PersonFriendsRelationshipProperties = FriendsWith

            input PersonFriendsUpdateConnectionInput {
              edge: PersonFriendsEdgeUpdateInput
              node: PersonUpdateInput
              where: PersonFriendsConnectionWhere
            }

            input PersonFriendsUpdateFieldInput {
              connect: [PersonFriendsConnectFieldInput!]
              create: [PersonFriendsCreateFieldInput!]
              delete: [PersonFriendsDeleteFieldInput!]
              disconnect: [PersonFriendsDisconnectFieldInput!]
              update: PersonFriendsUpdateConnectionInput
            }

            enum PersonImplementation {
              Actor
            }

            input PersonRelationshipFilters {
              \\"\\"\\"Filter type where all of the related People match this filter\\"\\"\\"
              all: PersonWhere
              \\"\\"\\"Filter type where none of the related People match this filter\\"\\"\\"
              none: PersonWhere
              \\"\\"\\"Filter type where one of the related People match this filter\\"\\"\\"
              single: PersonWhere
              \\"\\"\\"Filter type where some of the related People match this filter\\"\\"\\"
              some: PersonWhere
            }

            \\"\\"\\"
            Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
            \\"\\"\\"
            input PersonSort {
              name: SortDirection
            }

            input PersonUpdateInput {
              friends: [PersonFriendsUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              friends: PersonRelationshipFilters
              friendsAggregate: PersonFriendsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the friendsConnection filter, please use { friendsConnection: { aggregate: {...} } } instead\\")
              friendsConnection: PersonFriendsConnectionFilters
              \\"\\"\\"
              Return People where all of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_ALL: PersonFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where none of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_NONE: PersonFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where one of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SINGLE: PersonFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where some of the related PersonFriendsConnections match this filter
              \\"\\"\\"
              friendsConnection_SOME: PersonFriendsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'friendsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return People where all of the related People match this filter\\"\\"\\"
              friends_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: { all: ... }' instead.\\")
              \\"\\"\\"Return People where none of the related People match this filter\\"\\"\\"
              friends_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: { none: ... }' instead.\\")
              \\"\\"\\"Return People where one of the related People match this filter\\"\\"\\"
              friends_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: {  single: ... }' instead.\\")
              \\"\\"\\"Return People where some of the related People match this filter\\"\\"\\"
              friends_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'friends: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              typename: [PersonImplementation!]
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }"
        `);
    });
});
