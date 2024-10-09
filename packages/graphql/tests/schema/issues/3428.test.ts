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

describe("Relationship nested operations", () => {
    test("Single relationship to type with unique field with no nested operation specified", async () => {
        const typeDefs = gql`
            type Person @node {
                id: ID! @id @unique
                name: String
            }

            type Movie @node {
                id: ID
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [])
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
              actors(directed: Boolean = true, limit: Int, offset: Int, options: PersonOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [PersonSort!], where: PersonWhere): [Person!]!
              actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
              actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              id: ID
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count: Int @deprecated(reason: \\"Please use the explicit _EQ version\\")
              count_EQ: Int
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
              \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
              actors_SINGLE: PersonWhere
              \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
              actors_SOME: PersonWhere
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
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
              id: ID!
              name: String
            }

            type PersonAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
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
              id: SortDirection
              name: SortDirection
            }

            input PersonUpdateInput {
              name: String
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID!]
              id_STARTS_WITH: ID
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
              name_STARTS_WITH: String
            }

            type Query {
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, options: PersonOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [PersonSort!], where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
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

    test("Single relationship to union with unique fields with no nested operation specified", async () => {
        const typeDefs = gql`
            type PersonOne @node {
                name: String @unique
            }

            type PersonTwo @node {
                nameTwo: String @unique
            }

            union Person = PersonOne | PersonTwo

            type Movie @node {
                id: ID
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [])
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
              actors(directed: Boolean = true, limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: PersonWhere): [Person!]!
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
            }

            input MovieActorsPersonTwoConnectionWhere {
              AND: [MovieActorsPersonTwoConnectionWhere!]
              NOT: MovieActorsPersonTwoConnectionWhere
              OR: [MovieActorsPersonTwoConnectionWhere!]
              node: PersonTwoWhere
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
              \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
              actors_SINGLE: PersonWhere
              \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
              actors_SOME: PersonWhere
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
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
              name: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              name_CONTAINS: String
              name_ENDS_WITH: String
              name_EQ: String
              name_IN: [String]
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
              nameTwo: String @deprecated(reason: \\"Please use the explicit _EQ version\\")
              nameTwo_CONTAINS: String
              nameTwo_ENDS_WITH: String
              nameTwo_EQ: String
              nameTwo_IN: [String]
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
              movies(limit: Int, offset: Int, options: MovieOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, options: QueryOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), where: PersonWhere): [Person!]!
              personOnes(limit: Int, offset: Int, options: PersonOneOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
              personOnesAggregate(where: PersonOneWhere): PersonOneAggregateSelection!
              personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
              personTwos(limit: Int, offset: Int, options: PersonTwoOptions @deprecated(reason: \\"Query options argument is deprecated, please use pagination arguments like limit, offset and sort instead.\\"), sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
              personTwosAggregate(where: PersonTwoWhere): PersonTwoAggregateSelection!
              personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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
