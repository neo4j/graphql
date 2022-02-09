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

describe("Relationship", () => {
    test("Single Relationship", () => {
        const typeDefs = gql`
            type Actor {
                name: String
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
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
              \\"\\"\\"
              Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ActorSort!]
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
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
              actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
              actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              id: ID
            }

            type MovieActorActorsAggregationSelection {
              count: Int!
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsNodeAggregateSelection {
              name: StringAggregateSelectionNullable!
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

            type MovieActorsConnection {
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorsConnectionSort {
              node: ActorSort
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

            type MovieActorsRelationship {
              cursor: String!
              node: Actor!
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
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort!]
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
              OR: [MovieWhere!]
              actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
              actorsAggregate: MovieActorsAggregateInput
              actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
              actorsConnection_ALL: MovieActorsConnectionWhere
              actorsConnection_NONE: MovieActorsConnectionWhere
              actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
              actorsConnection_SINGLE: MovieActorsConnectionWhere
              actorsConnection_SOME: MovieActorsConnectionWhere
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere
              actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
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
            }"
        `);
    });

    test("Single Relationship With Multiple Types with Unique ID On Relationship", () => {
        const typeDefs = gql`
            type Actor {
                id: ID! @id
                name: String
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN|ACTING_IN", direction: IN)
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
            id: ID!
            name: String
          }

          type ActorAggregateSelection {
            count: Int!
            id: IDAggregateSelectionNonNullable!
            name: StringAggregateSelectionNullable!
          }

          input ActorConnectOrCreateWhere {
            node: ActorUniqueWhere!
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
            \\"\\"\\"
            Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
            \\"\\"\\"
            sort: [ActorSort!]
          }

          \\"\\"\\"
          Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
          \\"\\"\\"
          input ActorSort {
            id: SortDirection
            name: SortDirection
          }

          input ActorUniqueWhere {
            id: ID
          }

          input ActorUpdateInput {
            name: String
          }

          input ActorWhere {
            AND: [ActorWhere!]
            OR: [ActorWhere!]
            id: ID
            id_CONTAINS: ID
            id_ENDS_WITH: ID
            id_IN: [ID!]
            id_NOT: ID
            id_NOT_CONTAINS: ID
            id_NOT_ENDS_WITH: ID
            id_NOT_IN: [ID!]
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

          type IDAggregateSelectionNullable {
            longest: ID
            shortest: ID
          }

          type Movie {
            actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
            actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
            actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
            id: ID
          }

          type MovieActorActorsAggregationSelection {
            count: Int!
            node: MovieActorActorsNodeAggregateSelection
          }

          type MovieActorActorsNodeAggregateSelection {
            id: IDAggregateSelectionNonNullable!
            name: StringAggregateSelectionNullable!
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
            edge: MovieActorsRelationshipCreateInput!
            where: ActorConnectWhere
          }

          input MovieActorsConnectOrCreateFieldInput {
            onCreate: MovieActorsConnectOrCreateFieldInputOnCreate!
            where: ActorConnectOrCreateWhere!
          }

          input MovieActorsConnectOrCreateFieldInputOnCreate {
            edge: MovieActorsRelationshipCreateInput!
            node: ActorCreateInput!
          }

          type MovieActorsConnection {
            edges: [MovieActorsRelationship!]!
            pageInfo: PageInfo!
            totalCount: Int!
          }

          input MovieActorsConnectionSort {
            node: ActorSort
          }

          input MovieActorsConnectionWhere {
            AND: [MovieActorsConnectionWhere!]
            OR: [MovieActorsConnectionWhere!]
            edge: MovieActorsRelationshipWhere
            edge_NOT: MovieActorsRelationshipWhere
            node: ActorWhere
            node_NOT: ActorWhere
          }

          input MovieActorsCreateFieldInput {
            edge: MovieActorsRelationshipCreateInput!
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
            connectOrCreate: [MovieActorsConnectOrCreateFieldInput!]
            create: [MovieActorsCreateFieldInput!]
          }

          input MovieActorsNodeAggregationWhereInput {
            AND: [MovieActorsNodeAggregationWhereInput!]
            OR: [MovieActorsNodeAggregationWhereInput!]
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

          type MovieActorsRelationship {
            _type: MovieActorsRelationshipType!
            cursor: String!
            node: Actor!
          }

          input MovieActorsRelationshipCreateInput {
            _type: MovieActorsRelationshipType!
          }

          enum MovieActorsRelationshipType {
            ACTED_IN
            ACTING_IN
          }

          input MovieActorsRelationshipWhere {
            _type: MovieActorsRelationshipType
          }

          input MovieActorsUpdateConnectionInput {
            node: ActorUpdateInput
          }

          input MovieActorsUpdateFieldInput {
            connect: [MovieActorsConnectFieldInput!]
            connectOrCreate: [MovieActorsConnectOrCreateFieldInput!]
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

          input MovieConnectOrCreateInput {
            actors: [MovieActorsConnectOrCreateFieldInput!]
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
            \\"\\"\\"
            Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
            \\"\\"\\"
            sort: [MovieSort!]
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
            OR: [MovieWhere!]
            actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
            actorsAggregate: MovieActorsAggregateInput
            actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
            actorsConnection_ALL: MovieActorsConnectionWhere
            actorsConnection_NONE: MovieActorsConnectionWhere
            actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
            actorsConnection_SINGLE: MovieActorsConnectionWhere
            actorsConnection_SOME: MovieActorsConnectionWhere
            \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
            actors_ALL: ActorWhere
            \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
            actors_NONE: ActorWhere
            actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
            \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
            actors_SINGLE: ActorWhere
            \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
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
            updateMovies(connect: MovieConnectInput, connectOrCreate: MovieConnectOrCreateInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
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
          }"
      `);
    });

    test("Multi Relationship", () => {
        const typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
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
            movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
            moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
            moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
            name: String
          }

          type ActorAggregateSelection {
            count: Int!
            name: StringAggregateSelectionNullable!
          }

          input ActorConnectInput {
            movies: [ActorMoviesConnectFieldInput!]
          }

          input ActorConnectWhere {
            node: ActorWhere!
          }

          input ActorCreateInput {
            movies: ActorMoviesFieldInput
            name: String
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
            id: IDAggregateSelectionNullable!
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
            connect: [MovieConnectInput!]
            where: MovieConnectWhere
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
            delete: MovieDeleteInput
            where: ActorMoviesConnectionWhere
          }

          input ActorMoviesDisconnectFieldInput {
            disconnect: MovieDisconnectInput
            where: ActorMoviesConnectionWhere
          }

          input ActorMoviesFieldInput {
            connect: [ActorMoviesConnectFieldInput!]
            create: [ActorMoviesCreateFieldInput!]
          }

          input ActorMoviesNodeAggregationWhereInput {
            AND: [ActorMoviesNodeAggregationWhereInput!]
            OR: [ActorMoviesNodeAggregationWhereInput!]
            id_EQUAL: ID
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
            OR: [ActorWhere!]
            movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
            moviesAggregate: ActorMoviesAggregateInput
            moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
            moviesConnection_ALL: ActorMoviesConnectionWhere
            moviesConnection_NONE: ActorMoviesConnectionWhere
            moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
            moviesConnection_SINGLE: ActorMoviesConnectionWhere
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
            actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
            actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
            actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
            id: ID
          }

          type MovieActorActorsAggregationSelection {
            count: Int!
            node: MovieActorActorsNodeAggregateSelection
          }

          type MovieActorActorsNodeAggregateSelection {
            name: StringAggregateSelectionNullable!
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
            connect: [ActorConnectInput!]
            where: ActorConnectWhere
          }

          type MovieActorsConnection {
            edges: [MovieActorsRelationship!]!
            pageInfo: PageInfo!
            totalCount: Int!
          }

          input MovieActorsConnectionSort {
            node: ActorSort
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
            delete: ActorDeleteInput
            where: MovieActorsConnectionWhere
          }

          input MovieActorsDisconnectFieldInput {
            disconnect: ActorDisconnectInput
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

          type MovieActorsRelationship {
            cursor: String!
            node: Actor!
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

          input MovieConnectWhere {
            node: MovieWhere!
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
            \\"\\"\\"
            Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
            \\"\\"\\"
            sort: [MovieSort!]
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
            OR: [MovieWhere!]
            actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
            actorsAggregate: MovieActorsAggregateInput
            actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
            actorsConnection_ALL: MovieActorsConnectionWhere
            actorsConnection_NONE: MovieActorsConnectionWhere
            actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
            actorsConnection_SINGLE: MovieActorsConnectionWhere
            actorsConnection_SOME: MovieActorsConnectionWhere
            \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
            actors_ALL: ActorWhere
            \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
            actors_NONE: ActorWhere
            actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
            \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
            actors_SINGLE: ActorWhere
            \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
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
            deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
            deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
            updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
            updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
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
          }"
      `);
    });

    test("Multi Relationship With Multiple Types", () => {
        const typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN|ACTING_IN", direction: OUT)
            }

            type Movie {
                id: ID
                currentActors: [Actor!]! @relationship(type: "ACTING_IN", direction: IN)
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
            movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
            moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
            moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
            name: String
          }

          type ActorAggregateSelection {
            count: Int!
            name: StringAggregateSelectionNullable!
          }

          input ActorConnectInput {
            movies: [ActorMoviesConnectFieldInput!]
          }

          input ActorConnectWhere {
            node: ActorWhere!
          }

          input ActorCreateInput {
            movies: ActorMoviesFieldInput
            name: String
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
            id: IDAggregateSelectionNullable!
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
            connect: [MovieConnectInput!]
            edge: ActorMoviesRelationshipCreateInput!
            where: MovieConnectWhere
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
            edge: ActorMoviesRelationshipWhere
            edge_NOT: ActorMoviesRelationshipWhere
            node: MovieWhere
            node_NOT: MovieWhere
          }

          input ActorMoviesCreateFieldInput {
            edge: ActorMoviesRelationshipCreateInput!
            node: MovieCreateInput!
          }

          input ActorMoviesDeleteFieldInput {
            delete: MovieDeleteInput
            where: ActorMoviesConnectionWhere
          }

          input ActorMoviesDisconnectFieldInput {
            disconnect: MovieDisconnectInput
            where: ActorMoviesConnectionWhere
          }

          input ActorMoviesFieldInput {
            connect: [ActorMoviesConnectFieldInput!]
            create: [ActorMoviesCreateFieldInput!]
          }

          input ActorMoviesNodeAggregationWhereInput {
            AND: [ActorMoviesNodeAggregationWhereInput!]
            OR: [ActorMoviesNodeAggregationWhereInput!]
            id_EQUAL: ID
          }

          type ActorMoviesRelationship {
            _type: ActorMoviesRelationshipType!
            cursor: String!
            node: Movie!
          }
          
          input ActorMoviesRelationshipCreateInput {
            _type: ActorMoviesRelationshipType!
          }

          enum ActorMoviesRelationshipType {
            ACTED_IN
            ACTING_IN
          }

          input ActorMoviesRelationshipWhere {
            _type: ActorMoviesRelationshipType
          }

          input ActorMoviesUpdateConnectionInput {
            node: MovieUpdateInput
          }

          input ActorMoviesUpdateFieldInput {
            connect: [ActorMoviesConnectFieldInput!]
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
            OR: [ActorWhere!]
            movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
            moviesAggregate: ActorMoviesAggregateInput
            moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
            moviesConnection_ALL: ActorMoviesConnectionWhere
            moviesConnection_NONE: ActorMoviesConnectionWhere
            moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
            moviesConnection_SINGLE: ActorMoviesConnectionWhere
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
            currentActors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
            currentActorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorCurrentActorsAggregationSelection
            currentActorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieCurrentActorsConnectionSort!], where: MovieCurrentActorsConnectionWhere): MovieCurrentActorsConnection!
            id: ID
          }

          type MovieActorCurrentActorsAggregationSelection {
            count: Int!
            node: MovieActorCurrentActorsNodeAggregateSelection
          }

          type MovieActorCurrentActorsNodeAggregateSelection {
            name: StringAggregateSelectionNullable!
          }

          type MovieAggregateSelection {
            count: Int!
            id: IDAggregateSelectionNullable!
          }

          input MovieConnectInput {
            currentActors: [MovieCurrentActorsConnectFieldInput!]
          }

          input MovieConnectWhere {
            node: MovieWhere!
          }

          input MovieCreateInput {
            currentActors: MovieCurrentActorsFieldInput
            id: ID
          }

          input MovieCurrentActorsAggregateInput {
            AND: [MovieCurrentActorsAggregateInput!]
            OR: [MovieCurrentActorsAggregateInput!]
            count: Int
            count_GT: Int
            count_GTE: Int
            count_LT: Int
            count_LTE: Int
            node: MovieCurrentActorsNodeAggregationWhereInput
          }

          input MovieCurrentActorsConnectFieldInput {
            connect: [ActorConnectInput!]
            where: ActorConnectWhere
          }

          type MovieCurrentActorsConnection {
            edges: [MovieCurrentActorsRelationship!]!
            pageInfo: PageInfo!
            totalCount: Int!
          }

          input MovieCurrentActorsConnectionSort {
            node: ActorSort
          }

          input MovieCurrentActorsConnectionWhere {
            AND: [MovieCurrentActorsConnectionWhere!]
            OR: [MovieCurrentActorsConnectionWhere!]
            node: ActorWhere
            node_NOT: ActorWhere
          }

          input MovieCurrentActorsCreateFieldInput {
            node: ActorCreateInput!
          }

          input MovieCurrentActorsDeleteFieldInput {
            delete: ActorDeleteInput
            where: MovieCurrentActorsConnectionWhere
          }

          input MovieCurrentActorsDisconnectFieldInput {
            disconnect: ActorDisconnectInput
            where: MovieCurrentActorsConnectionWhere
          }

          input MovieCurrentActorsFieldInput {
            connect: [MovieCurrentActorsConnectFieldInput!]
            create: [MovieCurrentActorsCreateFieldInput!]
          }

          input MovieCurrentActorsNodeAggregationWhereInput {
            AND: [MovieCurrentActorsNodeAggregationWhereInput!]
            OR: [MovieCurrentActorsNodeAggregationWhereInput!]
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

          type MovieCurrentActorsRelationship {
            cursor: String!
            node: Actor!
          }

          input MovieCurrentActorsUpdateConnectionInput {
            node: ActorUpdateInput
          }

          input MovieCurrentActorsUpdateFieldInput {
            connect: [MovieCurrentActorsConnectFieldInput!]
            create: [MovieCurrentActorsCreateFieldInput!]
            delete: [MovieCurrentActorsDeleteFieldInput!]
            disconnect: [MovieCurrentActorsDisconnectFieldInput!]
            update: MovieCurrentActorsUpdateConnectionInput
            where: MovieCurrentActorsConnectionWhere
          }

          input MovieDeleteInput {
            currentActors: [MovieCurrentActorsDeleteFieldInput!]
          }

          input MovieDisconnectInput {
            currentActors: [MovieCurrentActorsDisconnectFieldInput!]
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
            currentActors: [MovieCurrentActorsCreateFieldInput!]
          }

          \\"\\"\\"
          Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
          \\"\\"\\"
          input MovieSort {
            id: SortDirection
          }

          input MovieUpdateInput {
            currentActors: [MovieCurrentActorsUpdateFieldInput!]
            id: ID
          }

          input MovieWhere {
            AND: [MovieWhere!]
            OR: [MovieWhere!]
            currentActors: ActorWhere @deprecated(reason: \\"Use \`currentActors_SOME\` instead.\\")
            currentActorsAggregate: MovieCurrentActorsAggregateInput
            currentActorsConnection: MovieCurrentActorsConnectionWhere @deprecated(reason: \\"Use \`currentActorsConnection_SOME\` instead.\\")
            currentActorsConnection_ALL: MovieCurrentActorsConnectionWhere
            currentActorsConnection_NONE: MovieCurrentActorsConnectionWhere
            currentActorsConnection_NOT: MovieCurrentActorsConnectionWhere @deprecated(reason: \\"Use \`currentActorsConnection_NONE\` instead.\\")
            currentActorsConnection_SINGLE: MovieCurrentActorsConnectionWhere
            currentActorsConnection_SOME: MovieCurrentActorsConnectionWhere
            \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
            currentActors_ALL: ActorWhere
            \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
            currentActors_NONE: ActorWhere
            currentActors_NOT: ActorWhere @deprecated(reason: \\"Use \`currentActors_NONE\` instead.\\")
            \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
            currentActors_SINGLE: ActorWhere
            \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
            currentActors_SOME: ActorWhere
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
            deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
            deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
            updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
            updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
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
          }"
    `);
    });

    test("Multi Relationship With Multiple Types - Union", () => {
        const typeDefs = gql`
            union Person = Director | Actor

            type Director {
                name: String
                directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                director: Director! @relationship(type: "DIRECTED", direction: IN)
                people: [Person!]! @relationship(type: "DIRECTED|ACTED_IN", direction: IN)
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
            movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
            moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
            moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
            name: String
          }

          type ActorAggregateSelection {
            count: Int!
            name: StringAggregateSelectionNullable!
          }

          input ActorConnectInput {
            movies: [ActorMoviesConnectFieldInput!]
          }

          input ActorConnectWhere {
            node: ActorWhere!
          }

          input ActorCreateInput {
            movies: ActorMoviesFieldInput
            name: String
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
            id: IDAggregateSelectionNullable!
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
            connect: [MovieConnectInput!]
            where: MovieConnectWhere
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
            delete: MovieDeleteInput
            where: ActorMoviesConnectionWhere
          }

          input ActorMoviesDisconnectFieldInput {
            disconnect: MovieDisconnectInput
            where: ActorMoviesConnectionWhere
          }

          input ActorMoviesFieldInput {
            connect: [ActorMoviesConnectFieldInput!]
            create: [ActorMoviesCreateFieldInput!]
          }

          input ActorMoviesNodeAggregationWhereInput {
            AND: [ActorMoviesNodeAggregationWhereInput!]
            OR: [ActorMoviesNodeAggregationWhereInput!]
            id_EQUAL: ID
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
            OR: [ActorWhere!]
            movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
            moviesAggregate: ActorMoviesAggregateInput
            moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
            moviesConnection_ALL: ActorMoviesConnectionWhere
            moviesConnection_NONE: ActorMoviesConnectionWhere
            moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
            moviesConnection_SINGLE: ActorMoviesConnectionWhere
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

          type CreateDirectorsMutationResponse {
            directors: [Director!]!
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

          type Director {
            directed(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
            directedAggregate(directed: Boolean = true, where: MovieWhere): DirectorMovieDirectedAggregationSelection
            directedConnection(after: String, directed: Boolean = true, first: Int, sort: [DirectorDirectedConnectionSort!], where: DirectorDirectedConnectionWhere): DirectorDirectedConnection!
            name: String
          }

          type DirectorAggregateSelection {
            count: Int!
            name: StringAggregateSelectionNullable!
          }

          input DirectorConnectInput {
            directed: [DirectorDirectedConnectFieldInput!]
          }

          input DirectorConnectWhere {
            node: DirectorWhere!
          }

          input DirectorCreateInput {
            directed: DirectorDirectedFieldInput
            name: String
          }

          input DirectorDeleteInput {
            directed: [DirectorDirectedDeleteFieldInput!]
          }

          input DirectorDirectedAggregateInput {
            AND: [DirectorDirectedAggregateInput!]
            OR: [DirectorDirectedAggregateInput!]
            count: Int
            count_GT: Int
            count_GTE: Int
            count_LT: Int
            count_LTE: Int
            node: DirectorDirectedNodeAggregationWhereInput
          }

          input DirectorDirectedConnectFieldInput {
            connect: [MovieConnectInput!]
            where: MovieConnectWhere
          }

          type DirectorDirectedConnection {
            edges: [DirectorDirectedRelationship!]!
            pageInfo: PageInfo!
            totalCount: Int!
          }

          input DirectorDirectedConnectionSort {
            node: MovieSort
          }

          input DirectorDirectedConnectionWhere {
            AND: [DirectorDirectedConnectionWhere!]
            OR: [DirectorDirectedConnectionWhere!]
            node: MovieWhere
            node_NOT: MovieWhere
          }

          input DirectorDirectedCreateFieldInput {
            node: MovieCreateInput!
          }

          input DirectorDirectedDeleteFieldInput {
            delete: MovieDeleteInput
            where: DirectorDirectedConnectionWhere
          }

          input DirectorDirectedDisconnectFieldInput {
            disconnect: MovieDisconnectInput
            where: DirectorDirectedConnectionWhere
          }

          input DirectorDirectedFieldInput {
            connect: [DirectorDirectedConnectFieldInput!]
            create: [DirectorDirectedCreateFieldInput!]
          }

          input DirectorDirectedNodeAggregationWhereInput {
            AND: [DirectorDirectedNodeAggregationWhereInput!]
            OR: [DirectorDirectedNodeAggregationWhereInput!]
            id_EQUAL: ID
          }

          type DirectorDirectedRelationship {
            cursor: String!
            node: Movie!
          }

          input DirectorDirectedUpdateConnectionInput {
            node: MovieUpdateInput
          }

          input DirectorDirectedUpdateFieldInput {
            connect: [DirectorDirectedConnectFieldInput!]
            create: [DirectorDirectedCreateFieldInput!]
            delete: [DirectorDirectedDeleteFieldInput!]
            disconnect: [DirectorDirectedDisconnectFieldInput!]
            update: DirectorDirectedUpdateConnectionInput
            where: DirectorDirectedConnectionWhere
          }

          input DirectorDisconnectInput {
            directed: [DirectorDirectedDisconnectFieldInput!]
          }

          type DirectorMovieDirectedAggregationSelection {
            count: Int!
            node: DirectorMovieDirectedNodeAggregateSelection
          }

          type DirectorMovieDirectedNodeAggregateSelection {
            id: IDAggregateSelectionNullable!
          }

          input DirectorOptions {
            limit: Int
            offset: Int
            \\"\\"\\"
            Specify one or more DirectorSort objects to sort Directors by. The sorts will be applied in the order in which they are arranged in the array.
            \\"\\"\\"
            sort: [DirectorSort!]
          }

          input DirectorRelationInput {
            directed: [DirectorDirectedCreateFieldInput!]
          }

          \\"\\"\\"
          Fields to sort Directors by. The order in which sorts are applied is not guaranteed when specifying many fields in one DirectorSort object.
          \\"\\"\\"
          input DirectorSort {
            name: SortDirection
          }

          input DirectorUpdateInput {
            directed: [DirectorDirectedUpdateFieldInput!]
            name: String
          }

          input DirectorWhere {
            AND: [DirectorWhere!]
            OR: [DirectorWhere!]
            directed: MovieWhere @deprecated(reason: \\"Use \`directed_SOME\` instead.\\")
            directedAggregate: DirectorDirectedAggregateInput
            directedConnection: DirectorDirectedConnectionWhere @deprecated(reason: \\"Use \`directedConnection_SOME\` instead.\\")
            directedConnection_ALL: DirectorDirectedConnectionWhere
            directedConnection_NONE: DirectorDirectedConnectionWhere
            directedConnection_NOT: DirectorDirectedConnectionWhere @deprecated(reason: \\"Use \`directedConnection_NONE\` instead.\\")
            directedConnection_SINGLE: DirectorDirectedConnectionWhere
            directedConnection_SOME: DirectorDirectedConnectionWhere
            \\"\\"\\"Return Directors where all of the related Movies match this filter\\"\\"\\"
            directed_ALL: MovieWhere
            \\"\\"\\"Return Directors where none of the related Movies match this filter\\"\\"\\"
            directed_NONE: MovieWhere
            directed_NOT: MovieWhere @deprecated(reason: \\"Use \`directed_NONE\` instead.\\")
            \\"\\"\\"Return Directors where one of the related Movies match this filter\\"\\"\\"
            directed_SINGLE: MovieWhere
            \\"\\"\\"Return Directors where some of the related Movies match this filter\\"\\"\\"
            directed_SOME: MovieWhere
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

          type IDAggregateSelectionNullable {
            longest: ID
            shortest: ID
          }

          type Movie {
            actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
            actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
            actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
            director(directed: Boolean = true, options: DirectorOptions, where: DirectorWhere): Director!
            directorAggregate(directed: Boolean = true, where: DirectorWhere): MovieDirectorDirectorAggregationSelection
            directorConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieDirectorConnectionSort!], where: MovieDirectorConnectionWhere): MovieDirectorConnection!
            id: ID
            people(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
            peopleConnection(after: String, directed: Boolean = true, first: Int, where: MoviePeopleConnectionWhere): MoviePeopleConnection!
          }

          type MovieActorActorsAggregationSelection {
            count: Int!
            node: MovieActorActorsNodeAggregateSelection
          }

          type MovieActorActorsNodeAggregateSelection {
            name: StringAggregateSelectionNullable!
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
            connect: [ActorConnectInput!]
            where: ActorConnectWhere
          }

          type MovieActorsConnection {
            edges: [MovieActorsRelationship!]!
            pageInfo: PageInfo!
            totalCount: Int!
          }

          input MovieActorsConnectionSort {
            node: ActorSort
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
            delete: ActorDeleteInput
            where: MovieActorsConnectionWhere
          }

          input MovieActorsDisconnectFieldInput {
            disconnect: ActorDisconnectInput
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

          type MovieActorsRelationship {
            cursor: String!
            node: Actor!
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
            director: MovieDirectorConnectFieldInput
            people: MoviePeopleConnectInput
          }

          input MovieConnectWhere {
            node: MovieWhere!
          }

          input MovieCreateInput {
            actors: MovieActorsFieldInput
            director: MovieDirectorFieldInput
            id: ID
            people: MoviePeopleCreateInput
          }

          input MovieDeleteInput {
            actors: [MovieActorsDeleteFieldInput!]
            director: MovieDirectorDeleteFieldInput
            people: MoviePeopleDeleteInput
          }

          input MovieDirectorAggregateInput {
            AND: [MovieDirectorAggregateInput!]
            OR: [MovieDirectorAggregateInput!]
            count: Int
            count_GT: Int
            count_GTE: Int
            count_LT: Int
            count_LTE: Int
            node: MovieDirectorNodeAggregationWhereInput
          }

          input MovieDirectorConnectFieldInput {
            connect: DirectorConnectInput
            where: DirectorConnectWhere
          }

          type MovieDirectorConnection {
            edges: [MovieDirectorRelationship!]!
            pageInfo: PageInfo!
            totalCount: Int!
          }

          input MovieDirectorConnectionSort {
            node: DirectorSort
          }

          input MovieDirectorConnectionWhere {
            AND: [MovieDirectorConnectionWhere!]
            OR: [MovieDirectorConnectionWhere!]
            node: DirectorWhere
            node_NOT: DirectorWhere
          }

          input MovieDirectorCreateFieldInput {
            node: DirectorCreateInput!
          }

          input MovieDirectorDeleteFieldInput {
            delete: DirectorDeleteInput
            where: MovieDirectorConnectionWhere
          }

          type MovieDirectorDirectorAggregationSelection {
            count: Int!
            node: MovieDirectorDirectorNodeAggregateSelection
          }

          type MovieDirectorDirectorNodeAggregateSelection {
            name: StringAggregateSelectionNullable!
          }

          input MovieDirectorDisconnectFieldInput {
            disconnect: DirectorDisconnectInput
            where: MovieDirectorConnectionWhere
          }

          input MovieDirectorFieldInput {
            connect: MovieDirectorConnectFieldInput
            create: MovieDirectorCreateFieldInput
          }

          input MovieDirectorNodeAggregationWhereInput {
            AND: [MovieDirectorNodeAggregationWhereInput!]
            OR: [MovieDirectorNodeAggregationWhereInput!]
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

          type MovieDirectorRelationship {
            cursor: String!
            node: Director!
          }

          input MovieDirectorUpdateConnectionInput {
            node: DirectorUpdateInput
          }

          input MovieDirectorUpdateFieldInput {
            connect: MovieDirectorConnectFieldInput
            create: MovieDirectorCreateFieldInput
            delete: MovieDirectorDeleteFieldInput
            disconnect: MovieDirectorDisconnectFieldInput
            update: MovieDirectorUpdateConnectionInput
            where: MovieDirectorConnectionWhere
          }

          input MovieDisconnectInput {
            actors: [MovieActorsDisconnectFieldInput!]
            director: MovieDirectorDisconnectFieldInput
            people: MoviePeopleDisconnectInput
          }

          input MovieOptions {
            limit: Int
            offset: Int
            \\"\\"\\"
            Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
            \\"\\"\\"
            sort: [MovieSort!]
          }

          input MoviePeopleActorConnectFieldInput {
            connect: [ActorConnectInput!]
            edge: MoviePeopleRelationshipCreateInput!
            where: ActorConnectWhere
          }

          input MoviePeopleActorConnectionWhere {
            AND: [MoviePeopleActorConnectionWhere!]
            OR: [MoviePeopleActorConnectionWhere!]
            edge: MoviePeopleRelationshipWhere
            edge_NOT: MoviePeopleRelationshipWhere
            node: ActorWhere
            node_NOT: ActorWhere
          }

          input MoviePeopleActorCreateFieldInput {
            edge: MoviePeopleRelationshipCreateInput!
            node: ActorCreateInput!
          }

          input MoviePeopleActorDeleteFieldInput {
            delete: ActorDeleteInput
            where: MoviePeopleActorConnectionWhere
          }

          input MoviePeopleActorDisconnectFieldInput {
            disconnect: ActorDisconnectInput
            where: MoviePeopleActorConnectionWhere
          }

          input MoviePeopleActorFieldInput {
            connect: [MoviePeopleActorConnectFieldInput!]
            create: [MoviePeopleActorCreateFieldInput!]
          }

          input MoviePeopleActorUpdateConnectionInput {
            node: ActorUpdateInput
          }

          input MoviePeopleActorUpdateFieldInput {
            connect: [MoviePeopleActorConnectFieldInput!]
            create: [MoviePeopleActorCreateFieldInput!]
            delete: [MoviePeopleActorDeleteFieldInput!]
            disconnect: [MoviePeopleActorDisconnectFieldInput!]
            update: MoviePeopleActorUpdateConnectionInput
            where: MoviePeopleActorConnectionWhere
          }

          input MoviePeopleConnectInput {
            Actor: [MoviePeopleActorConnectFieldInput!]
            Director: [MoviePeopleDirectorConnectFieldInput!]
          }

          type MoviePeopleConnection {
            edges: [MoviePeopleRelationship!]!
            pageInfo: PageInfo!
            totalCount: Int!
          }

          input MoviePeopleConnectionWhere {
            Actor: MoviePeopleActorConnectionWhere
            Director: MoviePeopleDirectorConnectionWhere
          }

          input MoviePeopleCreateFieldInput {
            Actor: [MoviePeopleActorCreateFieldInput!]
            Director: [MoviePeopleDirectorCreateFieldInput!]
          }

          input MoviePeopleCreateInput {
            Actor: MoviePeopleActorFieldInput
            Director: MoviePeopleDirectorFieldInput
          }

          input MoviePeopleDeleteInput {
            Actor: [MoviePeopleActorDeleteFieldInput!]
            Director: [MoviePeopleDirectorDeleteFieldInput!]
          }

          input MoviePeopleDirectorConnectFieldInput {
            connect: [DirectorConnectInput!]
            edge: MoviePeopleRelationshipCreateInput!
            where: DirectorConnectWhere
          }

          input MoviePeopleDirectorConnectionWhere {
            AND: [MoviePeopleDirectorConnectionWhere!]
            OR: [MoviePeopleDirectorConnectionWhere!]
            edge: MoviePeopleRelationshipWhere
            edge_NOT: MoviePeopleRelationshipWhere
            node: DirectorWhere
            node_NOT: DirectorWhere
          }

          input MoviePeopleDirectorCreateFieldInput {
            edge: MoviePeopleRelationshipCreateInput!
            node: DirectorCreateInput!
          }

          input MoviePeopleDirectorDeleteFieldInput {
            delete: DirectorDeleteInput
            where: MoviePeopleDirectorConnectionWhere
          }

          input MoviePeopleDirectorDisconnectFieldInput {
            disconnect: DirectorDisconnectInput
            where: MoviePeopleDirectorConnectionWhere
          }

          input MoviePeopleDirectorFieldInput {
            connect: [MoviePeopleDirectorConnectFieldInput!]
            create: [MoviePeopleDirectorCreateFieldInput!]
          }

          input MoviePeopleDirectorUpdateConnectionInput {
            node: DirectorUpdateInput
          }

          input MoviePeopleDirectorUpdateFieldInput {
            connect: [MoviePeopleDirectorConnectFieldInput!]
            create: [MoviePeopleDirectorCreateFieldInput!]
            delete: [MoviePeopleDirectorDeleteFieldInput!]
            disconnect: [MoviePeopleDirectorDisconnectFieldInput!]
            update: MoviePeopleDirectorUpdateConnectionInput
            where: MoviePeopleDirectorConnectionWhere
          }

          input MoviePeopleDisconnectInput {
            Actor: [MoviePeopleActorDisconnectFieldInput!]
            Director: [MoviePeopleDirectorDisconnectFieldInput!]
          }

          type MoviePeopleRelationship {
            _type: MoviePeopleRelationshipType
            cursor: String!
            node: Person!
          }

          input MoviePeopleRelationshipCreateInput {
            _type: MoviePeopleRelationshipType!
          }

          enum MoviePeopleRelationshipType {
            ACTED_IN
            DIRECTED
          }

          input MoviePeopleRelationshipWhere {
            _type: MoviePeopleRelationshipType
          }

          input MoviePeopleUpdateInput {
            Actor: [MoviePeopleActorUpdateFieldInput!]
            Director: [MoviePeopleDirectorUpdateFieldInput!]
          }

          input MovieRelationInput {
            actors: [MovieActorsCreateFieldInput!]
            director: MovieDirectorCreateFieldInput
            people: MoviePeopleCreateFieldInput
          }

          \\"\\"\\"
          Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
          \\"\\"\\"
          input MovieSort {
            id: SortDirection
          }

          input MovieUpdateInput {
            actors: [MovieActorsUpdateFieldInput!]
            director: MovieDirectorUpdateFieldInput
            id: ID
            people: MoviePeopleUpdateInput
          }

          input MovieWhere {
            AND: [MovieWhere!]
            OR: [MovieWhere!]
            actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
            actorsAggregate: MovieActorsAggregateInput
            actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
            actorsConnection_ALL: MovieActorsConnectionWhere
            actorsConnection_NONE: MovieActorsConnectionWhere
            actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
            actorsConnection_SINGLE: MovieActorsConnectionWhere
            actorsConnection_SOME: MovieActorsConnectionWhere
            \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
            actors_ALL: ActorWhere
            \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
            actors_NONE: ActorWhere
            actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
            \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
            actors_SINGLE: ActorWhere
            \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
            actors_SOME: ActorWhere
            director: DirectorWhere
            directorAggregate: MovieDirectorAggregateInput
            directorConnection: MovieDirectorConnectionWhere
            directorConnection_NOT: MovieDirectorConnectionWhere
            director_NOT: DirectorWhere
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
            peopleConnection: MoviePeopleConnectionWhere @deprecated(reason: \\"Use \`peopleConnection_SOME\` instead.\\")
            peopleConnection_ALL: MoviePeopleConnectionWhere
            peopleConnection_NONE: MoviePeopleConnectionWhere
            peopleConnection_NOT: MoviePeopleConnectionWhere @deprecated(reason: \\"Use \`peopleConnection_NONE\` instead.\\")
            peopleConnection_SINGLE: MoviePeopleConnectionWhere
            peopleConnection_SOME: MoviePeopleConnectionWhere
          }

          type Mutation {
            createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
            createDirectors(input: [DirectorCreateInput!]!): CreateDirectorsMutationResponse!
            createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
            deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
            deleteDirectors(delete: DirectorDeleteInput, where: DirectorWhere): DeleteInfo!
            deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
            updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
            updateDirectors(connect: DirectorConnectInput, create: DirectorRelationInput, delete: DirectorDeleteInput, disconnect: DirectorDisconnectInput, update: DirectorUpdateInput, where: DirectorWhere): UpdateDirectorsMutationResponse!
            updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
          }

          \\"\\"\\"Pagination information (Relay)\\"\\"\\"
          type PageInfo {
            endCursor: String
            hasNextPage: Boolean!
            hasPreviousPage: Boolean!
            startCursor: String
          }

          union Person = Actor | Director

          input PersonWhere {
            Actor: ActorWhere
            Director: DirectorWhere
          }

          type Query {
            actors(options: ActorOptions, where: ActorWhere): [Actor!]!
            actorsAggregate(where: ActorWhere): ActorAggregateSelection!
            directors(options: DirectorOptions, where: DirectorWhere): [Director!]!
            directorsAggregate(where: DirectorWhere): DirectorAggregateSelection!
            movies(options: MovieOptions, where: MovieWhere): [Movie!]!
            moviesAggregate(where: MovieWhere): MovieAggregateSelection!
          }

          input QueryOptions {
            limit: Int
            offset: Int
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

          type UpdateDirectorsMutationResponse {
            directors: [Director!]!
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
          }"
    `);
    });
});
