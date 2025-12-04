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
            type Movie implements Production @subscription(events: []) @node {
                title: String!
                id: ID
                director: [Creature!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type Series implements Production @node {
                title: String!
                episode: Int!
                id: ID
                director: [Creature!]! @relationship(type: "DIRECTED", direction: IN)
            }

            interface Production {
                id: ID
                director: [Creature!]! @declareRelationship
            }

            type Person implements Creature @node {
                id: ID
                movies: [Production!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            interface Creature {
                id: ID
                movies: [Production!]! @declareRelationship
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count {
              nodes: Int!
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
              movies(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              moviesConnection(after: String, first: Int, sort: [CreatureMoviesConnectionSort!], where: CreatureMoviesConnectionWhere): CreatureMoviesConnection!
            }

            type CreatureAggregate {
              count: Count!
            }

            input CreatureConnectInput {
              movies: [CreatureMoviesConnectFieldInput!]
            }

            input CreatureConnectWhere {
              node: CreatureWhere!
            }

            input CreatureCreateInput {
              Person: PersonCreateInput
            }

            input CreatureDeleteInput {
              movies: [CreatureMoviesDeleteFieldInput!]
            }

            input CreatureDisconnectInput {
              movies: [CreatureMoviesDisconnectFieldInput!]
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
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

            input CreatureMoviesConnectionAggregateInput {
              AND: [CreatureMoviesConnectionAggregateInput!]
              NOT: CreatureMoviesConnectionAggregateInput
              OR: [CreatureMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
            }

            input CreatureMoviesConnectionFilters {
              \\"\\"\\"
              Filter Creatures by aggregating results on related CreatureMoviesConnections
              \\"\\"\\"
              aggregate: CreatureMoviesConnectionAggregateInput
              \\"\\"\\"
              Return Creatures where all of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              all: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return Creatures where none of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              none: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return Creatures where one of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              single: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return Creatures where some of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              some: CreatureMoviesConnectionWhere
            }

            input CreatureMoviesConnectionSort {
              node: ProductionSort
            }

            input CreatureMoviesConnectionWhere {
              AND: [CreatureMoviesConnectionWhere!]
              NOT: CreatureMoviesConnectionWhere
              OR: [CreatureMoviesConnectionWhere!]
              node: ProductionWhere
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

            type CreatureMoviesRelationship {
              cursor: String!
              node: Production!
            }

            input CreatureMoviesUpdateConnectionInput {
              node: ProductionUpdateInput
              where: CreatureMoviesConnectionWhere
            }

            input CreatureMoviesUpdateFieldInput {
              connect: [CreatureMoviesConnectFieldInput!]
              create: [CreatureMoviesCreateFieldInput!]
              delete: [CreatureMoviesDeleteFieldInput!]
              disconnect: [CreatureMoviesDisconnectFieldInput!]
              update: CreatureMoviesUpdateConnectionInput
            }

            input CreatureRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Creatures match this filter\\"\\"\\"
              all: CreatureWhere
              \\"\\"\\"Filter type where none of the related Creatures match this filter\\"\\"\\"
              none: CreatureWhere
              \\"\\"\\"Filter type where one of the related Creatures match this filter\\"\\"\\"
              single: CreatureWhere
              \\"\\"\\"Filter type where some of the related Creatures match this filter\\"\\"\\"
              some: CreatureWhere
            }

            \\"\\"\\"
            Fields to sort Creatures by. The order in which sorts are applied is not guaranteed when specifying many fields in one CreatureSort object.
            \\"\\"\\"
            input CreatureSort {
              id: SortDirection
            }

            input CreatureUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              movies: [CreatureMoviesUpdateFieldInput!]
            }

            input CreatureWhere {
              AND: [CreatureWhere!]
              NOT: CreatureWhere
              OR: [CreatureWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              movies: ProductionRelationshipFilters
              moviesAggregate: CreatureMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: CreatureMoviesConnectionFilters
              \\"\\"\\"
              Return Creatures where all of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: CreatureMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Creatures where none of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: CreatureMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Creatures where one of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: CreatureMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Creatures where some of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: CreatureMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Creatures where all of the related Productions match this filter
              \\"\\"\\"
              movies_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"
              Return Creatures where none of the related Productions match this filter
              \\"\\"\\"
              movies_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"
              Return Creatures where one of the related Productions match this filter
              \\"\\"\\"
              movies_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return Creatures where some of the related Productions match this filter
              \\"\\"\\"
              movies_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
              typename: [CreatureImplementation!]
            }

            type CreaturesConnection {
              aggregate: CreatureAggregate!
              edges: [CreatureEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            \\"\\"\\"ID filters\\"\\"\\"
            input IDScalarFilters {
              contains: ID
              endsWith: ID
              eq: ID
              in: [ID!]
              startsWith: ID
            }

            \\"\\"\\"ID mutations\\"\\"\\"
            input IDScalarMutations {
              set: ID
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
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

            type Movie implements Production {
              director(limit: Int, offset: Int, sort: [CreatureSort!], where: CreatureWhere): [Creature!]!
              directorConnection(after: String, first: Int, sort: [ProductionDirectorConnectionSort!], where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
              id: ID
              title: String!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              director: MovieDirectorFieldInput
              id: ID
              title: String!
            }

            input MovieDeleteInput {
              director: [MovieDirectorDeleteFieldInput!]
            }

            input MovieDirectorAggregateInput {
              AND: [MovieDirectorAggregateInput!]
              NOT: MovieDirectorAggregateInput
              OR: [MovieDirectorAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
            }

            input MovieDirectorConnectFieldInput {
              connect: CreatureConnectInput
              where: CreatureConnectWhere
            }

            input MovieDirectorConnectionAggregateInput {
              AND: [MovieDirectorConnectionAggregateInput!]
              NOT: MovieDirectorConnectionAggregateInput
              OR: [MovieDirectorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
            }

            input MovieDirectorConnectionFilters {
              \\"\\"\\"
              Filter Movies by aggregating results on related ProductionDirectorConnections
              \\"\\"\\"
              aggregate: MovieDirectorConnectionAggregateInput
              \\"\\"\\"
              Return Movies where all of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              all: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              none: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              single: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              some: ProductionDirectorConnectionWhere
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

            input MovieDirectorUpdateConnectionInput {
              node: CreatureUpdateInput
              where: ProductionDirectorConnectionWhere
            }

            input MovieDirectorUpdateFieldInput {
              connect: [MovieDirectorConnectFieldInput!]
              create: [MovieDirectorCreateFieldInput!]
              delete: [MovieDirectorDeleteFieldInput!]
              disconnect: [MovieDirectorDisconnectFieldInput!]
              update: MovieDirectorUpdateConnectionInput
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
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
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              director: CreatureRelationshipFilters
              directorAggregate: MovieDirectorAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the directorConnection filter, please use { directorConnection: { aggregate: {...} } } instead\\")
              directorConnection: MovieDirectorConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_ALL: ProductionDirectorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_NONE: ProductionDirectorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SINGLE: ProductionDirectorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SOME: ProductionDirectorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Creatures match this filter\\"\\"\\"
              director_ALL: CreatureWhere @deprecated(reason: \\"Please use the relevant generic filter 'director: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Creatures match this filter\\"\\"\\"
              director_NONE: CreatureWhere @deprecated(reason: \\"Please use the relevant generic filter 'director: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Creatures match this filter\\"\\"\\"
              director_SINGLE: CreatureWhere @deprecated(reason: \\"Please use the relevant generic filter 'director: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Creatures match this filter\\"\\"\\"
              director_SOME: CreatureWhere @deprecated(reason: \\"Please use the relevant generic filter 'director: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
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
              updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
              updatePeople(update: PersonUpdateInput, where: PersonWhere): UpdatePeopleMutationResponse!
              updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type PeopleConnection {
              aggregate: PersonAggregate!
              edges: [PersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Person implements Creature {
              id: ID
              movies(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              moviesConnection(after: String, first: Int, sort: [CreatureMoviesConnectionSort!], where: CreatureMoviesConnectionWhere): CreatureMoviesConnection!
            }

            type PersonAggregate {
              count: Count!
            }

            input PersonCreateInput {
              id: ID
              movies: PersonMoviesFieldInput
            }

            input PersonDeleteInput {
              movies: [PersonMoviesDeleteFieldInput!]
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            input PersonMoviesAggregateInput {
              AND: [PersonMoviesAggregateInput!]
              NOT: PersonMoviesAggregateInput
              OR: [PersonMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
            }

            input PersonMoviesConnectFieldInput {
              connect: ProductionConnectInput
              where: ProductionConnectWhere
            }

            input PersonMoviesConnectionAggregateInput {
              AND: [PersonMoviesConnectionAggregateInput!]
              NOT: PersonMoviesConnectionAggregateInput
              OR: [PersonMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
            }

            input PersonMoviesConnectionFilters {
              \\"\\"\\"
              Filter People by aggregating results on related CreatureMoviesConnections
              \\"\\"\\"
              aggregate: PersonMoviesConnectionAggregateInput
              \\"\\"\\"
              Return People where all of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              all: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return People where none of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              none: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return People where one of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              single: CreatureMoviesConnectionWhere
              \\"\\"\\"
              Return People where some of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              some: CreatureMoviesConnectionWhere
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
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
            }

            input PersonMoviesUpdateConnectionInput {
              node: ProductionUpdateInput
              where: CreatureMoviesConnectionWhere
            }

            input PersonMoviesUpdateFieldInput {
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
              delete: [PersonMoviesDeleteFieldInput!]
              disconnect: [PersonMoviesDisconnectFieldInput!]
              update: PersonMoviesUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
            \\"\\"\\"
            input PersonSort {
              id: SortDirection
            }

            input PersonUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              movies: [PersonMoviesUpdateFieldInput!]
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              movies: ProductionRelationshipFilters
              moviesAggregate: PersonMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: PersonMoviesConnectionFilters
              \\"\\"\\"
              Return People where all of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: CreatureMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where none of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: CreatureMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where one of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: CreatureMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where some of the related CreatureMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: CreatureMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return People where all of the related Productions match this filter\\"\\"\\"
              movies_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return People where none of the related Productions match this filter\\"\\"\\"
              movies_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return People where one of the related Productions match this filter\\"\\"\\"
              movies_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return People where some of the related Productions match this filter\\"\\"\\"
              movies_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
            }

            interface Production {
              director(limit: Int, offset: Int, sort: [CreatureSort!], where: CreatureWhere): [Creature!]!
              directorConnection(after: String, first: Int, sort: [ProductionDirectorConnectionSort!], where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
              id: ID
            }

            type ProductionAggregate {
              count: Count!
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
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
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

            input ProductionDirectorConnectionAggregateInput {
              AND: [ProductionDirectorConnectionAggregateInput!]
              NOT: ProductionDirectorConnectionAggregateInput
              OR: [ProductionDirectorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
            }

            input ProductionDirectorConnectionFilters {
              \\"\\"\\"
              Filter Productions by aggregating results on related ProductionDirectorConnections
              \\"\\"\\"
              aggregate: ProductionDirectorConnectionAggregateInput
              \\"\\"\\"
              Return Productions where all of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              all: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Productions where none of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              none: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Productions where one of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              single: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Productions where some of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              some: ProductionDirectorConnectionWhere
            }

            input ProductionDirectorConnectionSort {
              node: CreatureSort
            }

            input ProductionDirectorConnectionWhere {
              AND: [ProductionDirectorConnectionWhere!]
              NOT: ProductionDirectorConnectionWhere
              OR: [ProductionDirectorConnectionWhere!]
              node: CreatureWhere
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

            type ProductionDirectorRelationship {
              cursor: String!
              node: Creature!
            }

            input ProductionDirectorUpdateConnectionInput {
              node: CreatureUpdateInput
              where: ProductionDirectorConnectionWhere
            }

            input ProductionDirectorUpdateFieldInput {
              connect: [ProductionDirectorConnectFieldInput!]
              create: [ProductionDirectorCreateFieldInput!]
              delete: [ProductionDirectorDeleteFieldInput!]
              disconnect: [ProductionDirectorDisconnectFieldInput!]
              update: ProductionDirectorUpdateConnectionInput
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

            input ProductionRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Productions match this filter\\"\\"\\"
              all: ProductionWhere
              \\"\\"\\"Filter type where none of the related Productions match this filter\\"\\"\\"
              none: ProductionWhere
              \\"\\"\\"Filter type where one of the related Productions match this filter\\"\\"\\"
              single: ProductionWhere
              \\"\\"\\"Filter type where some of the related Productions match this filter\\"\\"\\"
              some: ProductionWhere
            }

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              id: SortDirection
            }

            input ProductionUpdateInput {
              director: [ProductionDirectorUpdateFieldInput!]
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              director: CreatureRelationshipFilters
              directorAggregate: ProductionDirectorAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the directorConnection filter, please use { directorConnection: { aggregate: {...} } } instead\\")
              directorConnection: ProductionDirectorConnectionFilters
              \\"\\"\\"
              Return Productions where all of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_ALL: ProductionDirectorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Productions where none of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_NONE: ProductionDirectorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Productions where one of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SINGLE: ProductionDirectorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Productions where some of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SOME: ProductionDirectorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Productions where all of the related Creatures match this filter
              \\"\\"\\"
              director_ALL: CreatureWhere @deprecated(reason: \\"Please use the relevant generic filter 'director: { all: ... }' instead.\\")
              \\"\\"\\"
              Return Productions where none of the related Creatures match this filter
              \\"\\"\\"
              director_NONE: CreatureWhere @deprecated(reason: \\"Please use the relevant generic filter 'director: { none: ... }' instead.\\")
              \\"\\"\\"
              Return Productions where one of the related Creatures match this filter
              \\"\\"\\"
              director_SINGLE: CreatureWhere @deprecated(reason: \\"Please use the relevant generic filter 'director: {  single: ... }' instead.\\")
              \\"\\"\\"
              Return Productions where some of the related Creatures match this filter
              \\"\\"\\"
              director_SOME: CreatureWhere @deprecated(reason: \\"Please use the relevant generic filter 'director: {  some: ... }' instead.\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              typename: [ProductionImplementation!]
            }

            type ProductionsConnection {
              aggregate: ProductionAggregate!
              edges: [ProductionEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Query {
              creatures(limit: Int, offset: Int, sort: [CreatureSort!], where: CreatureWhere): [Creature!]!
              creaturesConnection(after: String, first: Int, sort: [CreatureSort!], where: CreatureWhere): CreaturesConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
              productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
              series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
            }

            type Series implements Production {
              director(limit: Int, offset: Int, sort: [CreatureSort!], where: CreatureWhere): [Creature!]!
              directorConnection(after: String, first: Int, sort: [ProductionDirectorConnectionSort!], where: ProductionDirectorConnectionWhere): ProductionDirectorConnection!
              episode: Int!
              id: ID
              title: String!
            }

            type SeriesAggregate {
              count: Count!
              node: SeriesAggregateNode!
            }

            type SeriesAggregateNode {
              episode: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            type SeriesConnection {
              aggregate: SeriesAggregate!
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

            input SeriesDeleteInput {
              director: [SeriesDirectorDeleteFieldInput!]
            }

            input SeriesDirectorAggregateInput {
              AND: [SeriesDirectorAggregateInput!]
              NOT: SeriesDirectorAggregateInput
              OR: [SeriesDirectorAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
            }

            input SeriesDirectorConnectFieldInput {
              connect: CreatureConnectInput
              where: CreatureConnectWhere
            }

            input SeriesDirectorConnectionAggregateInput {
              AND: [SeriesDirectorConnectionAggregateInput!]
              NOT: SeriesDirectorConnectionAggregateInput
              OR: [SeriesDirectorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
            }

            input SeriesDirectorConnectionFilters {
              \\"\\"\\"
              Filter Series by aggregating results on related ProductionDirectorConnections
              \\"\\"\\"
              aggregate: SeriesDirectorConnectionAggregateInput
              \\"\\"\\"
              Return Series where all of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              all: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Series where none of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              none: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Series where one of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              single: ProductionDirectorConnectionWhere
              \\"\\"\\"
              Return Series where some of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              some: ProductionDirectorConnectionWhere
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

            input SeriesDirectorUpdateConnectionInput {
              node: CreatureUpdateInput
              where: ProductionDirectorConnectionWhere
            }

            input SeriesDirectorUpdateFieldInput {
              connect: [SeriesDirectorConnectFieldInput!]
              create: [SeriesDirectorCreateFieldInput!]
              delete: [SeriesDirectorDeleteFieldInput!]
              disconnect: [SeriesDirectorDisconnectFieldInput!]
              update: SeriesDirectorUpdateConnectionInput
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
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
              episode: IntScalarMutations
              episode_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episode: { decrement: ... } }' instead.\\")
              episode_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'episode: { increment: ... } }' instead.\\")
              episode_SET: Int @deprecated(reason: \\"Please use the generic mutation 'episode: { set: ... } }' instead.\\")
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              director: CreatureRelationshipFilters
              directorAggregate: SeriesDirectorAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the directorConnection filter, please use { directorConnection: { aggregate: {...} } } instead\\")
              directorConnection: SeriesDirectorConnectionFilters
              \\"\\"\\"
              Return Series where all of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_ALL: ProductionDirectorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where none of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_NONE: ProductionDirectorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where one of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SINGLE: ProductionDirectorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Series where some of the related ProductionDirectorConnections match this filter
              \\"\\"\\"
              directorConnection_SOME: ProductionDirectorConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Series where all of the related Creatures match this filter\\"\\"\\"
              director_ALL: CreatureWhere @deprecated(reason: \\"Please use the relevant generic filter 'director: { all: ... }' instead.\\")
              \\"\\"\\"Return Series where none of the related Creatures match this filter\\"\\"\\"
              director_NONE: CreatureWhere @deprecated(reason: \\"Please use the relevant generic filter 'director: { none: ... }' instead.\\")
              \\"\\"\\"Return Series where one of the related Creatures match this filter\\"\\"\\"
              director_SINGLE: CreatureWhere @deprecated(reason: \\"Please use the relevant generic filter 'director: {  single: ... }' instead.\\")
              \\"\\"\\"Return Series where some of the related Creatures match this filter\\"\\"\\"
              director_SOME: CreatureWhere @deprecated(reason: \\"Please use the relevant generic filter 'director: {  some: ... }' instead.\\")
              episode: IntScalarFilters
              episode_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter episode: { eq: ... }\\")
              episode_GT: Int @deprecated(reason: \\"Please use the relevant generic filter episode: { gt: ... }\\")
              episode_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter episode: { gte: ... }\\")
              episode_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter episode: { in: ... }\\")
              episode_LT: Int @deprecated(reason: \\"Please use the relevant generic filter episode: { lt: ... }\\")
              episode_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter episode: { lte: ... }\\")
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              title: StringScalarFilters
              title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
              title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
              title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
              title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
              title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
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

            \\"\\"\\"String filters\\"\\"\\"
            input StringScalarFilters {
              contains: String
              endsWith: String
              eq: String
              in: [String!]
              startsWith: String
            }

            \\"\\"\\"String mutations\\"\\"\\"
            input StringScalarMutations {
              set: String
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
