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

describe("Connection with interfaces", () => {
    test("Interface with connect mutation", async () => {
        const typeDefs = gql`
            type Movie implements Production @subscription(events: []) {
                title: String!
                id: ID @unique
                director: [Creature!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type Series implements Production {
                title: String!
                episode: Int!
                id: ID @unique
                director: [Creature!]! @relationship(type: "DIRECTED", direction: IN)
            }

            interface Production {
                id: ID
                director: [Creature!]! @declareRelationship
            }

            type Person implements Creature {
                id: ID
                movies: Production! @relationship(type: "DIRECTED", direction: OUT)
            }

            interface Creature {
                id: ID
                movies: Production! @declareRelationship
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

            type CreateSeriesMutationResponse {
              info: CreateInfo!
              series: [Series!]!
            }

            interface Creature {
              id: ID
              movies(options: ProductionOptions, where: ProductionWhere): Production!
              moviesConnection(after: String, first: Int, sort: [CreatureMoviesConnectionSort!], where: CreatureMoviesConnectionWhere): CreatureMoviesConnection!
            }

            type CreatureAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
            }

            input CreatureConnectInput {
              movies: CreatureMoviesConnectFieldInput
            }

            input CreatureConnectWhere {
              node: CreatureWhere!
            }

            input CreatureCreateInput {
              Person: PersonCreateInput
            }

            input CreatureDeleteInput {
              movies: CreatureMoviesDeleteFieldInput
            }

            input CreatureDisconnectInput {
              movies: CreatureMoviesDisconnectFieldInput
            }

            type CreatureEdge {
              cursor: String!
              node: Creature!
            }

            enum CreatureImplementation {
              Person
            }

            input CreatureMoviesAggregateInput {
              AND: [CreatureMoviesAggregateInput!]
              NOT: CreatureMoviesAggregateInput
              OR: [CreatureMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: CreatureMoviesNodeAggregationWhereInput
            }

            input CreatureMoviesConnectFieldInput {
              connect: ProductionConnectInput
              where: ProductionConnectWhere
            }

            type CreatureMoviesConnection {
              edges: [CreatureMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input CreatureMoviesConnectionSort {
              node: ProductionSort
            }

            input CreatureMoviesConnectionWhere {
              AND: [CreatureMoviesConnectionWhere!]
              NOT: CreatureMoviesConnectionWhere
              OR: [CreatureMoviesConnectionWhere!]
              node: ProductionWhere
              node_NOT: ProductionWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input CreatureMoviesCreateFieldInput {
              node: ProductionCreateInput!
            }

            input CreatureMoviesDeleteFieldInput {
              delete: ProductionDeleteInput
              where: CreatureMoviesConnectionWhere
            }

            input CreatureMoviesDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: CreatureMoviesConnectionWhere
            }

            input CreatureMoviesNodeAggregationWhereInput {
              AND: [CreatureMoviesNodeAggregationWhereInput!]
              NOT: CreatureMoviesNodeAggregationWhereInput
              OR: [CreatureMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type CreatureMoviesRelationship {
              cursor: String!
              node: Production!
            }

            input CreatureMoviesUpdateConnectionInput {
              node: ProductionUpdateInput
            }

            input CreatureMoviesUpdateFieldInput {
              connect: CreatureMoviesConnectFieldInput
              create: CreatureMoviesCreateFieldInput
              delete: CreatureMoviesDeleteFieldInput
              disconnect: CreatureMoviesDisconnectFieldInput
              update: CreatureMoviesUpdateConnectionInput
              where: CreatureMoviesConnectionWhere
            }

            input CreatureOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more CreatureSort objects to sort Creatures by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [CreatureSort]
            }

            \\"\\"\\"
            Fields to sort Creatures by. The order in which sorts are applied is not guaranteed when specifying many fields in one CreatureSort object.
            \\"\\"\\"
            input CreatureSort {
              id: SortDirection
            }

            input CreatureUpdateInput {
              id: ID
              movies: CreatureMoviesUpdateFieldInput
            }

            input CreatureWhere {
              AND: [CreatureWhere!]
              NOT: CreatureWhere
              OR: [CreatureWhere!]
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
              movies: ProductionWhere
              moviesAggregate: CreatureMoviesAggregateInput
              moviesConnection: CreatureMoviesConnectionWhere
              moviesConnection_NOT: CreatureMoviesConnectionWhere
              movies_NOT: ProductionWhere
              typename_IN: [CreatureImplementation!]
            }

            type CreaturesConnection {
              edges: [CreatureEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            type Movie implements Production {
              director(directed: Boolean = true, options: CreatureOptions, where: CreatureWhere): [Creature!]!
              directorAggregate(directed: Boolean = true, where: CreatureWhere): MovieCreatureDirectorAggregationSelection
              directorConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionDirectorConnectionSort!], where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
              id: ID
              title: String!
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieConnectInput {
              director: [MovieDirectorConnectFieldInput!]
            }

            input MovieCreateInput {
              director: MovieDirectorFieldInput
              id: ID
              title: String!
            }

            type MovieCreatureDirectorAggregationSelection {
              count: Int!
              node: MovieCreatureDirectorNodeAggregateSelection
            }

            type MovieCreatureDirectorNodeAggregateSelection {
              id: IDAggregateSelection!
            }

            input MovieDeleteInput {
              director: [MovieDirectorDeleteFieldInput!]
            }

            input MovieDirectorAggregateInput {
              AND: [MovieDirectorAggregateInput!]
              NOT: MovieDirectorAggregateInput
              OR: [MovieDirectorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieDirectorNodeAggregationWhereInput
            }

            input MovieDirectorConnectFieldInput {
              connect: CreatureConnectInput
              where: CreatureConnectWhere
            }

            input MovieDirectorCreateFieldInput {
              node: CreatureCreateInput!
            }

            input MovieDirectorDeleteFieldInput {
              delete: CreatureDeleteInput
              where: ProductionDirectorConnectionWhere
            }

            input MovieDirectorDisconnectFieldInput {
              disconnect: CreatureDisconnectInput
              where: ProductionDirectorConnectionWhere
            }

            input MovieDirectorFieldInput {
              connect: [MovieDirectorConnectFieldInput!]
              create: [MovieDirectorCreateFieldInput!]
            }

            input MovieDirectorNodeAggregationWhereInput {
              AND: [MovieDirectorNodeAggregationWhereInput!]
              NOT: MovieDirectorNodeAggregationWhereInput
              OR: [MovieDirectorNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            input MovieDirectorUpdateConnectionInput {
              node: CreatureUpdateInput
            }

            input MovieDirectorUpdateFieldInput {
              connect: [MovieDirectorConnectFieldInput!]
              create: [MovieDirectorCreateFieldInput!]
              delete: [MovieDirectorDeleteFieldInput!]
              disconnect: [MovieDirectorDisconnectFieldInput!]
              update: MovieDirectorUpdateConnectionInput
              where: ProductionDirectorConnectionWhere
            }

            input MovieDisconnectInput {
              director: [MovieDirectorDisconnectFieldInput!]
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
              director: [MovieDirectorCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              director: [MovieDirectorUpdateFieldInput!]
              id: ID
              title: String
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              director: CreatureWhere @deprecated(reason: \\"Use \`director_SOME\` instead.\\")
              directorAggregate: MovieDirectorAggregateInput
              directorConnection: ProductionDirectorConnectionWhere @deprecated(reason: \\"Use \`directorConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Movies where all of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_ALL: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_NONE: ProductionDirectorConnectionWhere
              directorConnection_NOT: ProductionDirectorConnectionWhere @deprecated(reason: \\"Use \`directorConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Movies where one of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SINGLE: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SOME: ProductionDirectorConnectionWhere
              \\"\\"\\"Return Movies where all of the related Creatures match this filter\\"\\"\\"
              director_ALL: CreatureWhere
              \\"\\"\\"Return Movies where none of the related Creatures match this filter\\"\\"\\"
              director_NONE: CreatureWhere
              director_NOT: CreatureWhere @deprecated(reason: \\"Use \`director_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related Creatures match this filter\\"\\"\\"
              director_SINGLE: CreatureWhere
              \\"\\"\\"Return Movies where some of the related Creatures match this filter\\"\\"\\"
              director_SOME: CreatureWhere
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
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
              updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updatePeople(connect: PersonConnectInput, create: PersonRelationInput, delete: PersonDeleteInput, disconnect: PersonDisconnectInput, update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
              updateSeries(connect: SeriesConnectInput, create: SeriesRelationInput, delete: SeriesDeleteInput, disconnect: SeriesDisconnectInput, update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
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

            type Person implements Creature {
              id: ID
              movies(directed: Boolean = true, options: ProductionOptions, where: ProductionWhere): Production!
              moviesAggregate(directed: Boolean = true, where: ProductionWhere): PersonProductionMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [CreatureMoviesConnectionSort!], where: CreatureMoviesConnectionWhere): CreatureMoviesConnection!
            }

            type PersonAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
            }

            input PersonConnectInput {
              movies: PersonMoviesConnectFieldInput
            }

            input PersonCreateInput {
              id: ID
              movies: PersonMoviesFieldInput
            }

            input PersonDeleteInput {
              movies: PersonMoviesDeleteFieldInput
            }

            input PersonDisconnectInput {
              movies: PersonMoviesDisconnectFieldInput
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            input PersonMoviesAggregateInput {
              AND: [PersonMoviesAggregateInput!]
              NOT: PersonMoviesAggregateInput
              OR: [PersonMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: PersonMoviesNodeAggregationWhereInput
            }

            input PersonMoviesConnectFieldInput {
              connect: ProductionConnectInput
              where: ProductionConnectWhere
            }

            input PersonMoviesCreateFieldInput {
              node: ProductionCreateInput!
            }

            input PersonMoviesDeleteFieldInput {
              delete: ProductionDeleteInput
              where: CreatureMoviesConnectionWhere
            }

            input PersonMoviesDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: CreatureMoviesConnectionWhere
            }

            input PersonMoviesFieldInput {
              connect: PersonMoviesConnectFieldInput
              create: PersonMoviesCreateFieldInput
            }

            input PersonMoviesNodeAggregationWhereInput {
              AND: [PersonMoviesNodeAggregationWhereInput!]
              NOT: PersonMoviesNodeAggregationWhereInput
              OR: [PersonMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            input PersonMoviesUpdateConnectionInput {
              node: ProductionUpdateInput
            }

            input PersonMoviesUpdateFieldInput {
              connect: PersonMoviesConnectFieldInput
              create: PersonMoviesCreateFieldInput
              delete: PersonMoviesDeleteFieldInput
              disconnect: PersonMoviesDisconnectFieldInput
              update: PersonMoviesUpdateConnectionInput
              where: CreatureMoviesConnectionWhere
            }

            input PersonOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [PersonSort!]
            }

            type PersonProductionMoviesAggregationSelection {
              count: Int!
              node: PersonProductionMoviesNodeAggregateSelection
            }

            type PersonProductionMoviesNodeAggregateSelection {
              id: IDAggregateSelection!
            }

            input PersonRelationInput {
              movies: PersonMoviesCreateFieldInput
            }

            \\"\\"\\"
            Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
            \\"\\"\\"
            input PersonSort {
              id: SortDirection
            }

            input PersonUpdateInput {
              id: ID
              movies: PersonMoviesUpdateFieldInput
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
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
              movies: ProductionWhere
              moviesAggregate: PersonMoviesAggregateInput
              moviesConnection: CreatureMoviesConnectionWhere
              moviesConnection_NOT: CreatureMoviesConnectionWhere
              movies_NOT: ProductionWhere
            }

            interface Production {
              director(options: CreatureOptions, where: CreatureWhere): [Creature!]!
              directorConnection(after: String, first: Int, sort: [ProductionDirectorConnectionSort!], where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
              id: ID
            }

            type ProductionAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
            }

            input ProductionConnectInput {
              director: [ProductionDirectorConnectFieldInput!]
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input ProductionDeleteInput {
              director: [ProductionDirectorDeleteFieldInput!]
            }

            input ProductionDirectorAggregateInput {
              AND: [ProductionDirectorAggregateInput!]
              NOT: ProductionDirectorAggregateInput
              OR: [ProductionDirectorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: ProductionDirectorNodeAggregationWhereInput
            }

            input ProductionDirectorConnectFieldInput {
              connect: CreatureConnectInput
              where: CreatureConnectWhere
            }

            type ProductionDirectorConnection {
              edges: [ProductionDirectorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionDirectorConnectionSort {
              node: CreatureSort
            }

            input ProductionDirectorConnectionWhere {
              AND: [ProductionDirectorConnectionWhere!]
              NOT: ProductionDirectorConnectionWhere
              OR: [ProductionDirectorConnectionWhere!]
              node: CreatureWhere
              node_NOT: CreatureWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input ProductionDirectorCreateFieldInput {
              node: CreatureCreateInput!
            }

            input ProductionDirectorDeleteFieldInput {
              delete: CreatureDeleteInput
              where: ProductionDirectorConnectionWhere
            }

            input ProductionDirectorDisconnectFieldInput {
              disconnect: CreatureDisconnectInput
              where: ProductionDirectorConnectionWhere
            }

            input ProductionDirectorNodeAggregationWhereInput {
              AND: [ProductionDirectorNodeAggregationWhereInput!]
              NOT: ProductionDirectorNodeAggregationWhereInput
              OR: [ProductionDirectorNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type ProductionDirectorRelationship {
              cursor: String!
              node: Creature!
            }

            input ProductionDirectorUpdateConnectionInput {
              node: CreatureUpdateInput
            }

            input ProductionDirectorUpdateFieldInput {
              connect: [ProductionDirectorConnectFieldInput!]
              create: [ProductionDirectorCreateFieldInput!]
              delete: [ProductionDirectorDeleteFieldInput!]
              disconnect: [ProductionDirectorDisconnectFieldInput!]
              update: ProductionDirectorUpdateConnectionInput
              where: ProductionDirectorConnectionWhere
            }

            input ProductionDisconnectInput {
              director: [ProductionDirectorDisconnectFieldInput!]
            }

            type ProductionEdge {
              cursor: String!
              node: Production!
            }

            enum ProductionImplementation {
              Movie
              Series
            }

            input ProductionOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more ProductionSort objects to sort Productions by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [ProductionSort]
            }

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              id: SortDirection
            }

            input ProductionUpdateInput {
              director: [ProductionDirectorUpdateFieldInput!]
              id: ID
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              director: CreatureWhere @deprecated(reason: \\"Use \`director_SOME\` instead.\\")
              directorAggregate: ProductionDirectorAggregateInput
              directorConnection: ProductionDirectorConnectionWhere @deprecated(reason: \\"Use \`directorConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Productions where all of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_ALL: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Productions where none of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_NONE: ProductionDirectorConnectionWhere
              directorConnection_NOT: ProductionDirectorConnectionWhere @deprecated(reason: \\"Use \`directorConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Productions where one of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SINGLE: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Productions where some of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SOME: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Productions where all of the related Creatures match this filter
              \\"\\"\\"
              director_ALL: CreatureWhere
              \\"\\"\\"
              Return Productions where none of the related Creatures match this filter
              \\"\\"\\"
              director_NONE: CreatureWhere
              director_NOT: CreatureWhere @deprecated(reason: \\"Use \`director_NONE\` instead.\\")
              \\"\\"\\"
              Return Productions where one of the related Creatures match this filter
              \\"\\"\\"
              director_SINGLE: CreatureWhere
              \\"\\"\\"
              Return Productions where some of the related Creatures match this filter
              \\"\\"\\"
              director_SOME: CreatureWhere
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
              typename_IN: [ProductionImplementation!]
            }

            type ProductionsConnection {
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              creatures(options: CreatureOptions, where: CreatureWhere): [Creature!]!
              creaturesAggregate(where: CreatureWhere): CreatureAggregateSelection!
              creaturesConnection(after: String, first: Int, sort: [CreatureSort], where: CreatureWhere): CreaturesConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
              people(options: PersonOptions, where: PersonWhere): [Person!]!
              peopleAggregate(where: PersonWhere): PersonAggregateSelection!
              peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
              productions(options: ProductionOptions, where: ProductionWhere): [Production!]!
              productionsAggregate(where: ProductionWhere): ProductionAggregateSelection!
              productionsConnection(after: String, first: Int, sort: [ProductionSort], where: ProductionWhere): ProductionsConnection!
              series(options: SeriesOptions, where: SeriesWhere): [Series!]!
              seriesAggregate(where: SeriesWhere): SeriesAggregateSelection!
              seriesConnection(after: String, first: Int, sort: [SeriesSort], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              director(directed: Boolean = true, options: CreatureOptions, where: CreatureWhere): [Creature!]!
              directorAggregate(directed: Boolean = true, where: CreatureWhere): SeriesCreatureDirectorAggregationSelection
              directorConnection(after: String, directed: Boolean = true, first: Int, sort: [ProductionDirectorConnectionSort!], where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
              episode: Int!
              id: ID
              title: String!
            }

            type SeriesAggregateSelection {
              count: Int!
              episode: IntAggregateSelection!
              id: IDAggregateSelection!
              title: StringAggregateSelection!
            }

            input SeriesConnectInput {
              director: [SeriesDirectorConnectFieldInput!]
            }

            type SeriesConnection {
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              director: SeriesDirectorFieldInput
              episode: Int!
              id: ID
              title: String!
            }

            type SeriesCreatureDirectorAggregationSelection {
              count: Int!
              node: SeriesCreatureDirectorNodeAggregateSelection
            }

            type SeriesCreatureDirectorNodeAggregateSelection {
              id: IDAggregateSelection!
            }

            input SeriesDeleteInput {
              director: [SeriesDirectorDeleteFieldInput!]
            }

            input SeriesDirectorAggregateInput {
              AND: [SeriesDirectorAggregateInput!]
              NOT: SeriesDirectorAggregateInput
              OR: [SeriesDirectorAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: SeriesDirectorNodeAggregationWhereInput
            }

            input SeriesDirectorConnectFieldInput {
              connect: CreatureConnectInput
              where: CreatureConnectWhere
            }

            input SeriesDirectorCreateFieldInput {
              node: CreatureCreateInput!
            }

            input SeriesDirectorDeleteFieldInput {
              delete: CreatureDeleteInput
              where: ProductionDirectorConnectionWhere
            }

            input SeriesDirectorDisconnectFieldInput {
              disconnect: CreatureDisconnectInput
              where: ProductionDirectorConnectionWhere
            }

            input SeriesDirectorFieldInput {
              connect: [SeriesDirectorConnectFieldInput!]
              create: [SeriesDirectorCreateFieldInput!]
            }

            input SeriesDirectorNodeAggregationWhereInput {
              AND: [SeriesDirectorNodeAggregationWhereInput!]
              NOT: SeriesDirectorNodeAggregationWhereInput
              OR: [SeriesDirectorNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            input SeriesDirectorUpdateConnectionInput {
              node: CreatureUpdateInput
            }

            input SeriesDirectorUpdateFieldInput {
              connect: [SeriesDirectorConnectFieldInput!]
              create: [SeriesDirectorCreateFieldInput!]
              delete: [SeriesDirectorDeleteFieldInput!]
              disconnect: [SeriesDirectorDisconnectFieldInput!]
              update: SeriesDirectorUpdateConnectionInput
              where: ProductionDirectorConnectionWhere
            }

            input SeriesDisconnectInput {
              director: [SeriesDirectorDisconnectFieldInput!]
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            input SeriesOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more SeriesSort objects to sort Series by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [SeriesSort!]
            }

            input SeriesRelationInput {
              director: [SeriesDirectorCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              episode: SortDirection
              id: SortDirection
              title: SortDirection
            }

            input SeriesUpdateInput {
              director: [SeriesDirectorUpdateFieldInput!]
              episode: Int
              episode_DECREMENT: Int
              episode_INCREMENT: Int
              id: ID
              title: String
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              director: CreatureWhere @deprecated(reason: \\"Use \`director_SOME\` instead.\\")
              directorAggregate: SeriesDirectorAggregateInput
              directorConnection: ProductionDirectorConnectionWhere @deprecated(reason: \\"Use \`directorConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Series where all of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_ALL: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Series where none of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_NONE: ProductionDirectorConnectionWhere
              directorConnection_NOT: ProductionDirectorConnectionWhere @deprecated(reason: \\"Use \`directorConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Series where one of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SINGLE: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Series where some of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SOME: ProductionDirectorConnectionWhere
              \\"\\"\\"Return Series where all of the related Creatures match this filter\\"\\"\\"
              director_ALL: CreatureWhere
              \\"\\"\\"Return Series where none of the related Creatures match this filter\\"\\"\\"
              director_NONE: CreatureWhere
              director_NOT: CreatureWhere @deprecated(reason: \\"Use \`director_NONE\` instead.\\")
              \\"\\"\\"Return Series where one of the related Creatures match this filter\\"\\"\\"
              director_SINGLE: CreatureWhere
              \\"\\"\\"Return Series where some of the related Creatures match this filter\\"\\"\\"
              director_SOME: CreatureWhere
              episode: Int
              episode_GT: Int
              episode_GTE: Int
              episode_IN: [Int!]
              episode_LT: Int
              episode_LTE: Int
              episode_NOT: Int @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              episode_NOT_IN: [Int!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
            }

            type UpdateSeriesMutationResponse {
              info: UpdateInfo!
              series: [Series!]!
            }"
        `);
    });
});
