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
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../src";

describe("connect or create with id", () => {
    test("connect or create with id", async () => {
        const typeDefs = gql`
            type Movie {
                title: String!
                id: ID! @id
            }

            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
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
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
              name: String!
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNonNullable!
            }

            input ActorConnectInput {
              movies: [ActorMoviesConnectFieldInput!]
            }

            input ActorConnectOrCreateInput {
              movies: [ActorMoviesConnectOrCreateFieldInput!]
            }

            input ActorCreateInput {
              movies: ActorMoviesFieldInput
              name: String!
            }

            input ActorDeleteInput {
              movies: [ActorMoviesDeleteFieldInput!]
            }

            input ActorDisconnectInput {
              movies: [ActorMoviesDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            type ActorMovieMoviesAggregationSelection {
              count: Int!
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesNodeAggregateSelection {
              id: IDAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input ActorMoviesAggregateInput {
              AND: [ActorMoviesAggregateInput!]
              NOT: ActorMoviesAggregateInput
              OR: [ActorMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            input ActorMoviesConnectOrCreateFieldInput {
              onCreate: ActorMoviesConnectOrCreateFieldInputOnCreate!
              where: MovieConnectOrCreateWhere!
            }

            input ActorMoviesConnectOrCreateFieldInputOnCreate {
              node: MovieOnCreateInput!
            }

            type ActorMoviesConnection {
              edges: [ActorMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorMoviesConnectionSort {
              node: MovieSort
            }

            input ActorMoviesConnectionWhere {
              AND: [ActorMoviesConnectionWhere!]
              NOT: ActorMoviesConnectionWhere
              OR: [ActorMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ActorMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input ActorMoviesDeleteFieldInput {
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesDisconnectFieldInput {
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              connectOrCreate: [ActorMoviesConnectOrCreateFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
            }

            input ActorMoviesNodeAggregationWhereInput {
              AND: [ActorMoviesNodeAggregationWhereInput!]
              NOT: ActorMoviesNodeAggregationWhereInput
              OR: [ActorMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
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

            type ActorMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input ActorMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input ActorMoviesUpdateFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              connectOrCreate: [ActorMoviesConnectOrCreateFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
              delete: [ActorMoviesDeleteFieldInput!]
              disconnect: [ActorMoviesDisconnectFieldInput!]
              update: ActorMoviesUpdateConnectionInput
              where: ActorMoviesConnectionWhere
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
              movies: [ActorMoviesCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              movies: [ActorMoviesUpdateFieldInput!]
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: ActorMoviesAggregateInput
              moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Actors where all of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: ActorMoviesConnectionWhere
              moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: ActorMoviesConnectionWhere
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
              name: String
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreateMoviesMutationResponse {
              info: CreateInfo!
              movies: [Movie!]!
            }

            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IDAggregateSelectionNonNullable {
              longest: ID!
              shortest: ID!
            }

            type Movie {
              id: ID!
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelectionNonNullable!
              title: StringAggregateSelectionNonNullable!
            }

            input MovieConnectOrCreateWhere {
              node: MovieUniqueWhere!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              title: String!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieOnCreateInput {
              title: String!
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
              title: SortDirection
            }

            input MovieUniqueWhere {
              id: ID
            }

            input MovieUpdateInput {
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
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
              title: String
              title_CONTAINS: String
              title_ENDS_WITH: String
              title_IN: [String!]
              title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
              updateActors(connect: ActorConnectInput, connectOrCreate: ActorConnectOrCreateInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
              actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
            }

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

    test("connect or create with non-autogenerated id", async () => {
        const typeDefs = gql`
            type Post {
                id: ID! @id(autogenerate: false)
                content: String!
                creator: User! @relationship(type: "HAS_POST", direction: IN)
                createdAt: DateTime!
            }

            type User {
                id: ID! @id(autogenerate: true)
                name: String!
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type CreatePostsMutationResponse {
              info: CreateInfo!
              posts: [Post!]!
            }

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            type DateTimeAggregateSelectionNonNullable {
              max: DateTime!
              min: DateTime!
            }

            type DeleteInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IDAggregateSelectionNonNullable {
              longest: ID!
              shortest: ID!
            }

            type Mutation {
              createPosts(input: [PostCreateInput!]!): CreatePostsMutationResponse!
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deletePosts(delete: PostDeleteInput, where: PostWhere): DeleteInfo!
              deleteUsers(delete: UserDeleteInput, where: UserWhere): DeleteInfo!
              updatePosts(connect: PostConnectInput, connectOrCreate: PostConnectOrCreateInput, create: PostRelationInput, delete: PostDeleteInput, disconnect: PostDisconnectInput, update: PostUpdateInput, where: PostWhere): UpdatePostsMutationResponse!
              updateUsers(connect: UserConnectInput, connectOrCreate: UserConnectOrCreateInput, create: UserRelationInput, delete: UserDeleteInput, disconnect: UserDisconnectInput, update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Post {
              content: String!
              createdAt: DateTime!
              creator(directed: Boolean = true, options: UserOptions, where: UserWhere): User!
              creatorAggregate(directed: Boolean = true, where: UserWhere): PostUserCreatorAggregationSelection
              creatorConnection(after: String, directed: Boolean = true, first: Int, sort: [PostCreatorConnectionSort!], where: PostCreatorConnectionWhere): PostCreatorConnection!
              id: ID!
            }

            type PostAggregateSelection {
              content: StringAggregateSelectionNonNullable!
              count: Int!
              createdAt: DateTimeAggregateSelectionNonNullable!
              id: IDAggregateSelectionNonNullable!
            }

            input PostConnectInput {
              creator: PostCreatorConnectFieldInput
            }

            input PostConnectOrCreateInput {
              creator: PostCreatorConnectOrCreateFieldInput
            }

            input PostConnectOrCreateWhere {
              node: PostUniqueWhere!
            }

            input PostConnectWhere {
              node: PostWhere!
            }

            input PostCreateInput {
              content: String!
              createdAt: DateTime!
              creator: PostCreatorFieldInput
              id: ID!
            }

            input PostCreatorAggregateInput {
              AND: [PostCreatorAggregateInput!]
              NOT: PostCreatorAggregateInput
              OR: [PostCreatorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PostCreatorNodeAggregationWhereInput
            }

            input PostCreatorConnectFieldInput {
              connect: UserConnectInput
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: UserConnectWhere
            }

            input PostCreatorConnectOrCreateFieldInput {
              onCreate: PostCreatorConnectOrCreateFieldInputOnCreate!
              where: UserConnectOrCreateWhere!
            }

            input PostCreatorConnectOrCreateFieldInputOnCreate {
              node: UserOnCreateInput!
            }

            type PostCreatorConnection {
              edges: [PostCreatorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PostCreatorConnectionSort {
              node: UserSort
            }

            input PostCreatorConnectionWhere {
              AND: [PostCreatorConnectionWhere!]
              NOT: PostCreatorConnectionWhere
              OR: [PostCreatorConnectionWhere!]
              node: UserWhere
              node_NOT: UserWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input PostCreatorCreateFieldInput {
              node: UserCreateInput!
            }

            input PostCreatorDeleteFieldInput {
              delete: UserDeleteInput
              where: PostCreatorConnectionWhere
            }

            input PostCreatorDisconnectFieldInput {
              disconnect: UserDisconnectInput
              where: PostCreatorConnectionWhere
            }

            input PostCreatorFieldInput {
              connect: PostCreatorConnectFieldInput
              connectOrCreate: PostCreatorConnectOrCreateFieldInput
              create: PostCreatorCreateFieldInput
            }

            input PostCreatorNodeAggregationWhereInput {
              AND: [PostCreatorNodeAggregationWhereInput!]
              NOT: PostCreatorNodeAggregationWhereInput
              OR: [PostCreatorNodeAggregationWhereInput!]
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

            type PostCreatorRelationship {
              cursor: String!
              node: User!
            }

            input PostCreatorUpdateConnectionInput {
              node: UserUpdateInput
            }

            input PostCreatorUpdateFieldInput {
              connect: PostCreatorConnectFieldInput
              connectOrCreate: PostCreatorConnectOrCreateFieldInput
              create: PostCreatorCreateFieldInput
              delete: PostCreatorDeleteFieldInput
              disconnect: PostCreatorDisconnectFieldInput
              update: PostCreatorUpdateConnectionInput
              where: PostCreatorConnectionWhere
            }

            input PostDeleteInput {
              creator: PostCreatorDeleteFieldInput
            }

            input PostDisconnectInput {
              creator: PostCreatorDisconnectFieldInput
            }

            type PostEdge {
              cursor: String!
              node: Post!
            }

            input PostOnCreateInput {
              content: String!
              createdAt: DateTime!
              id: ID!
            }

            input PostOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more PostSort objects to sort Posts by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [PostSort!]
            }

            input PostRelationInput {
              creator: PostCreatorCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.
            \\"\\"\\"
            input PostSort {
              content: SortDirection
              createdAt: SortDirection
              id: SortDirection
            }

            input PostUniqueWhere {
              id: ID
            }

            input PostUpdateInput {
              content: String
              createdAt: DateTime
              creator: PostCreatorUpdateFieldInput
              id: ID
            }

            type PostUserCreatorAggregationSelection {
              count: Int!
              node: PostUserCreatorNodeAggregateSelection
            }

            type PostUserCreatorNodeAggregateSelection {
              id: IDAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
            }

            input PostWhere {
              AND: [PostWhere!]
              NOT: PostWhere
              OR: [PostWhere!]
              content: String
              content_CONTAINS: String
              content_ENDS_WITH: String
              content_IN: [String!]
              content_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              content_STARTS_WITH: String
              createdAt: DateTime
              createdAt_GT: DateTime
              createdAt_GTE: DateTime
              createdAt_IN: [DateTime!]
              createdAt_LT: DateTime
              createdAt_LTE: DateTime
              createdAt_NOT: DateTime @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              createdAt_NOT_IN: [DateTime!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              creator: UserWhere
              creatorAggregate: PostCreatorAggregateInput
              creatorConnection: PostCreatorConnectionWhere
              creatorConnection_NOT: PostCreatorConnectionWhere
              creator_NOT: UserWhere
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
            }

            type PostsConnection {
              edges: [PostEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              postsConnection(after: String, first: Int, sort: [PostSort], where: PostWhere): PostsConnection!
              users(options: UserOptions, where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersConnection(after: String, first: Int, sort: [UserSort], where: UserWhere): UsersConnection!
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

            type UpdateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesCreated: Int!
              nodesDeleted: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            type UpdatePostsMutationResponse {
              info: UpdateInfo!
              posts: [Post!]!
            }

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              id: ID!
              name: String!
              posts(directed: Boolean = true, options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(directed: Boolean = true, where: PostWhere): UserPostPostsAggregationSelection
              postsConnection(after: String, directed: Boolean = true, first: Int, sort: [UserPostsConnectionSort!], where: UserPostsConnectionWhere): UserPostsConnection!
            }

            type UserAggregateSelection {
              count: Int!
              id: IDAggregateSelectionNonNullable!
              name: StringAggregateSelectionNonNullable!
            }

            input UserConnectInput {
              posts: [UserPostsConnectFieldInput!]
            }

            input UserConnectOrCreateInput {
              posts: [UserPostsConnectOrCreateFieldInput!]
            }

            input UserConnectOrCreateWhere {
              node: UserUniqueWhere!
            }

            input UserConnectWhere {
              node: UserWhere!
            }

            input UserCreateInput {
              name: String!
              posts: UserPostsFieldInput
            }

            input UserDeleteInput {
              posts: [UserPostsDeleteFieldInput!]
            }

            input UserDisconnectInput {
              posts: [UserPostsDisconnectFieldInput!]
            }

            type UserEdge {
              cursor: String!
              node: User!
            }

            input UserOnCreateInput {
              name: String!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [UserSort!]
            }

            type UserPostPostsAggregationSelection {
              count: Int!
              node: UserPostPostsNodeAggregateSelection
            }

            type UserPostPostsNodeAggregateSelection {
              content: StringAggregateSelectionNonNullable!
              createdAt: DateTimeAggregateSelectionNonNullable!
              id: IDAggregateSelectionNonNullable!
            }

            input UserPostsAggregateInput {
              AND: [UserPostsAggregateInput!]
              NOT: UserPostsAggregateInput
              OR: [UserPostsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: UserPostsNodeAggregationWhereInput
            }

            input UserPostsConnectFieldInput {
              connect: [PostConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties. Will default to \`false\` in 4.0.0.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: PostConnectWhere
            }

            input UserPostsConnectOrCreateFieldInput {
              onCreate: UserPostsConnectOrCreateFieldInputOnCreate!
              where: PostConnectOrCreateWhere!
            }

            input UserPostsConnectOrCreateFieldInputOnCreate {
              node: PostOnCreateInput!
            }

            type UserPostsConnection {
              edges: [UserPostsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input UserPostsConnectionSort {
              node: PostSort
            }

            input UserPostsConnectionWhere {
              AND: [UserPostsConnectionWhere!]
              NOT: UserPostsConnectionWhere
              OR: [UserPostsConnectionWhere!]
              node: PostWhere
              node_NOT: PostWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input UserPostsCreateFieldInput {
              node: PostCreateInput!
            }

            input UserPostsDeleteFieldInput {
              delete: PostDeleteInput
              where: UserPostsConnectionWhere
            }

            input UserPostsDisconnectFieldInput {
              disconnect: PostDisconnectInput
              where: UserPostsConnectionWhere
            }

            input UserPostsFieldInput {
              connect: [UserPostsConnectFieldInput!]
              connectOrCreate: [UserPostsConnectOrCreateFieldInput!]
              create: [UserPostsCreateFieldInput!]
            }

            input UserPostsNodeAggregationWhereInput {
              AND: [UserPostsNodeAggregationWhereInput!]
              NOT: UserPostsNodeAggregationWhereInput
              OR: [UserPostsNodeAggregationWhereInput!]
              content_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_LENGTH_EQUAL: Float
              content_AVERAGE_LENGTH_GT: Float
              content_AVERAGE_LENGTH_GTE: Float
              content_AVERAGE_LENGTH_LT: Float
              content_AVERAGE_LENGTH_LTE: Float
              content_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_LENGTH_EQUAL: Int
              content_LONGEST_LENGTH_GT: Int
              content_LONGEST_LENGTH_GTE: Int
              content_LONGEST_LENGTH_LT: Int
              content_LONGEST_LENGTH_LTE: Int
              content_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
              content_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_LENGTH_EQUAL: Int
              content_SHORTEST_LENGTH_GT: Int
              content_SHORTEST_LENGTH_GTE: Int
              content_SHORTEST_LENGTH_LT: Int
              content_SHORTEST_LENGTH_LTE: Int
              content_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
              content_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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
            }

            type UserPostsRelationship {
              cursor: String!
              node: Post!
            }

            input UserPostsUpdateConnectionInput {
              node: PostUpdateInput
            }

            input UserPostsUpdateFieldInput {
              connect: [UserPostsConnectFieldInput!]
              connectOrCreate: [UserPostsConnectOrCreateFieldInput!]
              create: [UserPostsCreateFieldInput!]
              delete: [UserPostsDeleteFieldInput!]
              disconnect: [UserPostsDisconnectFieldInput!]
              update: UserPostsUpdateConnectionInput
              where: UserPostsConnectionWhere
            }

            input UserRelationInput {
              posts: [UserPostsCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.
            \\"\\"\\"
            input UserSort {
              id: SortDirection
              name: SortDirection
            }

            input UserUniqueWhere {
              id: ID
            }

            input UserUpdateInput {
              name: String
              posts: [UserPostsUpdateFieldInput!]
            }

            input UserWhere {
              AND: [UserWhere!]
              NOT: UserWhere
              OR: [UserWhere!]
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
              name_IN: [String!]
              name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              name_STARTS_WITH: String
              posts: PostWhere @deprecated(reason: \\"Use \`posts_SOME\` instead.\\")
              postsAggregate: UserPostsAggregateInput
              postsConnection: UserPostsConnectionWhere @deprecated(reason: \\"Use \`postsConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Users where all of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_ALL: UserPostsConnectionWhere
              \\"\\"\\"
              Return Users where none of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_NONE: UserPostsConnectionWhere
              postsConnection_NOT: UserPostsConnectionWhere @deprecated(reason: \\"Use \`postsConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Users where one of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_SINGLE: UserPostsConnectionWhere
              \\"\\"\\"
              Return Users where some of the related UserPostsConnections match this filter
              \\"\\"\\"
              postsConnection_SOME: UserPostsConnectionWhere
              \\"\\"\\"Return Users where all of the related Posts match this filter\\"\\"\\"
              posts_ALL: PostWhere
              \\"\\"\\"Return Users where none of the related Posts match this filter\\"\\"\\"
              posts_NONE: PostWhere
              posts_NOT: PostWhere @deprecated(reason: \\"Use \`posts_NONE\` instead.\\")
              \\"\\"\\"Return Users where one of the related Posts match this filter\\"\\"\\"
              posts_SINGLE: PostWhere
              \\"\\"\\"Return Users where some of the related Posts match this filter\\"\\"\\"
              posts_SOME: PostWhere
            }

            type UsersConnection {
              edges: [UserEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }"
        `);
    });
});
