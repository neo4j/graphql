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

describe("Alias", () => {
    test("Custom Directive Simple", async () => {
        const typeDefs = gql`
            type Actor @node {
                name: String!
                city: String @alias(property: "cityPropInDb")
                actedIn: [Movie!]! @relationship(direction: OUT, type: "ACTED_IN", properties: "ActorActedInProps")
            }

            type Movie @node {
                title: String!
                rating: Float @alias(property: "ratingPropInDb")
            }

            type ActorActedInProps @relationshipProperties {
                character: String! @alias(property: "characterPropInDb")
                screenTime: Int
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Actor {
              actedIn(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              actedInAggregate(where: MovieWhere): ActorMovieActedInAggregationSelection
              actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              city: String
              name: String!
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              NOT: ActorActedInAggregateInput
              OR: [ActorActedInAggregateInput!]
              count_EQ: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActorActedInPropsAggregationWhereInput
              node: ActorActedInNodeAggregationWhereInput
            }

            input ActorActedInConnectFieldInput {
              edge: ActorActedInPropsCreateInput!
              where: MovieConnectWhere
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionSort {
              edge: ActorActedInPropsSort
              node: MovieSort
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActorActedInPropsWhere
              node: MovieWhere
            }

            input ActorActedInCreateFieldInput {
              edge: ActorActedInPropsCreateInput!
              node: MovieCreateInput!
            }

            input ActorActedInDeleteFieldInput {
              where: ActorActedInConnectionWhere
            }

            input ActorActedInDisconnectFieldInput {
              where: ActorActedInConnectionWhere
            }

            input ActorActedInFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
            }

            input ActorActedInNodeAggregationWhereInput {
              AND: [ActorActedInNodeAggregationWhereInput!]
              NOT: ActorActedInNodeAggregationWhereInput
              OR: [ActorActedInNodeAggregationWhereInput!]
              rating: FloatScalarAggregationFilters
              rating_AVERAGE_EQUAL: Float
              rating_AVERAGE_GT: Float
              rating_AVERAGE_GTE: Float
              rating_AVERAGE_LT: Float
              rating_AVERAGE_LTE: Float
              rating_MAX_EQUAL: Float
              rating_MAX_GT: Float
              rating_MAX_GTE: Float
              rating_MAX_LT: Float
              rating_MAX_LTE: Float
              rating_MIN_EQUAL: Float
              rating_MIN_GT: Float
              rating_MIN_GTE: Float
              rating_MIN_LT: Float
              rating_MIN_LTE: Float
              rating_SUM_EQUAL: Float
              rating_SUM_GT: Float
              rating_SUM_GTE: Float
              rating_SUM_LT: Float
              rating_SUM_LTE: Float
              title: StringScalarAggregationFilters
              title_AVERAGE_LENGTH_EQUAL: Float
              title_AVERAGE_LENGTH_GT: Float
              title_AVERAGE_LENGTH_GTE: Float
              title_AVERAGE_LENGTH_LT: Float
              title_AVERAGE_LENGTH_LTE: Float
              title_LONGEST_LENGTH_EQUAL: Int
              title_LONGEST_LENGTH_GT: Int
              title_LONGEST_LENGTH_GTE: Int
              title_LONGEST_LENGTH_LT: Int
              title_LONGEST_LENGTH_LTE: Int
              title_SHORTEST_LENGTH_EQUAL: Int
              title_SHORTEST_LENGTH_GT: Int
              title_SHORTEST_LENGTH_GTE: Int
              title_SHORTEST_LENGTH_LT: Int
              title_SHORTEST_LENGTH_LTE: Int
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Actor.actedIn
            \\"\\"\\"
            type ActorActedInProps {
              character: String!
              screenTime: Int
            }

            input ActorActedInPropsAggregationWhereInput {
              AND: [ActorActedInPropsAggregationWhereInput!]
              NOT: ActorActedInPropsAggregationWhereInput
              OR: [ActorActedInPropsAggregationWhereInput!]
              character: StringScalarAggregationFilters
              character_AVERAGE_LENGTH_EQUAL: Float
              character_AVERAGE_LENGTH_GT: Float
              character_AVERAGE_LENGTH_GTE: Float
              character_AVERAGE_LENGTH_LT: Float
              character_AVERAGE_LENGTH_LTE: Float
              character_LONGEST_LENGTH_EQUAL: Int
              character_LONGEST_LENGTH_GT: Int
              character_LONGEST_LENGTH_GTE: Int
              character_LONGEST_LENGTH_LT: Int
              character_LONGEST_LENGTH_LTE: Int
              character_SHORTEST_LENGTH_EQUAL: Int
              character_SHORTEST_LENGTH_GT: Int
              character_SHORTEST_LENGTH_GTE: Int
              character_SHORTEST_LENGTH_LT: Int
              character_SHORTEST_LENGTH_LTE: Int
              screenTime: IntScalarAggregationFilters
              screenTime_AVERAGE_EQUAL: Float
              screenTime_AVERAGE_GT: Float
              screenTime_AVERAGE_GTE: Float
              screenTime_AVERAGE_LT: Float
              screenTime_AVERAGE_LTE: Float
              screenTime_MAX_EQUAL: Int
              screenTime_MAX_GT: Int
              screenTime_MAX_GTE: Int
              screenTime_MAX_LT: Int
              screenTime_MAX_LTE: Int
              screenTime_MIN_EQUAL: Int
              screenTime_MIN_GT: Int
              screenTime_MIN_GTE: Int
              screenTime_MIN_LT: Int
              screenTime_MIN_LTE: Int
              screenTime_SUM_EQUAL: Int
              screenTime_SUM_GT: Int
              screenTime_SUM_GTE: Int
              screenTime_SUM_LT: Int
              screenTime_SUM_LTE: Int
            }

            input ActorActedInPropsCreateInput {
              character: String!
              screenTime: Int
            }

            input ActorActedInPropsSort {
              character: SortDirection
              screenTime: SortDirection
            }

            input ActorActedInPropsUpdateInput {
              character: StringScalarMutations
              character_SET: String
              screenTime: IntScalarMutations
              screenTime_DECREMENT: Int
              screenTime_INCREMENT: Int
              screenTime_SET: Int
            }

            input ActorActedInPropsWhere {
              AND: [ActorActedInPropsWhere!]
              NOT: ActorActedInPropsWhere
              OR: [ActorActedInPropsWhere!]
              character: StringScalarFilters
              character_CONTAINS: String
              character_ENDS_WITH: String
              character_EQ: String
              character_IN: [String!]
              character_STARTS_WITH: String
              screenTime: IntScalarFilters
              screenTime_EQ: Int
              screenTime_GT: Int
              screenTime_GTE: Int
              screenTime_IN: [Int]
              screenTime_LT: Int
              screenTime_LTE: Int
            }

            type ActorActedInRelationship {
              cursor: String!
              node: Movie!
              properties: ActorActedInProps!
            }

            input ActorActedInUpdateConnectionInput {
              edge: ActorActedInPropsUpdateInput
              node: MovieUpdateInput
            }

            input ActorActedInUpdateFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
              delete: [ActorActedInDeleteFieldInput!]
              disconnect: [ActorActedInDisconnectFieldInput!]
              update: ActorActedInUpdateConnectionInput
              where: ActorActedInConnectionWhere
            }

            type ActorAggregateSelection {
              city: StringAggregateSelection!
              count: Int!
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              actedIn: ActorActedInFieldInput
              city: String
              name: String!
            }

            input ActorDeleteInput {
              actedIn: [ActorActedInDeleteFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            type ActorMovieActedInAggregationSelection {
              count: Int!
              edge: ActorMovieActedInEdgeAggregateSelection
              node: ActorMovieActedInNodeAggregateSelection
            }

            type ActorMovieActedInEdgeAggregateSelection {
              character: StringAggregateSelection!
              screenTime: IntAggregateSelection!
            }

            type ActorMovieActedInNodeAggregateSelection {
              rating: FloatAggregateSelection!
              title: StringAggregateSelection!
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              city: SortDirection
              name: SortDirection
            }

            input ActorUpdateInput {
              actedIn: [ActorActedInUpdateFieldInput!]
              city: StringScalarMutations
              city_SET: String
              name: StringScalarMutations
              name_SET: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedInAggregate: ActorActedInAggregateInput
              \\"\\"\\"
              Return Actors where all of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_ALL: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_NONE: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SINGLE: ActorActedInConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorActedInConnections match this filter
              \\"\\"\\"
              actedInConnection_SOME: ActorActedInConnectionWhere
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              actedIn_ALL: MovieWhere
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              actedIn_NONE: MovieWhere
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              actedIn_SINGLE: MovieWhere
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              actedIn_SOME: MovieWhere
              city: StringScalarFilters
              city_CONTAINS: String
              city_ENDS_WITH: String
              city_EQ: String
              city_IN: [String]
              city_STARTS_WITH: String
              name: StringScalarFilters
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String!]
              name_STARTS_WITH: String
            }

            type ActorsConnection {
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            \\"\\"\\"Filters for an aggregation of a float field\\"\\"\\"
            input FloatScalarAggregationFilters {
              average: FloatScalarFilters
              max: FloatScalarFilters
              min: FloatScalarFilters
              sum: FloatScalarFilters
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

            \\"\\"\\"Float mutations\\"\\"\\"
            input FloatScalarMutations {
              add: Float
              divide: Float
              multiply: Float
              set: Float
              subtract: Float
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
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

            type Movie {
              rating: Float
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              rating: FloatAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              rating: Float
              title: String!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              rating: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              rating: FloatScalarMutations
              rating_ADD: Float
              rating_DIVIDE: Float
              rating_MULTIPLY: Float
              rating_SET: Float
              rating_SUBTRACT: Float
              title: StringScalarMutations
              title_SET: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              rating: FloatScalarFilters
              rating_EQ: Float
              rating_GT: Float
              rating_GTE: Float
              rating_IN: [Float]
              rating_LT: Float
              rating_LTE: Float
              title: StringScalarFilters
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_EQ: String
              title_IN: [String!]
              title_STARTS_WITH: String
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
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
            }

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }"
        `);
    });
});
