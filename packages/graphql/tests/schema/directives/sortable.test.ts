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
import type { GraphQLInputObjectType } from "graphql";
import { lexicographicSortSchema } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";

describe("@sortable directive", () => {
    describe("on SCALAR", () => {
        test("default arguments should enable sorting by value", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    title: String @sortable
                    runtime: Int
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();
            const movieSortType = schema.getType("MovieSort") as GraphQLInputObjectType;

            expect(movieSortType).toBeDefined();

            const movieSortFields = movieSortType.getFields();

            const title = movieSortFields["title"];

            expect(title).toBeDefined();

            const runtime = movieSortFields["runtime"];

            expect(runtime).toBeDefined();
        });

        test("disable sorting by value", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    title: String @sortable(byValue: false)
                    runtime: Int
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();
            const movieSortType = schema.getType("MovieSort") as GraphQLInputObjectType;

            expect(movieSortType).toBeDefined();

            const movieSortFields = movieSortType.getFields();

            const title = movieSortFields["title"];

            expect(title).toBeUndefined();

            const runtime = movieSortFields["runtime"];

            expect(runtime).toBeDefined();
        });
    });

    describe("snapshot tests", () => {
        describe("on SCALAR", () => {
            test("default arguments should enable sorting by value", async () => {
                const typeDefs = gql`
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String @sortable
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
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
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
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
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
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
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
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
                    }

                    input ActorMoviesUpdateConnectionInput {
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
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
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
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
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

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
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

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregateSelection {
                      count: CountConnection!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
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
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
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
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
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
                      NOT: MovieActorsNodeAggregationWhereInput
                      OR: [MovieActorsNodeAggregationWhereInput!]
                      password: StringScalarAggregationFilters
                      password_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { eq: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gte: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { eq: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { eq: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lte: ... } } }' instead.\\")
                      username: StringScalarAggregationFilters
                      username_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { eq: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gte: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { eq: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { eq: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsUpdateConnectionInput {
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
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
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

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
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
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
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
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
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
                    }"
                `);
            });

            test("disable sorting by value", async () => {
                const typeDefs = gql`
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String @sortable(byValue: false)
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(limit: Int, offset: Int, where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
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
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
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
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
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

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
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
                    }

                    input ActorMoviesUpdateConnectionInput {
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
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
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
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
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

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
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

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregateSelection {
                      count: CountConnection!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
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
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
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
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
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
                      NOT: MovieActorsNodeAggregationWhereInput
                      OR: [MovieActorsNodeAggregationWhereInput!]
                      password: StringScalarAggregationFilters
                      password_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { eq: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gte: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { eq: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { eq: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lte: ... } } }' instead.\\")
                      username: StringScalarAggregationFilters
                      username_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { eq: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gte: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { eq: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { eq: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsUpdateConnectionInput {
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
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
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

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
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
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
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
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, where: MovieWhere): MoviesConnection!
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
                    }"
                `);
            });
        });
    });
});
