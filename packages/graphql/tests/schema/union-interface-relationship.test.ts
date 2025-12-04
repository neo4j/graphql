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
import { lexicographicSortSchema } from "graphql";
import { Neo4jGraphQL } from "../../src";

describe("Union Interface Relationships", () => {
    test("Union Interface Relationships", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                imdbId: Int
            }

            type Actor @node {
                name: String!
                id: Int
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Directed @relationshipProperties {
                year: Int!
            }

            type Review @relationshipProperties {
                score: Int!
            }

            type Person implements Reviewer @node {
                name: String!
                reputation: Int!
                id: Int
                reviewerId: Int
                movies: [Movie!]! @relationship(type: "REVIEWED", direction: OUT, properties: "Review")
            }

            type Influencer implements Reviewer @node {
                reputation: Int!
                url: String!
                reviewerId: Int
            }

            union Director = Person | Actor

            interface Reviewer {
                reputation: Int!
                reviewerId: Int
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
            The edge properties for the following fields:
            * Movie.actors
            * Actor.movies
            \\"\\"\\"
            type ActedIn {
              screenTime: Int!
            }

            input ActedInAggregationWhereInput {
              AND: [ActedInAggregationWhereInput!]
              NOT: ActedInAggregationWhereInput
              OR: [ActedInAggregationWhereInput!]
              screenTime: IntScalarAggregationFilters
              screenTime_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { eq: ... } } }' instead.\\")
              screenTime_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { gt: ... } } }' instead.\\")
              screenTime_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { gte: ... } } }' instead.\\")
              screenTime_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { lt: ... } } }' instead.\\")
              screenTime_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { average: { lte: ... } } }' instead.\\")
              screenTime_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { eq: ... } } }' instead.\\")
              screenTime_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { gt: ... } } }' instead.\\")
              screenTime_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { gte: ... } } }' instead.\\")
              screenTime_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { lt: ... } } }' instead.\\")
              screenTime_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { max: { lte: ... } } }' instead.\\")
              screenTime_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { eq: ... } } }' instead.\\")
              screenTime_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { gt: ... } } }' instead.\\")
              screenTime_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { gte: ... } } }' instead.\\")
              screenTime_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { lt: ... } } }' instead.\\")
              screenTime_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { min: { lte: ... } } }' instead.\\")
              screenTime_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { eq: ... } } }' instead.\\")
              screenTime_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { gt: ... } } }' instead.\\")
              screenTime_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { gte: ... } } }' instead.\\")
              screenTime_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { lt: ... } } }' instead.\\")
              screenTime_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'screenTime: { sum: { lte: ... } } }' instead.\\")
            }

            input ActedInCreateInput {
              screenTime: Int!
            }

            input ActedInSort {
              screenTime: SortDirection
            }

            input ActedInUpdateInput {
              screenTime: IntScalarMutations
              screenTime_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'screenTime: { decrement: ... } }' instead.\\")
              screenTime_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'screenTime: { increment: ... } }' instead.\\")
              screenTime_SET: Int @deprecated(reason: \\"Please use the generic mutation 'screenTime: { set: ... } }' instead.\\")
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              screenTime: IntScalarFilters
              screenTime_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { eq: ... }\\")
              screenTime_GT: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gt: ... }\\")
              screenTime_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { gte: ... }\\")
              screenTime_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter screenTime: { in: ... }\\")
              screenTime_LT: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lt: ... }\\")
              screenTime_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter screenTime: { lte: ... }\\")
            }

            type Actor {
              id: Int
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
              name: String!
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              id: IntAggregateSelection!
              name: StringAggregateSelection!
            }

            input ActorConnectInput {
              movies: [ActorMoviesConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              id: Int
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

            type ActorMovieMoviesAggregateSelection {
              count: CountConnection!
              edge: ActorMovieMoviesEdgeAggregateSelection
              node: ActorMovieMoviesNodeAggregateSelection
            }

            type ActorMovieMoviesEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type ActorMovieMoviesNodeAggregateSelection {
              imdbId: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input ActorMoviesAggregateInput {
              AND: [ActorMoviesAggregateInput!]
              NOT: ActorMoviesAggregateInput
              OR: [ActorMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              edge: ActedInCreateInput!
              where: MovieConnectWhere
            }

            type ActorMoviesConnection {
              aggregate: ActorMovieMoviesAggregateSelection!
              edges: [ActorMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorMoviesConnectionAggregateInput {
              AND: [ActorMoviesConnectionAggregateInput!]
              NOT: ActorMoviesConnectionAggregateInput
              OR: [ActorMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: ActorMoviesNodeAggregationWhereInput
            }

            input ActorMoviesConnectionFilters {
              \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
              aggregate: ActorMoviesConnectionAggregateInput
              \\"\\"\\"
              Return Actors where all of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              all: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              none: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              single: ActorMoviesConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              some: ActorMoviesConnectionWhere
            }

            input ActorMoviesConnectionSort {
              edge: ActedInSort
              node: MovieSort
            }

            input ActorMoviesConnectionWhere {
              AND: [ActorMoviesConnectionWhere!]
              NOT: ActorMoviesConnectionWhere
              OR: [ActorMoviesConnectionWhere!]
              edge: ActedInWhere
              node: MovieWhere
            }

            input ActorMoviesCreateFieldInput {
              edge: ActedInCreateInput!
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
              NOT: ActorMoviesNodeAggregationWhereInput
              OR: [ActorMoviesNodeAggregationWhereInput!]
              imdbId: IntScalarAggregationFilters
              imdbId_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { average: { eq: ... } } }' instead.\\")
              imdbId_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { average: { gt: ... } } }' instead.\\")
              imdbId_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { average: { gte: ... } } }' instead.\\")
              imdbId_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { average: { lt: ... } } }' instead.\\")
              imdbId_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { average: { lte: ... } } }' instead.\\")
              imdbId_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { max: { eq: ... } } }' instead.\\")
              imdbId_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { max: { gt: ... } } }' instead.\\")
              imdbId_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { max: { gte: ... } } }' instead.\\")
              imdbId_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { max: { lt: ... } } }' instead.\\")
              imdbId_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { max: { lte: ... } } }' instead.\\")
              imdbId_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { min: { eq: ... } } }' instead.\\")
              imdbId_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { min: { gt: ... } } }' instead.\\")
              imdbId_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { min: { gte: ... } } }' instead.\\")
              imdbId_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { min: { lt: ... } } }' instead.\\")
              imdbId_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { min: { lte: ... } } }' instead.\\")
              imdbId_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { sum: { eq: ... } } }' instead.\\")
              imdbId_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { sum: { gt: ... } } }' instead.\\")
              imdbId_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { sum: { gte: ... } } }' instead.\\")
              imdbId_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { sum: { lt: ... } } }' instead.\\")
              imdbId_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { sum: { lte: ... } } }' instead.\\")
              title: StringScalarAggregationFilters
              title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type ActorMoviesRelationship {
              cursor: String!
              node: Movie!
              properties: ActedIn!
            }

            input ActorMoviesUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: MovieUpdateInput
              where: ActorMoviesConnectionWhere
            }

            input ActorMoviesUpdateFieldInput {
              connect: [ActorMoviesConnectFieldInput!]
              create: [ActorMoviesCreateFieldInput!]
              delete: [ActorMoviesDeleteFieldInput!]
              disconnect: [ActorMoviesDisconnectFieldInput!]
              update: ActorMoviesUpdateConnectionInput
            }

            input ActorRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
              all: ActorWhere
              \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
              none: ActorWhere
              \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
              single: ActorWhere
              \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
              some: ActorWhere
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              id: SortDirection
              name: SortDirection
            }

            input ActorUpdateInput {
              id: IntScalarMutations
              id_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'id: { decrement: ... } }' instead.\\")
              id_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'id: { increment: ... } }' instead.\\")
              id_SET: Int @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              movies: [ActorMoviesUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              id: IntScalarFilters
              id_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_GT: Int @deprecated(reason: \\"Please use the relevant generic filter id: { gt: ... }\\")
              id_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter id: { gte: ... }\\")
              id_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_LT: Int @deprecated(reason: \\"Please use the relevant generic filter id: { lt: ... }\\")
              id_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter id: { lte: ... }\\")
              movies: MovieRelationshipFilters
              moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: ActorMoviesConnectionFilters
              \\"\\"\\"
              Return Actors where all of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where none of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where one of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Actors where some of the related ActorMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type ActorsConnection {
              aggregate: ActorAggregate!
              edges: [ActorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
            }

            type Count {
              nodes: Int!
            }

            type CountConnection {
              edges: Int!
              nodes: Int!
            }

            type CreateActorsMutationResponse {
              actors: [Actor!]!
              info: CreateInfo!
            }

            type CreateInfluencersMutationResponse {
              influencers: [Influencer!]!
              info: CreateInfo!
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.directors
            \\"\\"\\"
            type Directed {
              year: Int!
            }

            input DirectedCreateInput {
              year: Int!
            }

            input DirectedSort {
              year: SortDirection
            }

            input DirectedUpdateInput {
              year: IntScalarMutations
              year_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'year: { decrement: ... } }' instead.\\")
              year_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'year: { increment: ... } }' instead.\\")
              year_SET: Int @deprecated(reason: \\"Please use the generic mutation 'year: { set: ... } }' instead.\\")
            }

            input DirectedWhere {
              AND: [DirectedWhere!]
              NOT: DirectedWhere
              OR: [DirectedWhere!]
              year: IntScalarFilters
              year_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter year: { eq: ... }\\")
              year_GT: Int @deprecated(reason: \\"Please use the relevant generic filter year: { gt: ... }\\")
              year_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter year: { gte: ... }\\")
              year_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter year: { in: ... }\\")
              year_LT: Int @deprecated(reason: \\"Please use the relevant generic filter year: { lt: ... }\\")
              year_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter year: { lte: ... }\\")
            }

            union Director = Actor | Person

            input DirectorRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Directors match this filter\\"\\"\\"
              all: DirectorWhere
              \\"\\"\\"Filter type where none of the related Directors match this filter\\"\\"\\"
              none: DirectorWhere
              \\"\\"\\"Filter type where one of the related Directors match this filter\\"\\"\\"
              single: DirectorWhere
              \\"\\"\\"Filter type where some of the related Directors match this filter\\"\\"\\"
              some: DirectorWhere
            }

            input DirectorWhere {
              Actor: ActorWhere
              Person: PersonWhere
            }

            \\"\\"\\"Float filters\\"\\"\\"
            input FloatScalarFilters {
              eq: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            type Influencer implements Reviewer {
              reputation: Int!
              reviewerId: Int
              url: String!
            }

            type InfluencerAggregate {
              count: Count!
              node: InfluencerAggregateNode!
            }

            type InfluencerAggregateNode {
              reputation: IntAggregateSelection!
              reviewerId: IntAggregateSelection!
              url: StringAggregateSelection!
            }

            input InfluencerCreateInput {
              reputation: Int!
              reviewerId: Int
              url: String!
            }

            type InfluencerEdge {
              cursor: String!
              node: Influencer!
            }

            \\"\\"\\"
            Fields to sort Influencers by. The order in which sorts are applied is not guaranteed when specifying many fields in one InfluencerSort object.
            \\"\\"\\"
            input InfluencerSort {
              reputation: SortDirection
              reviewerId: SortDirection
              url: SortDirection
            }

            input InfluencerUpdateInput {
              reputation: IntScalarMutations
              reputation_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'reputation: { decrement: ... } }' instead.\\")
              reputation_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'reputation: { increment: ... } }' instead.\\")
              reputation_SET: Int @deprecated(reason: \\"Please use the generic mutation 'reputation: { set: ... } }' instead.\\")
              reviewerId: IntScalarMutations
              reviewerId_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'reviewerId: { decrement: ... } }' instead.\\")
              reviewerId_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'reviewerId: { increment: ... } }' instead.\\")
              reviewerId_SET: Int @deprecated(reason: \\"Please use the generic mutation 'reviewerId: { set: ... } }' instead.\\")
              url: StringScalarMutations
              url_SET: String @deprecated(reason: \\"Please use the generic mutation 'url: { set: ... } }' instead.\\")
            }

            input InfluencerWhere {
              AND: [InfluencerWhere!]
              NOT: InfluencerWhere
              OR: [InfluencerWhere!]
              reputation: IntScalarFilters
              reputation_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { eq: ... }\\")
              reputation_GT: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { gt: ... }\\")
              reputation_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { gte: ... }\\")
              reputation_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter reputation: { in: ... }\\")
              reputation_LT: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { lt: ... }\\")
              reputation_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { lte: ... }\\")
              reviewerId: IntScalarFilters
              reviewerId_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { eq: ... }\\")
              reviewerId_GT: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { gt: ... }\\")
              reviewerId_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { gte: ... }\\")
              reviewerId_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { in: ... }\\")
              reviewerId_LT: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { lt: ... }\\")
              reviewerId_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { lte: ... }\\")
              url: StringScalarFilters
              url_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter url: { contains: ... }\\")
              url_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter url: { endsWith: ... }\\")
              url_EQ: String @deprecated(reason: \\"Please use the relevant generic filter url: { eq: ... }\\")
              url_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter url: { in: ... }\\")
              url_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter url: { startsWith: ... }\\")
            }

            type InfluencersConnection {
              aggregate: InfluencerAggregate!
              edges: [InfluencerEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
            }

            \\"\\"\\"Filters for an aggregation of an int field\\"\\"\\"
            input IntScalarAggregationFilters {
              average: FloatScalarFilters
              max: IntScalarFilters
              min: IntScalarFilters
              sum: IntScalarFilters
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

            type Movie {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
              directors(limit: Int, offset: Int, where: DirectorWhere): [Director!]!
              directorsConnection(after: String, first: Int, sort: [MovieDirectorsConnectionSort!], where: MovieDirectorsConnectionWhere): MovieDirectorsConnection!
              imdbId: Int
              reviewers(limit: Int, offset: Int, sort: [ReviewerSort!], where: ReviewerWhere): [Reviewer!]!
              reviewersConnection(after: String, first: Int, sort: [MovieReviewersConnectionSort!], where: MovieReviewersConnectionWhere): MovieReviewersConnection!
              title: String!
            }

            type MovieActorActorsAggregateSelection {
              count: CountConnection!
              edge: MovieActorActorsEdgeAggregateSelection
              node: MovieActorActorsNodeAggregateSelection
            }

            type MovieActorActorsEdgeAggregateSelection {
              screenTime: IntAggregateSelection!
            }

            type MovieActorActorsNodeAggregateSelection {
              id: IntAggregateSelection!
              name: StringAggregateSelection!
            }

            input MovieActorsAggregateInput {
              AND: [MovieActorsAggregateInput!]
              NOT: MovieActorsAggregateInput
              OR: [MovieActorsAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            type MovieActorsConnection {
              aggregate: MovieActorActorsAggregateSelection!
              edges: [MovieActorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorsConnectionAggregateInput {
              AND: [MovieActorsConnectionAggregateInput!]
              NOT: MovieActorsConnectionAggregateInput
              OR: [MovieActorsConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: MovieActorsNodeAggregationWhereInput
            }

            input MovieActorsConnectionFilters {
              \\"\\"\\"Filter Movies by aggregating results on related MovieActorsConnections\\"\\"\\"
              aggregate: MovieActorsConnectionAggregateInput
              \\"\\"\\"
              Return Movies where all of the related MovieActorsConnections match this filter
              \\"\\"\\"
              all: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieActorsConnections match this filter
              \\"\\"\\"
              none: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieActorsConnections match this filter
              \\"\\"\\"
              single: MovieActorsConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieActorsConnections match this filter
              \\"\\"\\"
              some: MovieActorsConnectionWhere
            }

            input MovieActorsConnectionSort {
              edge: ActedInSort
              node: ActorSort
            }

            input MovieActorsConnectionWhere {
              AND: [MovieActorsConnectionWhere!]
              NOT: MovieActorsConnectionWhere
              OR: [MovieActorsConnectionWhere!]
              edge: ActedInWhere
              node: ActorWhere
            }

            input MovieActorsCreateFieldInput {
              edge: ActedInCreateInput!
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
              NOT: MovieActorsNodeAggregationWhereInput
              OR: [MovieActorsNodeAggregationWhereInput!]
              id: IntScalarAggregationFilters
              id_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { average: { eq: ... } } }' instead.\\")
              id_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { average: { gt: ... } } }' instead.\\")
              id_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { average: { gte: ... } } }' instead.\\")
              id_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { average: { lt: ... } } }' instead.\\")
              id_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { average: { lte: ... } } }' instead.\\")
              id_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { eq: ... } } }' instead.\\")
              id_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { gt: ... } } }' instead.\\")
              id_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { gte: ... } } }' instead.\\")
              id_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { lt: ... } } }' instead.\\")
              id_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { max: { lte: ... } } }' instead.\\")
              id_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { eq: ... } } }' instead.\\")
              id_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { gt: ... } } }' instead.\\")
              id_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { gte: ... } } }' instead.\\")
              id_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { lt: ... } } }' instead.\\")
              id_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { min: { lte: ... } } }' instead.\\")
              id_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { sum: { eq: ... } } }' instead.\\")
              id_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { sum: { gt: ... } } }' instead.\\")
              id_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { sum: { gte: ... } } }' instead.\\")
              id_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { sum: { lt: ... } } }' instead.\\")
              id_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { sum: { lte: ... } } }' instead.\\")
              name: StringScalarAggregationFilters
              name_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { eq: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { gte: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lt: ... } } }' instead.\\")
              name_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'name: { averageLength: { lte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { eq: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { gte: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lt: ... } } }' instead.\\")
              name_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { longestLength: { lte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { eq: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { gte: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lt: ... } } }' instead.\\")
              name_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'name: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type MovieActorsRelationship {
              cursor: String!
              node: Actor!
              properties: ActedIn!
            }

            input MovieActorsUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
              where: MovieActorsConnectionWhere
            }

            input MovieActorsUpdateFieldInput {
              connect: [MovieActorsConnectFieldInput!]
              create: [MovieActorsCreateFieldInput!]
              delete: [MovieActorsDeleteFieldInput!]
              disconnect: [MovieActorsDisconnectFieldInput!]
              update: MovieActorsUpdateConnectionInput
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              imdbId: IntAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieConnectInput {
              actors: [MovieActorsConnectFieldInput!]
              directors: MovieDirectorsConnectInput
              reviewers: [MovieReviewersConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actors: MovieActorsFieldInput
              directors: MovieDirectorsCreateInput
              imdbId: Int
              reviewers: MovieReviewersFieldInput
              title: String!
            }

            input MovieDeleteInput {
              actors: [MovieActorsDeleteFieldInput!]
              directors: MovieDirectorsDeleteInput
              reviewers: [MovieReviewersDeleteFieldInput!]
            }

            input MovieDirectorsActorConnectFieldInput {
              connect: [ActorConnectInput!]
              edge: DirectedCreateInput!
              where: ActorConnectWhere
            }

            input MovieDirectorsActorConnectionWhere {
              AND: [MovieDirectorsActorConnectionWhere!]
              NOT: MovieDirectorsActorConnectionWhere
              OR: [MovieDirectorsActorConnectionWhere!]
              edge: DirectedWhere
              node: ActorWhere
            }

            input MovieDirectorsActorCreateFieldInput {
              edge: DirectedCreateInput!
              node: ActorCreateInput!
            }

            input MovieDirectorsActorDeleteFieldInput {
              delete: ActorDeleteInput
              where: MovieDirectorsActorConnectionWhere
            }

            input MovieDirectorsActorDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: MovieDirectorsActorConnectionWhere
            }

            input MovieDirectorsActorFieldInput {
              connect: [MovieDirectorsActorConnectFieldInput!]
              create: [MovieDirectorsActorCreateFieldInput!]
            }

            input MovieDirectorsActorUpdateConnectionInput {
              edge: DirectedUpdateInput
              node: ActorUpdateInput
              where: MovieDirectorsActorConnectionWhere
            }

            input MovieDirectorsActorUpdateFieldInput {
              connect: [MovieDirectorsActorConnectFieldInput!]
              create: [MovieDirectorsActorCreateFieldInput!]
              delete: [MovieDirectorsActorDeleteFieldInput!]
              disconnect: [MovieDirectorsActorDisconnectFieldInput!]
              update: MovieDirectorsActorUpdateConnectionInput
            }

            input MovieDirectorsConnectInput {
              Actor: [MovieDirectorsActorConnectFieldInput!]
              Person: [MovieDirectorsPersonConnectFieldInput!]
            }

            type MovieDirectorsConnection {
              edges: [MovieDirectorsRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieDirectorsConnectionFilters {
              \\"\\"\\"
              Return Movies where all of the related MovieDirectorsConnections match this filter
              \\"\\"\\"
              all: MovieDirectorsConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieDirectorsConnections match this filter
              \\"\\"\\"
              none: MovieDirectorsConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieDirectorsConnections match this filter
              \\"\\"\\"
              single: MovieDirectorsConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieDirectorsConnections match this filter
              \\"\\"\\"
              some: MovieDirectorsConnectionWhere
            }

            input MovieDirectorsConnectionSort {
              edge: DirectedSort
            }

            input MovieDirectorsConnectionWhere {
              Actor: MovieDirectorsActorConnectionWhere
              Person: MovieDirectorsPersonConnectionWhere
            }

            input MovieDirectorsCreateInput {
              Actor: MovieDirectorsActorFieldInput
              Person: MovieDirectorsPersonFieldInput
            }

            input MovieDirectorsDeleteInput {
              Actor: [MovieDirectorsActorDeleteFieldInput!]
              Person: [MovieDirectorsPersonDeleteFieldInput!]
            }

            input MovieDirectorsDisconnectInput {
              Actor: [MovieDirectorsActorDisconnectFieldInput!]
              Person: [MovieDirectorsPersonDisconnectFieldInput!]
            }

            input MovieDirectorsPersonConnectFieldInput {
              connect: [PersonConnectInput!]
              edge: DirectedCreateInput!
              where: PersonConnectWhere
            }

            input MovieDirectorsPersonConnectionWhere {
              AND: [MovieDirectorsPersonConnectionWhere!]
              NOT: MovieDirectorsPersonConnectionWhere
              OR: [MovieDirectorsPersonConnectionWhere!]
              edge: DirectedWhere
              node: PersonWhere
            }

            input MovieDirectorsPersonCreateFieldInput {
              edge: DirectedCreateInput!
              node: PersonCreateInput!
            }

            input MovieDirectorsPersonDeleteFieldInput {
              delete: PersonDeleteInput
              where: MovieDirectorsPersonConnectionWhere
            }

            input MovieDirectorsPersonDisconnectFieldInput {
              disconnect: PersonDisconnectInput
              where: MovieDirectorsPersonConnectionWhere
            }

            input MovieDirectorsPersonFieldInput {
              connect: [MovieDirectorsPersonConnectFieldInput!]
              create: [MovieDirectorsPersonCreateFieldInput!]
            }

            input MovieDirectorsPersonUpdateConnectionInput {
              edge: DirectedUpdateInput
              node: PersonUpdateInput
              where: MovieDirectorsPersonConnectionWhere
            }

            input MovieDirectorsPersonUpdateFieldInput {
              connect: [MovieDirectorsPersonConnectFieldInput!]
              create: [MovieDirectorsPersonCreateFieldInput!]
              delete: [MovieDirectorsPersonDeleteFieldInput!]
              disconnect: [MovieDirectorsPersonDisconnectFieldInput!]
              update: MovieDirectorsPersonUpdateConnectionInput
            }

            type MovieDirectorsRelationship {
              cursor: String!
              node: Director!
              properties: Directed!
            }

            input MovieDirectorsUpdateInput {
              Actor: [MovieDirectorsActorUpdateFieldInput!]
              Person: [MovieDirectorsPersonUpdateFieldInput!]
            }

            input MovieDisconnectInput {
              actors: [MovieActorsDisconnectFieldInput!]
              directors: MovieDirectorsDisconnectInput
              reviewers: [MovieReviewersDisconnectFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
              all: MovieWhere
              \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
              none: MovieWhere
              \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
              single: MovieWhere
              \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
              some: MovieWhere
            }

            type MovieReviewerReviewersAggregateSelection {
              count: CountConnection!
              edge: MovieReviewerReviewersEdgeAggregateSelection
              node: MovieReviewerReviewersNodeAggregateSelection
            }

            type MovieReviewerReviewersEdgeAggregateSelection {
              score: IntAggregateSelection!
            }

            type MovieReviewerReviewersNodeAggregateSelection {
              reputation: IntAggregateSelection!
              reviewerId: IntAggregateSelection!
            }

            input MovieReviewersAggregateInput {
              AND: [MovieReviewersAggregateInput!]
              NOT: MovieReviewersAggregateInput
              OR: [MovieReviewersAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              edge: ReviewAggregationWhereInput
              node: MovieReviewersNodeAggregationWhereInput
            }

            input MovieReviewersConnectFieldInput {
              edge: ReviewCreateInput!
              where: ReviewerConnectWhere
            }

            type MovieReviewersConnection {
              aggregate: MovieReviewerReviewersAggregateSelection!
              edges: [MovieReviewersRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieReviewersConnectionAggregateInput {
              AND: [MovieReviewersConnectionAggregateInput!]
              NOT: MovieReviewersConnectionAggregateInput
              OR: [MovieReviewersConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ReviewAggregationWhereInput
              node: MovieReviewersNodeAggregationWhereInput
            }

            input MovieReviewersConnectionFilters {
              \\"\\"\\"
              Filter Movies by aggregating results on related MovieReviewersConnections
              \\"\\"\\"
              aggregate: MovieReviewersConnectionAggregateInput
              \\"\\"\\"
              Return Movies where all of the related MovieReviewersConnections match this filter
              \\"\\"\\"
              all: MovieReviewersConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieReviewersConnections match this filter
              \\"\\"\\"
              none: MovieReviewersConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieReviewersConnections match this filter
              \\"\\"\\"
              single: MovieReviewersConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieReviewersConnections match this filter
              \\"\\"\\"
              some: MovieReviewersConnectionWhere
            }

            input MovieReviewersConnectionSort {
              edge: ReviewSort
              node: ReviewerSort
            }

            input MovieReviewersConnectionWhere {
              AND: [MovieReviewersConnectionWhere!]
              NOT: MovieReviewersConnectionWhere
              OR: [MovieReviewersConnectionWhere!]
              edge: ReviewWhere
              node: ReviewerWhere
            }

            input MovieReviewersCreateFieldInput {
              edge: ReviewCreateInput!
              node: ReviewerCreateInput!
            }

            input MovieReviewersDeleteFieldInput {
              where: MovieReviewersConnectionWhere
            }

            input MovieReviewersDisconnectFieldInput {
              where: MovieReviewersConnectionWhere
            }

            input MovieReviewersFieldInput {
              connect: [MovieReviewersConnectFieldInput!]
              create: [MovieReviewersCreateFieldInput!]
            }

            input MovieReviewersNodeAggregationWhereInput {
              AND: [MovieReviewersNodeAggregationWhereInput!]
              NOT: MovieReviewersNodeAggregationWhereInput
              OR: [MovieReviewersNodeAggregationWhereInput!]
              reputation: IntScalarAggregationFilters
              reputation_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { average: { eq: ... } } }' instead.\\")
              reputation_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { average: { gt: ... } } }' instead.\\")
              reputation_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { average: { gte: ... } } }' instead.\\")
              reputation_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { average: { lt: ... } } }' instead.\\")
              reputation_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { average: { lte: ... } } }' instead.\\")
              reputation_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { max: { eq: ... } } }' instead.\\")
              reputation_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { max: { gt: ... } } }' instead.\\")
              reputation_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { max: { gte: ... } } }' instead.\\")
              reputation_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { max: { lt: ... } } }' instead.\\")
              reputation_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { max: { lte: ... } } }' instead.\\")
              reputation_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { min: { eq: ... } } }' instead.\\")
              reputation_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { min: { gt: ... } } }' instead.\\")
              reputation_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { min: { gte: ... } } }' instead.\\")
              reputation_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { min: { lt: ... } } }' instead.\\")
              reputation_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { min: { lte: ... } } }' instead.\\")
              reputation_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { sum: { eq: ... } } }' instead.\\")
              reputation_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { sum: { gt: ... } } }' instead.\\")
              reputation_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { sum: { gte: ... } } }' instead.\\")
              reputation_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { sum: { lt: ... } } }' instead.\\")
              reputation_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'reputation: { sum: { lte: ... } } }' instead.\\")
              reviewerId: IntScalarAggregationFilters
              reviewerId_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { average: { eq: ... } } }' instead.\\")
              reviewerId_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { average: { gt: ... } } }' instead.\\")
              reviewerId_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { average: { gte: ... } } }' instead.\\")
              reviewerId_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { average: { lt: ... } } }' instead.\\")
              reviewerId_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { average: { lte: ... } } }' instead.\\")
              reviewerId_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { max: { eq: ... } } }' instead.\\")
              reviewerId_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { max: { gt: ... } } }' instead.\\")
              reviewerId_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { max: { gte: ... } } }' instead.\\")
              reviewerId_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { max: { lt: ... } } }' instead.\\")
              reviewerId_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { max: { lte: ... } } }' instead.\\")
              reviewerId_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { min: { eq: ... } } }' instead.\\")
              reviewerId_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { min: { gt: ... } } }' instead.\\")
              reviewerId_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { min: { gte: ... } } }' instead.\\")
              reviewerId_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { min: { lt: ... } } }' instead.\\")
              reviewerId_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { min: { lte: ... } } }' instead.\\")
              reviewerId_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { sum: { eq: ... } } }' instead.\\")
              reviewerId_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { sum: { gt: ... } } }' instead.\\")
              reviewerId_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { sum: { gte: ... } } }' instead.\\")
              reviewerId_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { sum: { lt: ... } } }' instead.\\")
              reviewerId_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'reviewerId: { sum: { lte: ... } } }' instead.\\")
            }

            type MovieReviewersRelationship {
              cursor: String!
              node: Reviewer!
              properties: Review!
            }

            input MovieReviewersUpdateConnectionInput {
              edge: ReviewUpdateInput
              node: ReviewerUpdateInput
              where: MovieReviewersConnectionWhere
            }

            input MovieReviewersUpdateFieldInput {
              connect: [MovieReviewersConnectFieldInput!]
              create: [MovieReviewersCreateFieldInput!]
              delete: [MovieReviewersDeleteFieldInput!]
              disconnect: [MovieReviewersDisconnectFieldInput!]
              update: MovieReviewersUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              imdbId: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              actors: [MovieActorsUpdateFieldInput!]
              directors: MovieDirectorsUpdateInput
              imdbId: IntScalarMutations
              imdbId_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'imdbId: { decrement: ... } }' instead.\\")
              imdbId_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'imdbId: { increment: ... } }' instead.\\")
              imdbId_SET: Int @deprecated(reason: \\"Please use the generic mutation 'imdbId: { set: ... } }' instead.\\")
              reviewers: [MovieReviewersUpdateFieldInput!]
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: ActorRelationshipFilters
              actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
              actorsConnection: MovieActorsConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieActorsConnections match this filter
              \\"\\"\\"
              actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
              actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
              actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
              actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
              actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
              directors: DirectorRelationshipFilters
              directorsConnection: MovieDirectorsConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieDirectorsConnections match this filter
              \\"\\"\\"
              directorsConnection_ALL: MovieDirectorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorsConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieDirectorsConnections match this filter
              \\"\\"\\"
              directorsConnection_NONE: MovieDirectorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorsConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieDirectorsConnections match this filter
              \\"\\"\\"
              directorsConnection_SINGLE: MovieDirectorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorsConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieDirectorsConnections match this filter
              \\"\\"\\"
              directorsConnection_SOME: MovieDirectorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'directorsConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Directors match this filter\\"\\"\\"
              directors_ALL: DirectorWhere @deprecated(reason: \\"Please use the relevant generic filter 'directors: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Directors match this filter\\"\\"\\"
              directors_NONE: DirectorWhere @deprecated(reason: \\"Please use the relevant generic filter 'directors: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Directors match this filter\\"\\"\\"
              directors_SINGLE: DirectorWhere @deprecated(reason: \\"Please use the relevant generic filter 'directors: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Directors match this filter\\"\\"\\"
              directors_SOME: DirectorWhere @deprecated(reason: \\"Please use the relevant generic filter 'directors: {  some: ... }' instead.\\")
              imdbId: IntScalarFilters
              imdbId_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter imdbId: { eq: ... }\\")
              imdbId_GT: Int @deprecated(reason: \\"Please use the relevant generic filter imdbId: { gt: ... }\\")
              imdbId_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter imdbId: { gte: ... }\\")
              imdbId_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter imdbId: { in: ... }\\")
              imdbId_LT: Int @deprecated(reason: \\"Please use the relevant generic filter imdbId: { lt: ... }\\")
              imdbId_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter imdbId: { lte: ... }\\")
              reviewers: ReviewerRelationshipFilters
              reviewersAggregate: MovieReviewersAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the reviewersConnection filter, please use { reviewersConnection: { aggregate: {...} } } instead\\")
              reviewersConnection: MovieReviewersConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieReviewersConnections match this filter
              \\"\\"\\"
              reviewersConnection_ALL: MovieReviewersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'reviewersConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieReviewersConnections match this filter
              \\"\\"\\"
              reviewersConnection_NONE: MovieReviewersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'reviewersConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieReviewersConnections match this filter
              \\"\\"\\"
              reviewersConnection_SINGLE: MovieReviewersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'reviewersConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieReviewersConnections match this filter
              \\"\\"\\"
              reviewersConnection_SOME: MovieReviewersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'reviewersConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Reviewers match this filter\\"\\"\\"
              reviewers_ALL: ReviewerWhere @deprecated(reason: \\"Please use the relevant generic filter 'reviewers: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Reviewers match this filter\\"\\"\\"
              reviewers_NONE: ReviewerWhere @deprecated(reason: \\"Please use the relevant generic filter 'reviewers: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Reviewers match this filter\\"\\"\\"
              reviewers_SINGLE: ReviewerWhere @deprecated(reason: \\"Please use the relevant generic filter 'reviewers: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Reviewers match this filter\\"\\"\\"
              reviewers_SOME: ReviewerWhere @deprecated(reason: \\"Please use the relevant generic filter 'reviewers: {  some: ... }' instead.\\")
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
              createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
              createInfluencers(input: [InfluencerCreateInput!]!): CreateInfluencersMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
              deleteInfluencers(where: InfluencerWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
              updateInfluencers(update: InfluencerUpdateInput, where: InfluencerWhere): UpdateInfluencersMutationResponse!
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
              aggregate: PersonAggregate!
              edges: [PersonEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Person implements Reviewer {
              id: Int
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [PersonMoviesConnectionSort!], where: PersonMoviesConnectionWhere): PersonMoviesConnection!
              name: String!
              reputation: Int!
              reviewerId: Int
            }

            type PersonAggregate {
              count: Count!
              node: PersonAggregateNode!
            }

            type PersonAggregateNode {
              id: IntAggregateSelection!
              name: StringAggregateSelection!
              reputation: IntAggregateSelection!
              reviewerId: IntAggregateSelection!
            }

            input PersonConnectInput {
              movies: [PersonMoviesConnectFieldInput!]
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            input PersonCreateInput {
              id: Int
              movies: PersonMoviesFieldInput
              name: String!
              reputation: Int!
              reviewerId: Int
            }

            input PersonDeleteInput {
              movies: [PersonMoviesDeleteFieldInput!]
            }

            input PersonDisconnectInput {
              movies: [PersonMoviesDisconnectFieldInput!]
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            type PersonMovieMoviesAggregateSelection {
              count: CountConnection!
              edge: PersonMovieMoviesEdgeAggregateSelection
              node: PersonMovieMoviesNodeAggregateSelection
            }

            type PersonMovieMoviesEdgeAggregateSelection {
              score: IntAggregateSelection!
            }

            type PersonMovieMoviesNodeAggregateSelection {
              imdbId: IntAggregateSelection!
              title: StringAggregateSelection!
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
              edge: ReviewAggregationWhereInput
              node: PersonMoviesNodeAggregationWhereInput
            }

            input PersonMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              edge: ReviewCreateInput!
              where: MovieConnectWhere
            }

            type PersonMoviesConnection {
              aggregate: PersonMovieMoviesAggregateSelection!
              edges: [PersonMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonMoviesConnectionAggregateInput {
              AND: [PersonMoviesConnectionAggregateInput!]
              NOT: PersonMoviesConnectionAggregateInput
              OR: [PersonMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ReviewAggregationWhereInput
              node: PersonMoviesNodeAggregationWhereInput
            }

            input PersonMoviesConnectionFilters {
              \\"\\"\\"
              Filter People by aggregating results on related PersonMoviesConnections
              \\"\\"\\"
              aggregate: PersonMoviesConnectionAggregateInput
              \\"\\"\\"
              Return People where all of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              all: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              none: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return People where one of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              single: PersonMoviesConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              some: PersonMoviesConnectionWhere
            }

            input PersonMoviesConnectionSort {
              edge: ReviewSort
              node: MovieSort
            }

            input PersonMoviesConnectionWhere {
              AND: [PersonMoviesConnectionWhere!]
              NOT: PersonMoviesConnectionWhere
              OR: [PersonMoviesConnectionWhere!]
              edge: ReviewWhere
              node: MovieWhere
            }

            input PersonMoviesCreateFieldInput {
              edge: ReviewCreateInput!
              node: MovieCreateInput!
            }

            input PersonMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: PersonMoviesConnectionWhere
            }

            input PersonMoviesFieldInput {
              connect: [PersonMoviesConnectFieldInput!]
              create: [PersonMoviesCreateFieldInput!]
            }

            input PersonMoviesNodeAggregationWhereInput {
              AND: [PersonMoviesNodeAggregationWhereInput!]
              NOT: PersonMoviesNodeAggregationWhereInput
              OR: [PersonMoviesNodeAggregationWhereInput!]
              imdbId: IntScalarAggregationFilters
              imdbId_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { average: { eq: ... } } }' instead.\\")
              imdbId_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { average: { gt: ... } } }' instead.\\")
              imdbId_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { average: { gte: ... } } }' instead.\\")
              imdbId_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { average: { lt: ... } } }' instead.\\")
              imdbId_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { average: { lte: ... } } }' instead.\\")
              imdbId_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { max: { eq: ... } } }' instead.\\")
              imdbId_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { max: { gt: ... } } }' instead.\\")
              imdbId_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { max: { gte: ... } } }' instead.\\")
              imdbId_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { max: { lt: ... } } }' instead.\\")
              imdbId_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { max: { lte: ... } } }' instead.\\")
              imdbId_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { min: { eq: ... } } }' instead.\\")
              imdbId_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { min: { gt: ... } } }' instead.\\")
              imdbId_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { min: { gte: ... } } }' instead.\\")
              imdbId_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { min: { lt: ... } } }' instead.\\")
              imdbId_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { min: { lte: ... } } }' instead.\\")
              imdbId_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { sum: { eq: ... } } }' instead.\\")
              imdbId_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { sum: { gt: ... } } }' instead.\\")
              imdbId_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { sum: { gte: ... } } }' instead.\\")
              imdbId_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { sum: { lt: ... } } }' instead.\\")
              imdbId_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'imdbId: { sum: { lte: ... } } }' instead.\\")
              title: StringScalarAggregationFilters
              title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
              title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
              title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
              title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
            }

            type PersonMoviesRelationship {
              cursor: String!
              node: Movie!
              properties: Review!
            }

            input PersonMoviesUpdateConnectionInput {
              edge: ReviewUpdateInput
              node: MovieUpdateInput
              where: PersonMoviesConnectionWhere
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
              name: SortDirection
              reputation: SortDirection
              reviewerId: SortDirection
            }

            input PersonUpdateInput {
              id: IntScalarMutations
              id_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'id: { decrement: ... } }' instead.\\")
              id_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'id: { increment: ... } }' instead.\\")
              id_SET: Int @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              movies: [PersonMoviesUpdateFieldInput!]
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
              reputation: IntScalarMutations
              reputation_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'reputation: { decrement: ... } }' instead.\\")
              reputation_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'reputation: { increment: ... } }' instead.\\")
              reputation_SET: Int @deprecated(reason: \\"Please use the generic mutation 'reputation: { set: ... } }' instead.\\")
              reviewerId: IntScalarMutations
              reviewerId_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'reviewerId: { decrement: ... } }' instead.\\")
              reviewerId_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'reviewerId: { increment: ... } }' instead.\\")
              reviewerId_SET: Int @deprecated(reason: \\"Please use the generic mutation 'reviewerId: { set: ... } }' instead.\\")
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              id: IntScalarFilters
              id_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_GT: Int @deprecated(reason: \\"Please use the relevant generic filter id: { gt: ... }\\")
              id_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter id: { gte: ... }\\")
              id_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_LT: Int @deprecated(reason: \\"Please use the relevant generic filter id: { lt: ... }\\")
              id_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter id: { lte: ... }\\")
              movies: MovieRelationshipFilters
              moviesAggregate: PersonMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: PersonMoviesConnectionFilters
              \\"\\"\\"
              Return People where all of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: PersonMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where none of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: PersonMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where one of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: PersonMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return People where some of the related PersonMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: PersonMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return People where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return People where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return People where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return People where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              reputation: IntScalarFilters
              reputation_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { eq: ... }\\")
              reputation_GT: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { gt: ... }\\")
              reputation_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { gte: ... }\\")
              reputation_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter reputation: { in: ... }\\")
              reputation_LT: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { lt: ... }\\")
              reputation_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { lte: ... }\\")
              reviewerId: IntScalarFilters
              reviewerId_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { eq: ... }\\")
              reviewerId_GT: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { gt: ... }\\")
              reviewerId_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { gte: ... }\\")
              reviewerId_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { in: ... }\\")
              reviewerId_LT: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { lt: ... }\\")
              reviewerId_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { lte: ... }\\")
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              directors(limit: Int, offset: Int, where: DirectorWhere): [Director!]!
              influencers(limit: Int, offset: Int, sort: [InfluencerSort!], where: InfluencerWhere): [Influencer!]!
              influencersConnection(after: String, first: Int, sort: [InfluencerSort!], where: InfluencerWhere): InfluencersConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
              reviewers(limit: Int, offset: Int, sort: [ReviewerSort!], where: ReviewerWhere): [Reviewer!]!
              reviewersConnection(after: String, first: Int, sort: [ReviewerSort!], where: ReviewerWhere): ReviewersConnection!
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.reviewers
            * Person.movies
            \\"\\"\\"
            type Review {
              score: Int!
            }

            input ReviewAggregationWhereInput {
              AND: [ReviewAggregationWhereInput!]
              NOT: ReviewAggregationWhereInput
              OR: [ReviewAggregationWhereInput!]
              score: IntScalarAggregationFilters
              score_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'score: { average: { eq: ... } } }' instead.\\")
              score_AVERAGE_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'score: { average: { gt: ... } } }' instead.\\")
              score_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'score: { average: { gte: ... } } }' instead.\\")
              score_AVERAGE_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'score: { average: { lt: ... } } }' instead.\\")
              score_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'score: { average: { lte: ... } } }' instead.\\")
              score_MAX_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { max: { eq: ... } } }' instead.\\")
              score_MAX_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { max: { gt: ... } } }' instead.\\")
              score_MAX_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { max: { gte: ... } } }' instead.\\")
              score_MAX_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { max: { lt: ... } } }' instead.\\")
              score_MAX_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { max: { lte: ... } } }' instead.\\")
              score_MIN_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { min: { eq: ... } } }' instead.\\")
              score_MIN_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { min: { gt: ... } } }' instead.\\")
              score_MIN_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { min: { gte: ... } } }' instead.\\")
              score_MIN_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { min: { lt: ... } } }' instead.\\")
              score_MIN_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { min: { lte: ... } } }' instead.\\")
              score_SUM_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { sum: { eq: ... } } }' instead.\\")
              score_SUM_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { sum: { gt: ... } } }' instead.\\")
              score_SUM_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { sum: { gte: ... } } }' instead.\\")
              score_SUM_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { sum: { lt: ... } } }' instead.\\")
              score_SUM_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'score: { sum: { lte: ... } } }' instead.\\")
            }

            input ReviewCreateInput {
              score: Int!
            }

            input ReviewSort {
              score: SortDirection
            }

            input ReviewUpdateInput {
              score: IntScalarMutations
              score_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'score: { decrement: ... } }' instead.\\")
              score_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'score: { increment: ... } }' instead.\\")
              score_SET: Int @deprecated(reason: \\"Please use the generic mutation 'score: { set: ... } }' instead.\\")
            }

            input ReviewWhere {
              AND: [ReviewWhere!]
              NOT: ReviewWhere
              OR: [ReviewWhere!]
              score: IntScalarFilters
              score_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter score: { eq: ... }\\")
              score_GT: Int @deprecated(reason: \\"Please use the relevant generic filter score: { gt: ... }\\")
              score_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter score: { gte: ... }\\")
              score_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter score: { in: ... }\\")
              score_LT: Int @deprecated(reason: \\"Please use the relevant generic filter score: { lt: ... }\\")
              score_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter score: { lte: ... }\\")
            }

            interface Reviewer {
              reputation: Int!
              reviewerId: Int
            }

            type ReviewerAggregate {
              count: Count!
              node: ReviewerAggregateNode!
            }

            type ReviewerAggregateNode {
              reputation: IntAggregateSelection!
              reviewerId: IntAggregateSelection!
            }

            input ReviewerConnectWhere {
              node: ReviewerWhere!
            }

            input ReviewerCreateInput {
              Influencer: InfluencerCreateInput
              Person: PersonCreateInput
            }

            type ReviewerEdge {
              cursor: String!
              node: Reviewer!
            }

            enum ReviewerImplementation {
              Influencer
              Person
            }

            input ReviewerRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Reviewers match this filter\\"\\"\\"
              all: ReviewerWhere
              \\"\\"\\"Filter type where none of the related Reviewers match this filter\\"\\"\\"
              none: ReviewerWhere
              \\"\\"\\"Filter type where one of the related Reviewers match this filter\\"\\"\\"
              single: ReviewerWhere
              \\"\\"\\"Filter type where some of the related Reviewers match this filter\\"\\"\\"
              some: ReviewerWhere
            }

            \\"\\"\\"
            Fields to sort Reviewers by. The order in which sorts are applied is not guaranteed when specifying many fields in one ReviewerSort object.
            \\"\\"\\"
            input ReviewerSort {
              reputation: SortDirection
              reviewerId: SortDirection
            }

            input ReviewerUpdateInput {
              reputation: IntScalarMutations
              reputation_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'reputation: { decrement: ... } }' instead.\\")
              reputation_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'reputation: { increment: ... } }' instead.\\")
              reputation_SET: Int @deprecated(reason: \\"Please use the generic mutation 'reputation: { set: ... } }' instead.\\")
              reviewerId: IntScalarMutations
              reviewerId_DECREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'reviewerId: { decrement: ... } }' instead.\\")
              reviewerId_INCREMENT: Int @deprecated(reason: \\"Please use the relevant generic mutation 'reviewerId: { increment: ... } }' instead.\\")
              reviewerId_SET: Int @deprecated(reason: \\"Please use the generic mutation 'reviewerId: { set: ... } }' instead.\\")
            }

            input ReviewerWhere {
              AND: [ReviewerWhere!]
              NOT: ReviewerWhere
              OR: [ReviewerWhere!]
              reputation: IntScalarFilters
              reputation_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { eq: ... }\\")
              reputation_GT: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { gt: ... }\\")
              reputation_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { gte: ... }\\")
              reputation_IN: [Int!] @deprecated(reason: \\"Please use the relevant generic filter reputation: { in: ... }\\")
              reputation_LT: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { lt: ... }\\")
              reputation_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter reputation: { lte: ... }\\")
              reviewerId: IntScalarFilters
              reviewerId_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { eq: ... }\\")
              reviewerId_GT: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { gt: ... }\\")
              reviewerId_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { gte: ... }\\")
              reviewerId_IN: [Int] @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { in: ... }\\")
              reviewerId_LT: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { lt: ... }\\")
              reviewerId_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter reviewerId: { lte: ... }\\")
              typename: [ReviewerImplementation!]
            }

            type ReviewersConnection {
              aggregate: ReviewerAggregate!
              edges: [ReviewerEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
            input StringScalarAggregationFilters {
              averageLength: FloatScalarFilters
              longestLength: IntScalarFilters
              shortestLength: IntScalarFilters
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

            type UpdateActorsMutationResponse {
              actors: [Actor!]!
              info: UpdateInfo!
            }

            type UpdateInfluencersMutationResponse {
              influencers: [Influencer!]!
              info: UpdateInfo!
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
            }"
        `);
    });
});
