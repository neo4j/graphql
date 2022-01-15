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

describe("Alias", () => {
    test("Custom Directive Simple", () => {
        const typeDefs = gql`
            type Actor {
                name: String!
                city: String @alias(property: "cityPropInDb")
                actedIn: [Movie] @relationship(direction: OUT, type: "ACTED_IN", properties: "ActorActedInProps")
            }

            type Movie {
                title: String!
                rating: Float @alias(property: "ratingPropInDb")
            }

            interface ActorActedInProps {
                character: String! @alias(property: "characterPropInDb")
                screenTime: Int
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Actor {
              actedIn(options: MovieOptions, where: MovieWhere): [Movie]
              actedInAggregate(where: MovieWhere): ActorMovieActedInAggregationSelection
              actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
              city: String
              name: String!
            }

            input ActorActedInAggregateInput {
              AND: [ActorActedInAggregateInput!]
              OR: [ActorActedInAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              edge: ActorActedInEdgeAggregationWhereInput
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
              OR: [ActorActedInConnectionWhere!]
              edge: ActorActedInPropsWhere
              edge_NOT: ActorActedInPropsWhere
              node: MovieWhere
              node_NOT: MovieWhere
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

            input ActorActedInEdgeAggregationWhereInput {
              AND: [ActorActedInEdgeAggregationWhereInput!]
              OR: [ActorActedInEdgeAggregationWhereInput!]
              character_AVERAGE_EQUAL: Float
              character_AVERAGE_GT: Float
              character_AVERAGE_GTE: Float
              character_AVERAGE_LT: Float
              character_AVERAGE_LTE: Float
              character_EQUAL: String
              character_GT: Int
              character_GTE: Int
              character_LONGEST_EQUAL: Int
              character_LONGEST_GT: Int
              character_LONGEST_GTE: Int
              character_LONGEST_LT: Int
              character_LONGEST_LTE: Int
              character_LT: Int
              character_LTE: Int
              character_SHORTEST_EQUAL: Int
              character_SHORTEST_GT: Int
              character_SHORTEST_GTE: Int
              character_SHORTEST_LT: Int
              character_SHORTEST_LTE: Int
              screenTime_AVERAGE_EQUAL: Float
              screenTime_AVERAGE_GT: Float
              screenTime_AVERAGE_GTE: Float
              screenTime_AVERAGE_LT: Float
              screenTime_AVERAGE_LTE: Float
              screenTime_EQUAL: Int
              screenTime_GT: Int
              screenTime_GTE: Int
              screenTime_LT: Int
              screenTime_LTE: Int
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

            input ActorActedInFieldInput {
              connect: [ActorActedInConnectFieldInput!]
              create: [ActorActedInCreateFieldInput!]
            }

            input ActorActedInNodeAggregationWhereInput {
              AND: [ActorActedInNodeAggregationWhereInput!]
              OR: [ActorActedInNodeAggregationWhereInput!]
              rating_AVERAGE_EQUAL: Float
              rating_AVERAGE_GT: Float
              rating_AVERAGE_GTE: Float
              rating_AVERAGE_LT: Float
              rating_AVERAGE_LTE: Float
              rating_EQUAL: Float
              rating_GT: Float
              rating_GTE: Float
              rating_LT: Float
              rating_LTE: Float
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
              title_AVERAGE_EQUAL: Float
              title_AVERAGE_GT: Float
              title_AVERAGE_GTE: Float
              title_AVERAGE_LT: Float
              title_AVERAGE_LTE: Float
              title_EQUAL: String
              title_GT: Int
              title_GTE: Int
              title_LONGEST_EQUAL: Int
              title_LONGEST_GT: Int
              title_LONGEST_GTE: Int
              title_LONGEST_LT: Int
              title_LONGEST_LTE: Int
              title_LT: Int
              title_LTE: Int
              title_SHORTEST_EQUAL: Int
              title_SHORTEST_GT: Int
              title_SHORTEST_GTE: Int
              title_SHORTEST_LT: Int
              title_SHORTEST_LTE: Int
            }

            interface ActorActedInProps {
              character: String!
              screenTime: Int
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
            }

            input ActorActedInPropsWhere {
              AND: [ActorActedInPropsWhere!]
              OR: [ActorActedInPropsWhere!]
              character: String
              character_CONTAINS: String
              character_ENDS_WITH: String
              character_IN: [String]
              character_NOT: String
              character_NOT_CONTAINS: String
              character_NOT_ENDS_WITH: String
              character_NOT_IN: [String]
              character_NOT_STARTS_WITH: String
              character_STARTS_WITH: String
              screenTime: Int
              screenTime_GT: Int
              screenTime_GTE: Int
              screenTime_IN: [Int]
              screenTime_LT: Int
              screenTime_LTE: Int
              screenTime_NOT: Int
              screenTime_NOT_IN: [Int]
            }

            type ActorActedInRelationship implements ActorActedInProps {
              character: String!
              cursor: String!
              node: Movie!
              screenTime: Int
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
              city: StringAggregateSelectionNullable!
              count: Int!
              name: StringAggregateSelectionNonNullable!
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

            type ActorMovieActedInAggregationSelection {
              count: Int!
              edge: ActorMovieActedInEdgeAggregateSelection
              node: ActorMovieActedInNodeAggregateSelection
            }

            type ActorMovieActedInEdgeAggregateSelection {
              character: StringAggregateSelectionNonNullable!
              screenTime: IntAggregateSelectionNullable!
            }

            type ActorMovieActedInNodeAggregateSelection {
              rating: FloatAggregateSelectionNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [ActorSort]
            }

            input ActorRelationInput {
              actedIn: [ActorActedInCreateFieldInput!]
            }

            \\"\\"\\"Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.\\"\\"\\"
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
              OR: [ActorWhere!]
              actedIn: MovieWhere
              actedInAggregate: ActorActedInAggregateInput
              actedInConnection: ActorActedInConnectionWhere
              actedInConnection_EVERY: ActorActedInConnectionWhere
              actedInConnection_NONE: ActorActedInConnectionWhere
              actedInConnection_NOT: ActorActedInConnectionWhere
              actedInConnection_SINGLE: ActorActedInConnectionWhere
              actedInConnection_SOME: ActorActedInConnectionWhere
              actedIn_EVERY: MovieWhere
              actedIn_NONE: MovieWhere
              actedIn_NOT: MovieWhere
              actedIn_SINGLE: MovieWhere
              actedIn_SOME: MovieWhere
              city: String
              city_CONTAINS: String
              city_ENDS_WITH: String
              city_IN: [String]
              city_NOT: String
              city_NOT_CONTAINS: String
              city_NOT_ENDS_WITH: String
              city_NOT_IN: [String]
              city_NOT_STARTS_WITH: String
              city_STARTS_WITH: String
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String]
              name_NOT: String
              name_NOT_CONTAINS: String
              name_NOT_ENDS_WITH: String
              name_NOT_IN: [String]
              name_NOT_STARTS_WITH: String
              name_STARTS_WITH: String
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
              info: CreateInfo!
            }

            type CreateInfo {
              bookmark: String
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type FloatAggregateSelectionNullable {
              average: Float
              max: Float
              min: Float
              sum: Float
            }

            type IntAggregateSelectionNullable {
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
              rating: FloatAggregateSelectionNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              rating: Float
              title: String!
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [MovieSort]
            }

            \\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
            input MovieSort {
              rating: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              rating: Float
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              rating: Float
              rating_GT: Float
              rating_GTE: Float
              rating_IN: [Float]
              rating_LT: Float
              rating_LTE: Float
              rating_NOT: Float
              rating_NOT_IN: [Float]
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String]
              title_NOT: String
              title_NOT_CONTAINS: String
              title_NOT_ENDS_WITH: String
              title_NOT_IN: [String]
              title_NOT_STARTS_WITH: String
              title_STARTS_WITH: String
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
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

            type StringAggregateSelectionNullable {
              longest: String
              shortest: String
            }

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
            }

            type UpdateInfo {
              bookmark: String
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdateMoviesMutationResponse {
              info: UpdateInfo!
              movies: [Movie!]!
            }
            "
        `);
    });
});
