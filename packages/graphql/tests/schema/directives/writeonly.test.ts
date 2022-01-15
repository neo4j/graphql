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

describe("@writeonly directive", () => {
    test("makes a field writeonly", () => {
        const typeDefs = gql`
            type User {
                username: String!
                password: String! @writeonly
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

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(where: UserWhere): DeleteInfo!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            type Query {
              users(options: UserOptions, where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersCount(where: UserWhere): Int!
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

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User {
              username: String!
            }

            type UserAggregateSelection {
              count: Int!
              password: StringAggregateSelectionNonNullable!
              username: StringAggregateSelectionNonNullable!
            }

            input UserCreateInput {
              password: String!
              username: String!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [UserSort]
            }

            \\"\\"\\"Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.\\"\\"\\"
            input UserSort {
              password: SortDirection
              username: SortDirection
            }

            input UserUpdateInput {
              password: String
              username: String
            }

            input UserWhere {
              AND: [UserWhere!]
              OR: [UserWhere!]
              password: String
              password_CONTAINS: String
              password_ENDS_WITH: String
              password_IN: [String]
              password_NOT: String
              password_NOT_CONTAINS: String
              password_NOT_ENDS_WITH: String
              password_NOT_IN: [String]
              password_NOT_STARTS_WITH: String
              password_STARTS_WITH: String
              username: String
              username_CONTAINS: String
              username_ENDS_WITH: String
              username_IN: [String]
              username_NOT: String
              username_NOT_CONTAINS: String
              username_NOT_ENDS_WITH: String
              username_NOT_IN: [String]
              username_NOT_STARTS_WITH: String
              username_STARTS_WITH: String
            }
            "
        `);
    });

    test("makes an inherited field writeonly", () => {
        const typeDefs = gql`
            interface UserInterface {
                username: String!
                password: String! @writeonly
            }

            type User implements UserInterface {
                username: String!
                password: String!
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

            type CreateUsersMutationResponse {
              info: CreateInfo!
              users: [User!]!
            }

            type DeleteInfo {
              bookmark: String
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Mutation {
              createUsers(input: [UserCreateInput!]!): CreateUsersMutationResponse!
              deleteUsers(where: UserWhere): DeleteInfo!
              updateUsers(update: UserUpdateInput, where: UserWhere): UpdateUsersMutationResponse!
            }

            type Query {
              users(options: UserOptions, where: UserWhere): [User!]!
              usersAggregate(where: UserWhere): UserAggregateSelection!
              usersCount(where: UserWhere): Int!
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

            type UpdateUsersMutationResponse {
              info: UpdateInfo!
              users: [User!]!
            }

            type User implements UserInterface {
              username: String!
            }

            type UserAggregateSelection {
              count: Int!
              password: StringAggregateSelectionNonNullable!
              username: StringAggregateSelectionNonNullable!
            }

            input UserCreateInput {
              password: String!
              username: String!
            }

            interface UserInterface {
              username: String!
            }

            input UserOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more UserSort objects to sort Users by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [UserSort]
            }

            \\"\\"\\"Fields to sort Users by. The order in which sorts are applied is not guaranteed when specifying many fields in one UserSort object.\\"\\"\\"
            input UserSort {
              password: SortDirection
              username: SortDirection
            }

            input UserUpdateInput {
              password: String
              username: String
            }

            input UserWhere {
              AND: [UserWhere!]
              OR: [UserWhere!]
              password: String
              password_CONTAINS: String
              password_ENDS_WITH: String
              password_IN: [String]
              password_NOT: String
              password_NOT_CONTAINS: String
              password_NOT_ENDS_WITH: String
              password_NOT_IN: [String]
              password_NOT_STARTS_WITH: String
              password_STARTS_WITH: String
              username: String
              username_CONTAINS: String
              username_ENDS_WITH: String
              username_IN: [String]
              username_NOT: String
              username_NOT_CONTAINS: String
              username_NOT_ENDS_WITH: String
              username_NOT_IN: [String]
              username_NOT_STARTS_WITH: String
              username_STARTS_WITH: String
            }
            "
        `);
    });

    test("makes a relationship field writeonly", () => {
        const typeDefs = gql`
            type Actor {
                name: String
            }

            type Movie {
                id: ID
                actors: [Actor]! @writeonly @relationship(type: "ACTED_IN", direction: IN)
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
              name: String
            }

            type ActorAggregateSelection {
              count: Int!
              name: StringAggregateSelectionNullable!
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              name: String
            }

            input ActorOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [ActorSort]
            }

            \\"\\"\\"Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.\\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              name: String
            }

            input ActorWhere {
              AND: [ActorWhere!]
              OR: [ActorWhere!]
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

            type IDAggregateSelectionNullable {
              longest: ID
              shortest: ID
            }

            type Movie {
              id: ID
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              OR: [MovieActorsAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              where: ActorConnectWhere
            }

            input MovieActorsConnectionWhere {
              AND: [MovieActorsConnectionWhere!]
              OR: [MovieActorsConnectionWhere!]
              node: ActorWhere
              node_NOT: ActorWhere
            }

            input MovieActorsCreateFieldInput {
              node: ActorCreateInput!
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
              OR: [MovieActorsNodeAggregationWhereInput!]
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

            input MovieActorsUpdateConnectionInput {
              node: ActorUpdateInput
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
              id: IDAggregateSelectionNullable!
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
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.\\"\\"\\"
              sort: [MovieSort]
            }

            input MovieRelationInput {
              actors: [MovieActorsCreateFieldInput!]
            }

            \\"\\"\\"Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.\\"\\"\\"
            input MovieSort {
              id: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              id: ID
            }

            input MovieWhere {
              AND: [MovieWhere!]
              OR: [MovieWhere!]
              actors: ActorWhere
              actorsAggregate: MovieActorsAggregateInput
              actorsConnection: MovieActorsConnectionWhere
              actorsConnection_EVERY: MovieActorsConnectionWhere
              actorsConnection_NONE: MovieActorsConnectionWhere
              actorsConnection_NOT: MovieActorsConnectionWhere
              actorsConnection_SINGLE: MovieActorsConnectionWhere
              actorsConnection_SOME: MovieActorsConnectionWhere
              actors_EVERY: ActorWhere
              actors_NONE: ActorWhere
              actors_NOT: ActorWhere
              actors_SINGLE: ActorWhere
              actors_SOME: ActorWhere
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

            type Mutation {
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteActors(where: ActorWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            type Query {
              actors(options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(where: ActorWhere): ActorAggregateSelection!
              actorsCount(where: ActorWhere): Int!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesCount(where: MovieWhere): Int!
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
