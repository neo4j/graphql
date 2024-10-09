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
              actedIn(directed: Boolean = true, limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              actedInAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieActedInAggregationSelection
              actedInConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              city: String
              name: String!
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              NOT: ActorActedInAggregateInput
              OR: [ActorActedInAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
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
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
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
              rating_AVERAGE_EQUAL: Float
              rating_AVERAGE_GT: Float
              rating_AVERAGE_GTE: Float
              rating_AVERAGE_LT: Float
              rating_AVERAGE_LTE: Float
              rating_EQUAL: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              rating_GT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              rating_GTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              rating_LT: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              rating_LTE: Float @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
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
              title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_LENGTH_EQUAL: Float
              title_AVERAGE_LENGTH_GT: Float
              title_AVERAGE_LENGTH_GTE: Float
              title_AVERAGE_LENGTH_LT: Float
              title_AVERAGE_LENGTH_LTE: Float
              title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_LENGTH_EQUAL: Int
              title_LONGEST_LENGTH_GT: Int
              title_LONGEST_LENGTH_GTE: Int
              title_LONGEST_LENGTH_LT: Int
              title_LONGEST_LENGTH_LTE: Int
              title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_LENGTH_EQUAL: Int
              title_SHORTEST_LENGTH_GT: Int
              title_SHORTEST_LENGTH_GTE: Int
              title_SHORTEST_LENGTH_LT: Int
              title_SHORTEST_LENGTH_LTE: Int
              title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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
              character_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_AVERAGE_LENGTH_EQUAL: Float
              character_AVERAGE_LENGTH_GT: Float
              character_AVERAGE_LENGTH_GTE: Float
              character_AVERAGE_LENGTH_LT: Float
              character_AVERAGE_LENGTH_LTE: Float
              character_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              character_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              character_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              character_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_LONGEST_LENGTH_EQUAL: Int
              character_LONGEST_LENGTH_GT: Int
              character_LONGEST_LENGTH_GTE: Int
              character_LONGEST_LENGTH_LT: Int
              character_LONGEST_LENGTH_LTE: Int
              character_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              character_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              character_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_SHORTEST_LENGTH_EQUAL: Int
              character_SHORTEST_LENGTH_GT: Int
              character_SHORTEST_LENGTH_GTE: Int
              character_SHORTEST_LENGTH_LT: Int
              character_SHORTEST_LENGTH_LTE: Int
              character_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              character_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              screenTime_AVERAGE_EQUAL: Float
              screenTime_AVERAGE_GT: Float
              screenTime_AVERAGE_GTE: Float
              screenTime_AVERAGE_LT: Float
              screenTime_AVERAGE_LTE: Float
              screenTime_EQUAL: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              screenTime_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
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
              character: String
              screenTime: Int
              screenTime_DECREMENT: Int
              screenTime_INCREMENT: Int
            }

            input ActorActedInPropsWhere {
              AND: [ActorActedInPropsWhere!]
              NOT: ActorActedInPropsWhere
              OR: [ActorActedInPropsWhere!]
              character: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              character_CONTAINS: String
              character_ENDS_WITH: String
              character_EQ: String
              character_IN: [String!]
              character_STARTS_WITH: String
              screenTime: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
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

            input ActorConnectInput {
              actedIn: [ActorActedInConnectFieldInput!]
            }

            input ActorCreateInput {
              actedIn: ActorActedInFieldInput
              city: String
              name: String!
            }

            input ActorDeleteInput {
              actedIn: [ActorActedInDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              actedIn: [ActorActedInDisconnectFieldInput!]
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

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            input ActorRelationInput {
              actedIn: [ActorActedInCreateFieldInput!]
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
              city: String
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: MovieWhere @deprecated(reason: \\"Use \`actedIn_SOME\` instead.\\")
              actedInAggregate: ActorActedInAggregateInput
              actedInConnection: ActorActedInConnectionWhere @deprecated(reason: \\"Use \`actedInConnection_SOME\` instead.\\")
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
              city: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              city_CONTAINS: String
              city_ENDS_WITH: String
              city_EQ: String
              city_IN: [String]
              city_STARTS_WITH: String
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelection {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
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

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              rating: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              rating: Float
              rating_ADD: Float
              rating_DIVIDE: Float
              rating_MULTIPLY: Float
              rating_SUBTRACT: Float
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              rating: Float @deprecated(reason: \\"Please use the explicit _EQ version\\")
              rating_EQ: Float
              rating_GT: Float
              rating_GTE: Float
              rating_IN: [Float]
              rating_LT: Float
              rating_LTE: Float
              title: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
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
              updateActors(connect: ActorConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: ActorRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: ActorDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: ActorDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
              actors(limit: Int, offset: Int, options: ActorOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships created and deleted during an update mutation
            \\"\\"\\"
            type UpdateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
