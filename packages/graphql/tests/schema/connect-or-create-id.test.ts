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
import { Neo4jGraphQL } from "../../src";

describe("connect or create with id", () => {
    test("connect or create with id", () => {
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
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Actor {
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): ActorMovieMoviesAggregationSelection
              moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
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
              OR: [ActorMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              where: MovieConnectWhere
            }

            input ActorMoviesConnectOrCreateFieldInput {
              onCreate: ActorMoviesConnectOrCreateFieldInputOnCreate!
              where: MovieConnectOrCreateWhere!
            }

            input ActorMoviesConnectOrCreateFieldInputOnCreate {
              node: MovieCreateInput!
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
              OR: [ActorMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere
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
              OR: [ActorMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID
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
              \\"\\"\\"Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [ActorSort]
            }

            input ActorRelationInput {
              movies: [ActorMoviesCreateFieldInput!]
            }

            \\"\\"\\"Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.\\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              movies: [ActorMoviesUpdateFieldInput!]
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              OR: [ActorWhere!]
              movies: MovieWhere
              moviesAggregate: ActorMoviesAggregateInput
              moviesConnection: ActorMoviesConnectionWhere
              moviesConnection_ALL: ActorMoviesConnectionWhere
              moviesConnection_NONE: ActorMoviesConnectionWhere
              moviesConnection_NOT: ActorMoviesConnectionWhere
              moviesConnection_SINGLE: ActorMoviesConnectionWhere
              moviesConnection_SOME: ActorMoviesConnectionWhere
              movies_ALL: MovieWhere
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere
              movies_SINGLE: MovieWhere
              movies_SOME: MovieWhere
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

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [MovieSort]
            }

            \\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
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
              OR: [MovieWhere!]
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID]
              id_NOT_STARTS_WITH: ID
              id_STARTS_WITH: ID
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
    test("connect or create with non-autogenerated id", () => {
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
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema));

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
              bookmark: String
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
              creator(options: UserOptions, where: UserWhere): User!
              creatorAggregate(where: UserWhere): PostUserCreatorAggregationSelection
              creatorConnection(after: String, first: Int, sort: [PostCreatorConnectionSort!], where: PostCreatorConnectionWhere): PostCreatorConnection!
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
              where: UserConnectWhere
            }

            input PostCreatorConnectOrCreateFieldInput {
              onCreate: PostCreatorConnectOrCreateFieldInputOnCreate!
              where: UserConnectOrCreateWhere!
            }

            input PostCreatorConnectOrCreateFieldInputOnCreate {
              node: UserCreateInput!
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
              OR: [PostCreatorConnectionWhere!]
              node: UserWhere
              node_NOT: UserWhere
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
              OR: [PostCreatorNodeAggregationWhereInput!]
              id_EQUAL: ID
              name_AVERAGE_EQUAL: Float
              name_AVERAGE_GT: Float
              name_AVERAGE_GTE: Float
              name_AVERAGE_LT: Float
              name_AVERAGE_LTE: Float
              name_EQUAL: String
              name_GT: Int
              name_GTE: Int
              name_LONGEST_EQUAL: Int
              name_LONGEST_GT: Int
              name_LONGEST_GTE: Int
              name_LONGEST_LT: Int
              name_LONGEST_LTE: Int
              name_LT: Int
              name_LTE: Int
              name_SHORTEST_EQUAL: Int
              name_SHORTEST_GT: Int
              name_SHORTEST_GTE: Int
              name_SHORTEST_LT: Int
              name_SHORTEST_LTE: Int
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

            input PostOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more PostSort objects to sort Posts by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [PostSort]
            }

            input PostRelationInput {
              creator: PostCreatorCreateFieldInput
            }

            \\"\\"\\"Fields to sort Posts by. The order in which sorts are applied is not guaranteed when specifying many fields in one PostSort object.\\"\\"\\"
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
              OR: [PostWhere!]
              content: String
              content_CONTAINS: String
              content_ENDS_WITH: String
              content_IN: [String]
              content_NOT: String
              content_NOT_CONTAINS: String
              content_NOT_ENDS_WITH: String
              content_NOT_IN: [String]
              content_NOT_STARTS_WITH: String
              content_STARTS_WITH: String
              createdAt: DateTime
              createdAt_GT: DateTime
              createdAt_GTE: DateTime
              createdAt_IN: [DateTime]
              createdAt_LT: DateTime
              createdAt_LTE: DateTime
              createdAt_NOT: DateTime
              createdAt_NOT_IN: [DateTime]
              creator: UserWhere
              creatorAggregate: PostCreatorAggregateInput
              creatorConnection: PostCreatorConnectionWhere
              creatorConnection_NOT: PostCreatorConnectionWhere
              creator_NOT: UserWhere
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID]
              id_NOT_STARTS_WITH: ID
              id_STARTS_WITH: ID
            }

            type Query {
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): PostAggregateSelection!
              users(options: UserOptions, where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
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
              bookmark: String
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
              posts(options: PostOptions, where: PostWhere): [Post!]!
              postsAggregate(where: PostWhere): UserPostPostsAggregationSelection
              postsConnection(after: String, first: Int, sort: [UserPostsConnectionSort!], where: UserPostsConnectionWhere): UserPostsConnection!
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

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [UserSort]
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
              where: PostConnectWhere
            }

            input UserPostsConnectOrCreateFieldInput {
              onCreate: UserPostsConnectOrCreateFieldInputOnCreate!
              where: PostConnectOrCreateWhere!
            }

            input UserPostsConnectOrCreateFieldInputOnCreate {
              node: PostCreateInput!
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
              OR: [UserPostsConnectionWhere!]
              node: PostWhere
              node_NOT: PostWhere
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
              OR: [UserPostsNodeAggregationWhereInput!]
              content_AVERAGE_EQUAL: Float
              content_AVERAGE_GT: Float
              content_AVERAGE_GTE: Float
              content_AVERAGE_LT: Float
              content_AVERAGE_LTE: Float
              content_EQUAL: String
              content_GT: Int
              content_GTE: Int
              content_LONGEST_EQUAL: Int
              content_LONGEST_GT: Int
              content_LONGEST_GTE: Int
              content_LONGEST_LT: Int
              content_LONGEST_LTE: Int
              content_LT: Int
              content_LTE: Int
              content_SHORTEST_EQUAL: Int
              content_SHORTEST_GT: Int
              content_SHORTEST_GTE: Int
              content_SHORTEST_LT: Int
              content_SHORTEST_LTE: Int
              createdAt_EQUAL: DateTime
              createdAt_GT: DateTime
              createdAt_GTE: DateTime
              createdAt_LT: DateTime
              createdAt_LTE: DateTime
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
              id_EQUAL: ID
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

            \\"\\"\\"Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.\\"\\"\\"
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
              OR: [UserWhere!]
              id: ID
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_IN: [ID]
              id_NOT: ID
              id_NOT_CONTAINS: ID
              id_NOT_ENDS_WITH: ID
              id_NOT_IN: [ID]
              id_NOT_STARTS_WITH: ID
              id_STARTS_WITH: ID
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
              posts: PostWhere
              postsAggregate: UserPostsAggregateInput
              postsConnection: UserPostsConnectionWhere
              postsConnection_ALL: UserPostsConnectionWhere
              postsConnection_NONE: UserPostsConnectionWhere
              postsConnection_NOT: UserPostsConnectionWhere
              postsConnection_SINGLE: UserPostsConnectionWhere
              postsConnection_SOME: UserPostsConnectionWhere
              posts_ALL: PostWhere
              posts_NONE: PostWhere
              posts_NOT: PostWhere
              posts_SINGLE: PostWhere
              posts_SOME: PostWhere
            }
            "
        `);
    });
});
