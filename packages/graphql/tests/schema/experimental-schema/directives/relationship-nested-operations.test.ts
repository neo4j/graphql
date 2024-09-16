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
import type { GraphQLNamedInputType } from "graphql";
import { gql } from "graphql-tag";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../../../src";

describe("Relationship nested operations", () => {
    describe("Related to a concrete type", () => {
        test("Should not generate UpdateFieldInput input with no nested operations", async () => {
            const typeDefs = gql`
                type Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const updateFieldInput = schema.getType("MovieActorsUpdateFieldInput") as GraphQLNamedInputType;
            expect(updateFieldInput).toBeUndefined();

            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
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

                type CreatePeopleMutationResponse {
                  info: CreateInfo!
                  people: [Person!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePeople(where: PersonWhere): DeleteInfo!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort!]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                input PersonUpdateInput {
                  name: String
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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
                }

                type UpdatePeopleMutationResponse {
                  info: UpdateInfo!
                  people: [Person!]!
                }"
            `);
        });

        test("Single relationship with nested operation CREATE specified", async () => {
            const typeDefs = gql`
                type Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePeopleMutationResponse {
                  info: CreateInfo!
                  people: [Person!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsCreateFieldInput {
                  node: PersonCreateInput!
                }

                input MovieActorsFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                input MovieRelationInput {
                  actors: [MovieActorsCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePeople(where: PersonWhere): DeleteInfo!
                  updateMovies(create: MovieRelationInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort!]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                input PersonUpdateInput {
                  name: String
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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
                }

                type UpdatePeopleMutationResponse {
                  info: UpdateInfo!
                  people: [Person!]!
                }"
            `);
        });

        test("Single relationship with nested operation CONNECT specified", async () => {
            const typeDefs = gql`
                type Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePeopleMutationResponse {
                  info: CreateInfo!
                  people: [Person!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                input MovieActorsConnectFieldInput {
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: PersonConnectWhere
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieConnectInput {
                  actors: [MovieActorsConnectFieldInput!]
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePeople(where: PersonWhere): DeleteInfo!
                  updateMovies(connect: MovieConnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonConnectWhere {
                  node: PersonWhere!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort!]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                input PersonUpdateInput {
                  name: String
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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
                }

                type UpdatePeopleMutationResponse {
                  info: UpdateInfo!
                  people: [Person!]!
                }"
            `);
        });

        test("Single relationship with nested operation UPDATE specified", async () => {
            const typeDefs = gql`
                type Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [UPDATE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePeopleMutationResponse {
                  info: CreateInfo!
                  people: [Person!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateConnectionInput {
                  node: PersonUpdateInput
                }

                input MovieActorsUpdateFieldInput {
                  update: MovieActorsUpdateConnectionInput
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePeople(where: PersonWhere): DeleteInfo!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort!]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                input PersonUpdateInput {
                  name: String
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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
                }

                type UpdatePeopleMutationResponse {
                  info: UpdateInfo!
                  people: [Person!]!
                }"
            `);
        });

        test("Single relationship with nested operation DELETE specified", async () => {
            const typeDefs = gql`
                type Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DELETE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePeopleMutationResponse {
                  info: CreateInfo!
                  people: [Person!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsDeleteFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  delete: [MovieActorsDeleteFieldInput!]
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
                }

                input MovieDeleteInput {
                  actors: [MovieActorsDeleteFieldInput!]
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deletePeople(where: PersonWhere): DeleteInfo!
                  updateMovies(delete: MovieDeleteInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort!]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                input PersonUpdateInput {
                  name: String
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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
                }

                type UpdatePeopleMutationResponse {
                  info: UpdateInfo!
                  people: [Person!]!
                }"
            `);
        });

        test("Single relationship with nested operation DISCONNECT specified", async () => {
            const typeDefs = gql`
                type Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DISCONNECT])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePeopleMutationResponse {
                  info: CreateInfo!
                  people: [Person!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsDisconnectFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  disconnect: [MovieActorsDisconnectFieldInput!]
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
                }

                input MovieDisconnectInput {
                  actors: [MovieActorsDisconnectFieldInput!]
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePeople(where: PersonWhere): DeleteInfo!
                  updateMovies(disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort!]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                input PersonUpdateInput {
                  name: String
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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
                }

                type UpdatePeopleMutationResponse {
                  info: UpdateInfo!
                  people: [Person!]!
                }"
            `);
        });

        test("Should not generate any nested operations if only CONNECT_OR_CREATE is specified and the related type does not have a unique field", async () => {
            const typeDefs = gql`
                type Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT_OR_CREATE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePeopleMutationResponse {
                  info: CreateInfo!
                  people: [Person!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePeople(where: PersonWhere): DeleteInfo!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort!]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                input PersonUpdateInput {
                  name: String
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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
                }

                type UpdatePeopleMutationResponse {
                  info: UpdateInfo!
                  people: [Person!]!
                }"
            `);
        });

        test("Single relationship to type with unique field with nested operation CONNECT_OR_CREATE specified", async () => {
            const typeDefs = gql`
                type Person {
                    id: ID! @id @unique
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT_OR_CREATE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePeopleMutationResponse {
                  info: CreateInfo!
                  people: [Person!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                input MovieActorsConnectOrCreateFieldInput {
                  onCreate: MovieActorsConnectOrCreateFieldInputOnCreate!
                  where: PersonConnectOrCreateWhere!
                }

                input MovieActorsConnectOrCreateFieldInputOnCreate {
                  node: PersonOnCreateInput!
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsFieldInput {
                  connectOrCreate: [MovieActorsConnectOrCreateFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  connectOrCreate: [MovieActorsConnectOrCreateFieldInput!]
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieConnectOrCreateInput {
                  actors: [MovieActorsConnectOrCreateFieldInput!]
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  id: IDAggregateSelection!
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePeople(where: PersonWhere): DeleteInfo!
                  updateMovies(connectOrCreate: MovieConnectOrCreateInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  id: ID!
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                  name: StringAggregateSelection!
                }

                input PersonConnectOrCreateWhere {
                  node: PersonUniqueWhere!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                input PersonOnCreateInput {
                  name: String
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort!]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  id: SortDirection
                  name: SortDirection
                }

                input PersonUniqueWhere {
                  id: ID
                }

                input PersonUpdateInput {
                  name: String
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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
                }

                type UpdatePeopleMutationResponse {
                  info: UpdateInfo!
                  people: [Person!]!
                }"
            `);
        });

        test("Two relationships with nested operations specified on one", async () => {
            const typeDefs = gql`
                type Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                    producers: [Person!]! @relationship(type: "PRODUCED", direction: IN, nestedOperations: [DISCONNECT])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePeopleMutationResponse {
                  info: CreateInfo!
                  people: [Person!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                  producers(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  producersAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonProducersAggregationSelection
                  producersConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieProducersConnectionSort!], where: MovieProducersConnectionWhere): MovieProducersConnection!
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                input MovieActorsConnectFieldInput {
                  \\"\\"\\"
                  Whether or not to overwrite any matching relationship with the new properties.
                  \\"\\"\\"
                  overwrite: Boolean! = true
                  where: PersonConnectWhere
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsCreateFieldInput {
                  node: PersonCreateInput!
                }

                input MovieActorsDeleteFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsDisconnectFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                  create: [MovieActorsCreateFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateConnectionInput {
                  node: PersonUpdateInput
                }

                input MovieActorsUpdateFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                  create: [MovieActorsCreateFieldInput!]
                  delete: [MovieActorsDeleteFieldInput!]
                  disconnect: [MovieActorsDisconnectFieldInput!]
                  update: MovieActorsUpdateConnectionInput
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieConnectInput {
                  actors: [MovieActorsConnectFieldInput!]
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
                }

                input MovieDeleteInput {
                  actors: [MovieActorsDeleteFieldInput!]
                }

                input MovieDisconnectInput {
                  actors: [MovieActorsDisconnectFieldInput!]
                  producers: [MovieProducersDisconnectFieldInput!]
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                type MoviePersonProducersAggregationSelection {
                  count: Int!
                  node: MoviePersonProducersNodeAggregateSelection
                }

                type MoviePersonProducersNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                input MovieProducersAggregateInput {
                  AND: [MovieProducersAggregateInput!]
                  NOT: MovieProducersAggregateInput
                  OR: [MovieProducersAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieProducersNodeAggregationWhereInput
                }

                type MovieProducersConnection {
                  edges: [MovieProducersRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieProducersConnectionSort {
                  node: PersonSort
                }

                input MovieProducersConnectionWhere {
                  AND: [MovieProducersConnectionWhere!]
                  NOT: MovieProducersConnectionWhere
                  OR: [MovieProducersConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieProducersDisconnectFieldInput {
                  where: MovieProducersConnectionWhere
                }

                input MovieProducersNodeAggregationWhereInput {
                  AND: [MovieProducersNodeAggregationWhereInput!]
                  NOT: MovieProducersNodeAggregationWhereInput
                  OR: [MovieProducersNodeAggregationWhereInput!]
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
                }

                type MovieProducersRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieProducersUpdateFieldInput {
                  disconnect: [MovieProducersDisconnectFieldInput!]
                  where: MovieProducersConnectionWhere
                }

                input MovieRelationInput {
                  actors: [MovieActorsCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                  producers: [MovieProducersUpdateFieldInput!]
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                  producers: PersonWhere @deprecated(reason: \\"Use \`producers_SOME\` instead.\\")
                  producersAggregate: MovieProducersAggregateInput
                  producersConnection: MovieProducersConnectionWhere @deprecated(reason: \\"Use \`producersConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_ALL: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_NONE: MovieProducersConnectionWhere
                  producersConnection_NOT: MovieProducersConnectionWhere @deprecated(reason: \\"Use \`producersConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SINGLE: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SOME: MovieProducersConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  producers_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  producers_NONE: PersonWhere
                  producers_NOT: PersonWhere @deprecated(reason: \\"Use \`producers_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  producers_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  producers_SOME: PersonWhere
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deletePeople(where: PersonWhere): DeleteInfo!
                  updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonConnectWhere {
                  node: PersonWhere!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort!]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                input PersonUpdateInput {
                  name: String
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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
                }

                type UpdatePeopleMutationResponse {
                  info: UpdateInfo!
                  people: [Person!]!
                }"
            `);
        });

        test("Two relationships with nested operations specified on both", async () => {
            const typeDefs = gql`
                type Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
                    producers: [Person!]! @relationship(type: "PRODUCED", direction: IN, nestedOperations: [DISCONNECT])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePeopleMutationResponse {
                  info: CreateInfo!
                  people: [Person!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                  producers(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  producersAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonProducersAggregationSelection
                  producersConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieProducersConnectionSort!], where: MovieProducersConnectionWhere): MovieProducersConnection!
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsCreateFieldInput {
                  node: PersonCreateInput!
                }

                input MovieActorsFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
                }

                input MovieDisconnectInput {
                  producers: [MovieProducersDisconnectFieldInput!]
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                type MoviePersonProducersAggregationSelection {
                  count: Int!
                  node: MoviePersonProducersNodeAggregateSelection
                }

                type MoviePersonProducersNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                input MovieProducersAggregateInput {
                  AND: [MovieProducersAggregateInput!]
                  NOT: MovieProducersAggregateInput
                  OR: [MovieProducersAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieProducersNodeAggregationWhereInput
                }

                type MovieProducersConnection {
                  edges: [MovieProducersRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieProducersConnectionSort {
                  node: PersonSort
                }

                input MovieProducersConnectionWhere {
                  AND: [MovieProducersConnectionWhere!]
                  NOT: MovieProducersConnectionWhere
                  OR: [MovieProducersConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieProducersDisconnectFieldInput {
                  where: MovieProducersConnectionWhere
                }

                input MovieProducersNodeAggregationWhereInput {
                  AND: [MovieProducersNodeAggregationWhereInput!]
                  NOT: MovieProducersNodeAggregationWhereInput
                  OR: [MovieProducersNodeAggregationWhereInput!]
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
                }

                type MovieProducersRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieProducersUpdateFieldInput {
                  disconnect: [MovieProducersDisconnectFieldInput!]
                  where: MovieProducersConnectionWhere
                }

                input MovieRelationInput {
                  actors: [MovieActorsCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                  producers: [MovieProducersUpdateFieldInput!]
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                  producers: PersonWhere @deprecated(reason: \\"Use \`producers_SOME\` instead.\\")
                  producersAggregate: MovieProducersAggregateInput
                  producersConnection: MovieProducersConnectionWhere @deprecated(reason: \\"Use \`producersConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_ALL: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_NONE: MovieProducersConnectionWhere
                  producersConnection_NOT: MovieProducersConnectionWhere @deprecated(reason: \\"Use \`producersConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SINGLE: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SOME: MovieProducersConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  producers_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  producers_NONE: PersonWhere
                  producers_NOT: PersonWhere @deprecated(reason: \\"Use \`producers_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  producers_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  producers_SOME: PersonWhere
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePeople(where: PersonWhere): DeleteInfo!
                  updateMovies(create: MovieRelationInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort!]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                input PersonUpdateInput {
                  name: String
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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
                }

                type UpdatePeopleMutationResponse {
                  info: UpdateInfo!
                  people: [Person!]!
                }"
            `);
        });
    });

    describe("Related to a union type", () => {
        test("Should not generate UpdateFieldInput input with no nested operations", async () => {
            const typeDefs = gql`
                type PersonOne {
                    name: String
                }

                type PersonTwo {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const updateFieldInput = schema.getType("MovieActorsUpdateFieldInput") as GraphQLNamedInputType;
            expect(updateFieldInput).toBeUndefined();

            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
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

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionWhere {
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                  node_NOT: PersonOneWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                  node_NOT: PersonTwoWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
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
                  id: SortDirection
                }

                input MovieUpdateInput {
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Person = PersonOne | PersonTwo

                type PersonOne {
                  name: String
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: String
                  nameTwo_CONTAINS: String
                  nameTwo_ENDS_WITH: String
                  nameTwo_IN: [String]
                  nameTwo_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_STARTS_WITH: String
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: QueryOptions, where: PersonWhere): [Person!]!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Single relationship with nested operation CREATE specified", async () => {
            const typeDefs = gql`
                type PersonOne {
                    name: String
                }

                type PersonTwo {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionWhere {
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsCreateFieldInput {
                  PersonOne: [MovieActorsPersonOneCreateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoCreateFieldInput!]
                }

                input MovieActorsCreateInput {
                  PersonOne: MovieActorsPersonOneFieldInput
                  PersonTwo: MovieActorsPersonTwoFieldInput
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                  node_NOT: PersonOneWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonOneCreateFieldInput {
                  node: PersonOneCreateInput!
                }

                input MovieActorsPersonOneFieldInput {
                  create: [MovieActorsPersonOneCreateFieldInput!]
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  create: [MovieActorsPersonOneCreateFieldInput!]
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                  node_NOT: PersonTwoWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonTwoCreateFieldInput {
                  node: PersonTwoCreateInput!
                }

                input MovieActorsPersonTwoFieldInput {
                  create: [MovieActorsPersonTwoCreateFieldInput!]
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  create: [MovieActorsPersonTwoCreateFieldInput!]
                  where: MovieActorsPersonTwoConnectionWhere
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  actors: MovieActorsCreateInput
                  id: ID
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

                input MovieRelationInput {
                  actors: MovieActorsCreateFieldInput
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(create: MovieRelationInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Person = PersonOne | PersonTwo

                type PersonOne {
                  name: String
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: String
                  nameTwo_CONTAINS: String
                  nameTwo_ENDS_WITH: String
                  nameTwo_IN: [String]
                  nameTwo_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_STARTS_WITH: String
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: QueryOptions, where: PersonWhere): [Person!]!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Single relationship with nested operation CONNECT specified", async () => {
            const typeDefs = gql`
                type PersonOne {
                    name: String
                }

                type PersonTwo {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsConnectInput {
                  PersonOne: [MovieActorsPersonOneConnectFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoConnectFieldInput!]
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionWhere {
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsCreateInput {
                  PersonOne: MovieActorsPersonOneFieldInput
                  PersonTwo: MovieActorsPersonTwoFieldInput
                }

                input MovieActorsPersonOneConnectFieldInput {
                  where: PersonOneConnectWhere
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                  node_NOT: PersonOneWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonOneFieldInput {
                  connect: [MovieActorsPersonOneConnectFieldInput!]
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  connect: [MovieActorsPersonOneConnectFieldInput!]
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonTwoConnectFieldInput {
                  where: PersonTwoConnectWhere
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                  node_NOT: PersonTwoWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonTwoFieldInput {
                  connect: [MovieActorsPersonTwoConnectFieldInput!]
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  connect: [MovieActorsPersonTwoConnectFieldInput!]
                  where: MovieActorsPersonTwoConnectionWhere
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieConnectInput {
                  actors: MovieActorsConnectInput
                }

                input MovieCreateInput {
                  actors: MovieActorsCreateInput
                  id: ID
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
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(connect: MovieConnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Person = PersonOne | PersonTwo

                type PersonOne {
                  name: String
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneConnectWhere {
                  node: PersonOneWhere!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoConnectWhere {
                  node: PersonTwoWhere!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: String
                  nameTwo_CONTAINS: String
                  nameTwo_ENDS_WITH: String
                  nameTwo_IN: [String]
                  nameTwo_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_STARTS_WITH: String
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: QueryOptions, where: PersonWhere): [Person!]!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Single relationship with nested operation UPDATE specified", async () => {
            const typeDefs = gql`
                type PersonOne {
                    name: String
                }

                type PersonTwo {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [UPDATE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionWhere {
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                  node_NOT: PersonOneWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonOneUpdateConnectionInput {
                  node: PersonOneUpdateInput
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  update: MovieActorsPersonOneUpdateConnectionInput
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                  node_NOT: PersonTwoWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonTwoUpdateConnectionInput {
                  node: PersonTwoUpdateInput
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  update: MovieActorsPersonTwoUpdateConnectionInput
                  where: MovieActorsPersonTwoConnectionWhere
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
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
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Person = PersonOne | PersonTwo

                type PersonOne {
                  name: String
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: String
                  nameTwo_CONTAINS: String
                  nameTwo_ENDS_WITH: String
                  nameTwo_IN: [String]
                  nameTwo_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_STARTS_WITH: String
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: QueryOptions, where: PersonWhere): [Person!]!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Single relationship with nested operation DELETE specified", async () => {
            const typeDefs = gql`
                type PersonOne {
                    name: String
                }

                type PersonTwo {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DELETE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionWhere {
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsDeleteInput {
                  PersonOne: [MovieActorsPersonOneDeleteFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoDeleteFieldInput!]
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                  node_NOT: PersonOneWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonOneDeleteFieldInput {
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  delete: [MovieActorsPersonOneDeleteFieldInput!]
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                  node_NOT: PersonTwoWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonTwoDeleteFieldInput {
                  where: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  delete: [MovieActorsPersonTwoDeleteFieldInput!]
                  where: MovieActorsPersonTwoConnectionWhere
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
                }

                input MovieDeleteInput {
                  actors: MovieActorsDeleteInput
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
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(delete: MovieDeleteInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Person = PersonOne | PersonTwo

                type PersonOne {
                  name: String
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: String
                  nameTwo_CONTAINS: String
                  nameTwo_ENDS_WITH: String
                  nameTwo_IN: [String]
                  nameTwo_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_STARTS_WITH: String
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: QueryOptions, where: PersonWhere): [Person!]!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Single relationship with nested operation DISCONNECT specified", async () => {
            const typeDefs = gql`
                type PersonOne {
                    name: String
                }

                type PersonTwo {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DISCONNECT])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionWhere {
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsDisconnectInput {
                  PersonOne: [MovieActorsPersonOneDisconnectFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoDisconnectFieldInput!]
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                  node_NOT: PersonOneWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonOneDisconnectFieldInput {
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  disconnect: [MovieActorsPersonOneDisconnectFieldInput!]
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                  node_NOT: PersonTwoWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonTwoDisconnectFieldInput {
                  where: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  disconnect: [MovieActorsPersonTwoDisconnectFieldInput!]
                  where: MovieActorsPersonTwoConnectionWhere
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
                }

                input MovieDisconnectInput {
                  actors: MovieActorsDisconnectInput
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
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Person = PersonOne | PersonTwo

                type PersonOne {
                  name: String
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: String
                  nameTwo_CONTAINS: String
                  nameTwo_ENDS_WITH: String
                  nameTwo_IN: [String]
                  nameTwo_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_STARTS_WITH: String
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: QueryOptions, where: PersonWhere): [Person!]!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Should not generate any nested operations if only CONNECT_OR_CREATE is specified and the related type does not have a unique field", async () => {
            const typeDefs = gql`
                type PersonOne {
                    name: String
                }

                type PersonTwo {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie {
                    id: ID
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT_OR_CREATE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionWhere {
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                  node_NOT: PersonOneWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                  node_NOT: PersonTwoWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
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
                  id: SortDirection
                }

                input MovieUpdateInput {
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Person = PersonOne | PersonTwo

                type PersonOne {
                  name: String
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: String
                  nameTwo_CONTAINS: String
                  nameTwo_ENDS_WITH: String
                  nameTwo_IN: [String]
                  nameTwo_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_STARTS_WITH: String
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: QueryOptions, where: PersonWhere): [Person!]!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Single relationship to type with unique field with nested operation CONNECT_OR_CREATE specified", async () => {
            const typeDefs = gql`
                type PersonOne {
                    id: ID! @id @unique
                    name: String
                }

                type PersonTwo {
                    id: ID! @id @unique
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie {
                    id: ID
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT_OR_CREATE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsConnectOrCreateInput {
                  PersonOne: [MovieActorsPersonOneConnectOrCreateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoConnectOrCreateFieldInput!]
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionWhere {
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsCreateInput {
                  PersonOne: MovieActorsPersonOneFieldInput
                  PersonTwo: MovieActorsPersonTwoFieldInput
                }

                input MovieActorsPersonOneConnectOrCreateFieldInput {
                  onCreate: MovieActorsPersonOneConnectOrCreateFieldInputOnCreate!
                  where: PersonOneConnectOrCreateWhere!
                }

                input MovieActorsPersonOneConnectOrCreateFieldInputOnCreate {
                  node: PersonOneOnCreateInput!
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                  node_NOT: PersonOneWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonOneFieldInput {
                  connectOrCreate: [MovieActorsPersonOneConnectOrCreateFieldInput!]
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  connectOrCreate: [MovieActorsPersonOneConnectOrCreateFieldInput!]
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonTwoConnectOrCreateFieldInput {
                  onCreate: MovieActorsPersonTwoConnectOrCreateFieldInputOnCreate!
                  where: PersonTwoConnectOrCreateWhere!
                }

                input MovieActorsPersonTwoConnectOrCreateFieldInputOnCreate {
                  node: PersonTwoOnCreateInput!
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                  node_NOT: PersonTwoWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonTwoFieldInput {
                  connectOrCreate: [MovieActorsPersonTwoConnectOrCreateFieldInput!]
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  connectOrCreate: [MovieActorsPersonTwoConnectOrCreateFieldInput!]
                  where: MovieActorsPersonTwoConnectionWhere
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieConnectOrCreateInput {
                  actors: MovieActorsConnectOrCreateInput
                }

                input MovieCreateInput {
                  actors: MovieActorsCreateInput
                  id: ID
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
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(connectOrCreate: MovieConnectOrCreateInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Person = PersonOne | PersonTwo

                type PersonOne {
                  id: ID!
                  name: String
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                  name: StringAggregateSelection!
                }

                input PersonOneConnectOrCreateWhere {
                  node: PersonOneUniqueWhere!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOnCreateInput {
                  name: String
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  id: SortDirection
                  name: SortDirection
                }

                input PersonOneUniqueWhere {
                  id: ID
                }

                input PersonOneUpdateInput {
                  name: String
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type PersonTwo {
                  id: ID!
                  nameTwo: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoConnectOrCreateWhere {
                  node: PersonTwoUniqueWhere!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOnCreateInput {
                  nameTwo: String
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  id: SortDirection
                  nameTwo: SortDirection
                }

                input PersonTwoUniqueWhere {
                  id: ID
                }

                input PersonTwoUpdateInput {
                  nameTwo: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
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
                  nameTwo: String
                  nameTwo_CONTAINS: String
                  nameTwo_ENDS_WITH: String
                  nameTwo_IN: [String]
                  nameTwo_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_STARTS_WITH: String
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: QueryOptions, where: PersonWhere): [Person!]!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Two relationships with nested operations specified on one", async () => {
            const typeDefs = gql`
                type PersonOne {
                    name: String
                }

                type PersonTwo {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                    producers: [Person!]! @relationship(type: "PRODUCED", direction: IN, nestedOperations: [DISCONNECT])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                  producers(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                  producersConnection(after: String, directed: Boolean = true, first: Int, where: MovieProducersConnectionWhere): MovieProducersConnection!
                }

                input MovieActorsConnectInput {
                  PersonOne: [MovieActorsPersonOneConnectFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoConnectFieldInput!]
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionWhere {
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsCreateFieldInput {
                  PersonOne: [MovieActorsPersonOneCreateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoCreateFieldInput!]
                }

                input MovieActorsCreateInput {
                  PersonOne: MovieActorsPersonOneFieldInput
                  PersonTwo: MovieActorsPersonTwoFieldInput
                }

                input MovieActorsDeleteInput {
                  PersonOne: [MovieActorsPersonOneDeleteFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoDeleteFieldInput!]
                }

                input MovieActorsDisconnectInput {
                  PersonOne: [MovieActorsPersonOneDisconnectFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoDisconnectFieldInput!]
                }

                input MovieActorsPersonOneConnectFieldInput {
                  where: PersonOneConnectWhere
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                  node_NOT: PersonOneWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonOneCreateFieldInput {
                  node: PersonOneCreateInput!
                }

                input MovieActorsPersonOneDeleteFieldInput {
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonOneDisconnectFieldInput {
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonOneFieldInput {
                  connect: [MovieActorsPersonOneConnectFieldInput!]
                  create: [MovieActorsPersonOneCreateFieldInput!]
                }

                input MovieActorsPersonOneUpdateConnectionInput {
                  node: PersonOneUpdateInput
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  connect: [MovieActorsPersonOneConnectFieldInput!]
                  create: [MovieActorsPersonOneCreateFieldInput!]
                  delete: [MovieActorsPersonOneDeleteFieldInput!]
                  disconnect: [MovieActorsPersonOneDisconnectFieldInput!]
                  update: MovieActorsPersonOneUpdateConnectionInput
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonTwoConnectFieldInput {
                  where: PersonTwoConnectWhere
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                  node_NOT: PersonTwoWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonTwoCreateFieldInput {
                  node: PersonTwoCreateInput!
                }

                input MovieActorsPersonTwoDeleteFieldInput {
                  where: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonTwoDisconnectFieldInput {
                  where: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonTwoFieldInput {
                  connect: [MovieActorsPersonTwoConnectFieldInput!]
                  create: [MovieActorsPersonTwoCreateFieldInput!]
                }

                input MovieActorsPersonTwoUpdateConnectionInput {
                  node: PersonTwoUpdateInput
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  connect: [MovieActorsPersonTwoConnectFieldInput!]
                  create: [MovieActorsPersonTwoCreateFieldInput!]
                  delete: [MovieActorsPersonTwoDeleteFieldInput!]
                  disconnect: [MovieActorsPersonTwoDisconnectFieldInput!]
                  update: MovieActorsPersonTwoUpdateConnectionInput
                  where: MovieActorsPersonTwoConnectionWhere
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieConnectInput {
                  actors: MovieActorsConnectInput
                }

                input MovieCreateInput {
                  actors: MovieActorsCreateInput
                  id: ID
                }

                input MovieDeleteInput {
                  actors: MovieActorsDeleteInput
                }

                input MovieDisconnectInput {
                  actors: MovieActorsDisconnectInput
                  producers: MovieProducersDisconnectInput
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

                type MovieProducersConnection {
                  edges: [MovieProducersRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieProducersConnectionWhere {
                  PersonOne: MovieProducersPersonOneConnectionWhere
                  PersonTwo: MovieProducersPersonTwoConnectionWhere
                }

                input MovieProducersDisconnectInput {
                  PersonOne: [MovieProducersPersonOneDisconnectFieldInput!]
                  PersonTwo: [MovieProducersPersonTwoDisconnectFieldInput!]
                }

                input MovieProducersPersonOneConnectionWhere {
                  AND: [MovieProducersPersonOneConnectionWhere!]
                  NOT: MovieProducersPersonOneConnectionWhere
                  OR: [MovieProducersPersonOneConnectionWhere!]
                  node: PersonOneWhere
                  node_NOT: PersonOneWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieProducersPersonOneDisconnectFieldInput {
                  where: MovieProducersPersonOneConnectionWhere
                }

                input MovieProducersPersonOneUpdateFieldInput {
                  disconnect: [MovieProducersPersonOneDisconnectFieldInput!]
                  where: MovieProducersPersonOneConnectionWhere
                }

                input MovieProducersPersonTwoConnectionWhere {
                  AND: [MovieProducersPersonTwoConnectionWhere!]
                  NOT: MovieProducersPersonTwoConnectionWhere
                  OR: [MovieProducersPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                  node_NOT: PersonTwoWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieProducersPersonTwoDisconnectFieldInput {
                  where: MovieProducersPersonTwoConnectionWhere
                }

                input MovieProducersPersonTwoUpdateFieldInput {
                  disconnect: [MovieProducersPersonTwoDisconnectFieldInput!]
                  where: MovieProducersPersonTwoConnectionWhere
                }

                type MovieProducersRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieProducersUpdateInput {
                  PersonOne: [MovieProducersPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieProducersPersonTwoUpdateFieldInput!]
                }

                input MovieRelationInput {
                  actors: MovieActorsCreateFieldInput
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: ID
                  producers: MovieProducersUpdateInput
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                  producers: PersonWhere @deprecated(reason: \\"Use \`producers_SOME\` instead.\\")
                  producersConnection: MovieProducersConnectionWhere @deprecated(reason: \\"Use \`producersConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_ALL: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_NONE: MovieProducersConnectionWhere
                  producersConnection_NOT: MovieProducersConnectionWhere @deprecated(reason: \\"Use \`producersConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SINGLE: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SOME: MovieProducersConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  producers_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  producers_NONE: PersonWhere
                  producers_NOT: PersonWhere @deprecated(reason: \\"Use \`producers_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  producers_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  producers_SOME: PersonWhere
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Person = PersonOne | PersonTwo

                type PersonOne {
                  name: String
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneConnectWhere {
                  node: PersonOneWhere!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoConnectWhere {
                  node: PersonTwoWhere!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: String
                  nameTwo_CONTAINS: String
                  nameTwo_ENDS_WITH: String
                  nameTwo_IN: [String]
                  nameTwo_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_STARTS_WITH: String
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: QueryOptions, where: PersonWhere): [Person!]!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Two relationships with nested operations specified on both", async () => {
            const typeDefs = gql`
                type PersonOne {
                    name: String
                }

                type PersonTwo {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
                    producers: [Person!]! @relationship(type: "PRODUCED", direction: IN, nestedOperations: [DISCONNECT])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                  producers(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                  producersConnection(after: String, directed: Boolean = true, first: Int, where: MovieProducersConnectionWhere): MovieProducersConnection!
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionWhere {
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsCreateFieldInput {
                  PersonOne: [MovieActorsPersonOneCreateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoCreateFieldInput!]
                }

                input MovieActorsCreateInput {
                  PersonOne: MovieActorsPersonOneFieldInput
                  PersonTwo: MovieActorsPersonTwoFieldInput
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                  node_NOT: PersonOneWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonOneCreateFieldInput {
                  node: PersonOneCreateInput!
                }

                input MovieActorsPersonOneFieldInput {
                  create: [MovieActorsPersonOneCreateFieldInput!]
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  create: [MovieActorsPersonOneCreateFieldInput!]
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                  node_NOT: PersonTwoWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsPersonTwoCreateFieldInput {
                  node: PersonTwoCreateInput!
                }

                input MovieActorsPersonTwoFieldInput {
                  create: [MovieActorsPersonTwoCreateFieldInput!]
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  create: [MovieActorsPersonTwoCreateFieldInput!]
                  where: MovieActorsPersonTwoConnectionWhere
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  actors: MovieActorsCreateInput
                  id: ID
                }

                input MovieDisconnectInput {
                  producers: MovieProducersDisconnectInput
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

                type MovieProducersConnection {
                  edges: [MovieProducersRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieProducersConnectionWhere {
                  PersonOne: MovieProducersPersonOneConnectionWhere
                  PersonTwo: MovieProducersPersonTwoConnectionWhere
                }

                input MovieProducersDisconnectInput {
                  PersonOne: [MovieProducersPersonOneDisconnectFieldInput!]
                  PersonTwo: [MovieProducersPersonTwoDisconnectFieldInput!]
                }

                input MovieProducersPersonOneConnectionWhere {
                  AND: [MovieProducersPersonOneConnectionWhere!]
                  NOT: MovieProducersPersonOneConnectionWhere
                  OR: [MovieProducersPersonOneConnectionWhere!]
                  node: PersonOneWhere
                  node_NOT: PersonOneWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieProducersPersonOneDisconnectFieldInput {
                  where: MovieProducersPersonOneConnectionWhere
                }

                input MovieProducersPersonOneUpdateFieldInput {
                  disconnect: [MovieProducersPersonOneDisconnectFieldInput!]
                  where: MovieProducersPersonOneConnectionWhere
                }

                input MovieProducersPersonTwoConnectionWhere {
                  AND: [MovieProducersPersonTwoConnectionWhere!]
                  NOT: MovieProducersPersonTwoConnectionWhere
                  OR: [MovieProducersPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                  node_NOT: PersonTwoWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieProducersPersonTwoDisconnectFieldInput {
                  where: MovieProducersPersonTwoConnectionWhere
                }

                input MovieProducersPersonTwoUpdateFieldInput {
                  disconnect: [MovieProducersPersonTwoDisconnectFieldInput!]
                  where: MovieProducersPersonTwoConnectionWhere
                }

                type MovieProducersRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieProducersUpdateInput {
                  PersonOne: [MovieProducersPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieProducersPersonTwoUpdateFieldInput!]
                }

                input MovieRelationInput {
                  actors: MovieActorsCreateFieldInput
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: ID
                  producers: MovieProducersUpdateInput
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                  producers: PersonWhere @deprecated(reason: \\"Use \`producers_SOME\` instead.\\")
                  producersConnection: MovieProducersConnectionWhere @deprecated(reason: \\"Use \`producersConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_ALL: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_NONE: MovieProducersConnectionWhere
                  producersConnection_NOT: MovieProducersConnectionWhere @deprecated(reason: \\"Use \`producersConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SINGLE: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SOME: MovieProducersConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  producers_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  producers_NONE: PersonWhere
                  producers_NOT: PersonWhere @deprecated(reason: \\"Use \`producers_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  producers_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  producers_SOME: PersonWhere
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(create: MovieRelationInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Person = PersonOne | PersonTwo

                type PersonOne {
                  name: String
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: String
                  nameTwo_CONTAINS: String
                  nameTwo_ENDS_WITH: String
                  nameTwo_IN: [String]
                  nameTwo_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  nameTwo_STARTS_WITH: String
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: QueryOptions, where: PersonWhere): [Person!]!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
                }

                \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                input QueryOptions {
                  limit: Int
                  offset: Int
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });
    });

    describe("Related to an interface type", () => {
        test("Should not generate UpdateFieldInput input with no nested operations", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const updateFieldInput = schema.getType("MovieActorsUpdateFieldInput") as GraphQLNamedInputType;
            expect(updateFieldInput).toBeUndefined();

            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
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

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                  someExtraProp: [Int!]
                  someExtraProp_POP: Int
                  someExtraProp_PUSH: [Int!]
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                  someExtraProp: [Int!]
                  someExtraProp_INCLUDES: Int
                  someExtraProp_NOT: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  someExtraProp_NOT_INCLUDES: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
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
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                  typename_IN: [PersonImplementation!]
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Single relationship with nested operation CREATE specified", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsCreateFieldInput {
                  node: PersonCreateInput!
                }

                input MovieActorsFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                input MovieRelationInput {
                  actors: [MovieActorsCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(create: MovieRelationInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  PersonOne: PersonOneCreateInput
                  PersonTwo: PersonTwoCreateInput
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                  someExtraProp: [Int!]
                  someExtraProp_POP: Int
                  someExtraProp_PUSH: [Int!]
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                  someExtraProp: [Int!]
                  someExtraProp_INCLUDES: Int
                  someExtraProp_NOT: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  someExtraProp_NOT_INCLUDES: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
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
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                  typename_IN: [PersonImplementation!]
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Single relationship with nested operation CONNECT specified", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                input MovieActorsConnectFieldInput {
                  where: PersonConnectWhere
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieConnectInput {
                  actors: [MovieActorsConnectFieldInput!]
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(connect: MovieConnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonConnectWhere {
                  node: PersonWhere!
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                  someExtraProp: [Int!]
                  someExtraProp_POP: Int
                  someExtraProp_PUSH: [Int!]
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                  someExtraProp: [Int!]
                  someExtraProp_INCLUDES: Int
                  someExtraProp_NOT: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  someExtraProp_NOT_INCLUDES: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
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
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                  typename_IN: [PersonImplementation!]
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Single relationship with nested operation UPDATE specified", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [UPDATE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateConnectionInput {
                  node: PersonUpdateInput
                }

                input MovieActorsUpdateFieldInput {
                  update: MovieActorsUpdateConnectionInput
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                  someExtraProp: [Int!]
                  someExtraProp_POP: Int
                  someExtraProp_PUSH: [Int!]
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                  someExtraProp: [Int!]
                  someExtraProp_INCLUDES: Int
                  someExtraProp_NOT: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  someExtraProp_NOT_INCLUDES: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
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
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonUpdateInput {
                  name: String
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                  typename_IN: [PersonImplementation!]
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Single relationship with nested operation DELETE specified", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DELETE])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsDeleteFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  delete: [MovieActorsDeleteFieldInput!]
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
                }

                input MovieDeleteInput {
                  actors: [MovieActorsDeleteFieldInput!]
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(delete: MovieDeleteInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                  someExtraProp: [Int!]
                  someExtraProp_POP: Int
                  someExtraProp_PUSH: [Int!]
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                  someExtraProp: [Int!]
                  someExtraProp_INCLUDES: Int
                  someExtraProp_NOT: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  someExtraProp_NOT_INCLUDES: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
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
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                  typename_IN: [PersonImplementation!]
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Single relationship with nested operation DISCONNECT specified", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DISCONNECT])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsDisconnectFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  disconnect: [MovieActorsDisconnectFieldInput!]
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  id: ID
                }

                input MovieDisconnectInput {
                  actors: [MovieActorsDisconnectFieldInput!]
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                  someExtraProp: [Int!]
                  someExtraProp_POP: Int
                  someExtraProp_PUSH: [Int!]
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                  someExtraProp: [Int!]
                  someExtraProp_INCLUDES: Int
                  someExtraProp_NOT: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  someExtraProp_NOT_INCLUDES: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
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
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                  typename_IN: [PersonImplementation!]
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Two relationships with nested operations specified on one", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                    producers: [Person!]! @relationship(type: "PRODUCED", direction: IN, nestedOperations: [DISCONNECT])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                  producers(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  producersAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonProducersAggregationSelection
                  producersConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieProducersConnectionSort!], where: MovieProducersConnectionWhere): MovieProducersConnection!
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                input MovieActorsConnectFieldInput {
                  where: PersonConnectWhere
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsCreateFieldInput {
                  node: PersonCreateInput!
                }

                input MovieActorsDeleteFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsDisconnectFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                  create: [MovieActorsCreateFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateConnectionInput {
                  node: PersonUpdateInput
                }

                input MovieActorsUpdateFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                  create: [MovieActorsCreateFieldInput!]
                  delete: [MovieActorsDeleteFieldInput!]
                  disconnect: [MovieActorsDisconnectFieldInput!]
                  update: MovieActorsUpdateConnectionInput
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieConnectInput {
                  actors: [MovieActorsConnectFieldInput!]
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
                }

                input MovieDeleteInput {
                  actors: [MovieActorsDeleteFieldInput!]
                }

                input MovieDisconnectInput {
                  actors: [MovieActorsDisconnectFieldInput!]
                  producers: [MovieProducersDisconnectFieldInput!]
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                type MoviePersonProducersAggregationSelection {
                  count: Int!
                  node: MoviePersonProducersNodeAggregateSelection
                }

                type MoviePersonProducersNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                input MovieProducersAggregateInput {
                  AND: [MovieProducersAggregateInput!]
                  NOT: MovieProducersAggregateInput
                  OR: [MovieProducersAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieProducersNodeAggregationWhereInput
                }

                type MovieProducersConnection {
                  edges: [MovieProducersRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieProducersConnectionSort {
                  node: PersonSort
                }

                input MovieProducersConnectionWhere {
                  AND: [MovieProducersConnectionWhere!]
                  NOT: MovieProducersConnectionWhere
                  OR: [MovieProducersConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieProducersDisconnectFieldInput {
                  where: MovieProducersConnectionWhere
                }

                input MovieProducersNodeAggregationWhereInput {
                  AND: [MovieProducersNodeAggregationWhereInput!]
                  NOT: MovieProducersNodeAggregationWhereInput
                  OR: [MovieProducersNodeAggregationWhereInput!]
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
                }

                type MovieProducersRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieProducersUpdateFieldInput {
                  disconnect: [MovieProducersDisconnectFieldInput!]
                  where: MovieProducersConnectionWhere
                }

                input MovieRelationInput {
                  actors: [MovieActorsCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                  producers: [MovieProducersUpdateFieldInput!]
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                  producers: PersonWhere @deprecated(reason: \\"Use \`producers_SOME\` instead.\\")
                  producersAggregate: MovieProducersAggregateInput
                  producersConnection: MovieProducersConnectionWhere @deprecated(reason: \\"Use \`producersConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_ALL: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_NONE: MovieProducersConnectionWhere
                  producersConnection_NOT: MovieProducersConnectionWhere @deprecated(reason: \\"Use \`producersConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SINGLE: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SOME: MovieProducersConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  producers_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  producers_NONE: PersonWhere
                  producers_NOT: PersonWhere @deprecated(reason: \\"Use \`producers_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  producers_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  producers_SOME: PersonWhere
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonConnectWhere {
                  node: PersonWhere!
                }

                input PersonCreateInput {
                  PersonOne: PersonOneCreateInput
                  PersonTwo: PersonTwoCreateInput
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                  someExtraProp: [Int!]
                  someExtraProp_POP: Int
                  someExtraProp_PUSH: [Int!]
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                  someExtraProp: [Int!]
                  someExtraProp_INCLUDES: Int
                  someExtraProp_NOT: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  someExtraProp_NOT_INCLUDES: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
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
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonUpdateInput {
                  name: String
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                  typename_IN: [PersonImplementation!]
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });

        test("Two relationships with nested operations specified on both", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person {
                    name: String
                }

                type Movie {
                    id: ID
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE, DELETE])
                    producers: [Person!]! @relationship(type: "PRODUCED", direction: IN, nestedOperations: [DISCONNECT])
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
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesCreated: Int!
                  relationshipsCreated: Int!
                }

                type CreateMoviesMutationResponse {
                  info: CreateInfo!
                  movies: [Movie!]!
                }

                type CreatePersonOnesMutationResponse {
                  info: CreateInfo!
                  personOnes: [PersonOne!]!
                }

                type CreatePersonTwosMutationResponse {
                  info: CreateInfo!
                  personTwos: [PersonTwo!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type IDAggregateSelection {
                  longest: ID
                  shortest: ID
                }

                type Movie {
                  actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                  producers(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                  producersAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonProducersAggregationSelection
                  producersConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieProducersConnectionSort!], where: MovieProducersConnectionWhere): MovieProducersConnection!
                }

                input MovieActorsAggregateInput {
                  AND: [MovieActorsAggregateInput!]
                  NOT: MovieActorsAggregateInput
                  OR: [MovieActorsAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieActorsNodeAggregationWhereInput
                }

                type MovieActorsConnection {
                  edges: [MovieActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieActorsConnectionSort {
                  node: PersonSort
                }

                input MovieActorsConnectionWhere {
                  AND: [MovieActorsConnectionWhere!]
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieActorsCreateFieldInput {
                  node: PersonCreateInput!
                }

                input MovieActorsDeleteFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                  delete: [MovieActorsDeleteFieldInput!]
                  where: MovieActorsConnectionWhere
                }

                type MovieAggregateSelection {
                  count: Int!
                  id: IDAggregateSelection!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
                }

                input MovieDeleteInput {
                  actors: [MovieActorsDeleteFieldInput!]
                }

                input MovieDisconnectInput {
                  producers: [MovieProducersDisconnectFieldInput!]
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

                type MoviePersonActorsAggregationSelection {
                  count: Int!
                  node: MoviePersonActorsNodeAggregateSelection
                }

                type MoviePersonActorsNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                type MoviePersonProducersAggregationSelection {
                  count: Int!
                  node: MoviePersonProducersNodeAggregateSelection
                }

                type MoviePersonProducersNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                input MovieProducersAggregateInput {
                  AND: [MovieProducersAggregateInput!]
                  NOT: MovieProducersAggregateInput
                  OR: [MovieProducersAggregateInput!]
                  count: Int
                  count_GT: Int
                  count_GTE: Int
                  count_LT: Int
                  count_LTE: Int
                  node: MovieProducersNodeAggregationWhereInput
                }

                type MovieProducersConnection {
                  edges: [MovieProducersRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieProducersConnectionSort {
                  node: PersonSort
                }

                input MovieProducersConnectionWhere {
                  AND: [MovieProducersConnectionWhere!]
                  NOT: MovieProducersConnectionWhere
                  OR: [MovieProducersConnectionWhere!]
                  node: PersonWhere
                  node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                input MovieProducersDisconnectFieldInput {
                  where: MovieProducersConnectionWhere
                }

                input MovieProducersNodeAggregationWhereInput {
                  AND: [MovieProducersNodeAggregationWhereInput!]
                  NOT: MovieProducersNodeAggregationWhereInput
                  OR: [MovieProducersNodeAggregationWhereInput!]
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
                }

                type MovieProducersRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieProducersUpdateFieldInput {
                  disconnect: [MovieProducersDisconnectFieldInput!]
                  where: MovieProducersConnectionWhere
                }

                input MovieRelationInput {
                  actors: [MovieActorsCreateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: ID
                  producers: [MovieProducersUpdateFieldInput!]
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                  actorsAggregate: MovieActorsAggregateInput
                  actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: MovieActorsConnectionWhere
                  actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: MovieActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: MovieActorsConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  actors_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  actors_NONE: PersonWhere
                  actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  actors_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  actors_SOME: PersonWhere
                  id: ID
                  id_CONTAINS: ID
                  id_ENDS_WITH: ID
                  id_IN: [ID]
                  id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  id_STARTS_WITH: ID
                  producers: PersonWhere @deprecated(reason: \\"Use \`producers_SOME\` instead.\\")
                  producersAggregate: MovieProducersAggregateInput
                  producersConnection: MovieProducersConnectionWhere @deprecated(reason: \\"Use \`producersConnection_SOME\` instead.\\")
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_ALL: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_NONE: MovieProducersConnectionWhere
                  producersConnection_NOT: MovieProducersConnectionWhere @deprecated(reason: \\"Use \`producersConnection_NONE\` instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SINGLE: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SOME: MovieProducersConnectionWhere
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  producers_ALL: PersonWhere
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  producers_NONE: PersonWhere
                  producers_NOT: PersonWhere @deprecated(reason: \\"Use \`producers_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  producers_SINGLE: PersonWhere
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  producers_SOME: PersonWhere
                }

                type MoviesConnection {
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deletePersonOnes(where: PersonOneWhere): DeleteInfo!
                  deletePersonTwos(where: PersonTwoWhere): DeleteInfo!
                  updateMovies(create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updatePersonOnes(update: PersonOneUpdateInput, where: PersonOneWhere): UpdatePersonOnesMutationResponse!
                  updatePersonTwos(update: PersonTwoUpdateInput, where: PersonTwoWhere): UpdatePersonTwosMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                type PeopleConnection {
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  PersonOne: PersonOneCreateInput
                  PersonTwo: PersonTwoCreateInput
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                input PersonOneOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonOneSort objects to sort PersonOnes by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonOneSort!]
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: String
                  someExtraProp: [Int!]
                  someExtraProp_POP: Int
                  someExtraProp_PUSH: [Int!]
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
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
                  someExtraProp: [Int!]
                  someExtraProp_INCLUDES: Int
                  someExtraProp_NOT: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  someExtraProp_NOT_INCLUDES: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                }

                type PersonOnesConnection {
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonSort]
                }

                \\"\\"\\"
                Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                \\"\\"\\"
                input PersonSort {
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregateSelection {
                  count: Int!
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                input PersonTwoOptions {
                  limit: Int
                  offset: Int
                  \\"\\"\\"
                  Specify one or more PersonTwoSort objects to sort PersonTwos by. The sorts will be applied in the order in which they are arranged in the array.
                  \\"\\"\\"
                  sort: [PersonTwoSort!]
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: String
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
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
                }

                type PersonTwosConnection {
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
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
                  typename_IN: [PersonImplementation!]
                }

                type Query {
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                  people(options: PersonOptions, where: PersonWhere): [Person!]!
                  peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                  peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
                  personOnes(options: PersonOneOptions, where: PersonOneWhere): [PersonOne!]!
                  personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(options: PersonTwoOptions, where: PersonTwoWhere): [PersonTwo!]!
                  personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort], where: PersonTwoWhere): PersonTwosConnection!
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
                }

                type UpdatePersonOnesMutationResponse {
                  info: UpdateInfo!
                  personOnes: [PersonOne!]!
                }

                type UpdatePersonTwosMutationResponse {
                  info: UpdateInfo!
                  personTwos: [PersonTwo!]!
                }"
            `);
        });
    });
});
