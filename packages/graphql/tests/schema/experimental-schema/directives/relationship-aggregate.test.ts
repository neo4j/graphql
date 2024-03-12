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
import type { GraphQLFieldMap, GraphQLObjectType } from "graphql";
import { lexicographicSortSchema } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../../src";

describe("@relationship directive, aggregate argument", () => {
    test("the default behavior should enable nested aggregation (this will change in 4.0)", async () => {
        const typeDefs = gql`
            type Actor {
                username: String!
                password: String!
            }

            type Movie {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();
        const movieType = schema.getType("Movie") as GraphQLObjectType;
        expect(movieType).toBeDefined();

        const movieFields = movieType.getFields();
        const movieActorsAggregate = movieFields["actorsAggregate"];
        expect(movieActorsAggregate).toBeDefined();

        const movieActorActorsAggregationSelection = schema.getType(
            "MovieActorActorsAggregationSelection"
        ) as GraphQLObjectType;
        expect(movieActorActorsAggregationSelection).toBeDefined();
    });

    test("should disable nested aggregation", async () => {
        const typeDefs = gql`
            type Actor {
                username: String!
                password: String!
            }

            type Movie {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: false)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();
        const movieType = schema.getType("Movie") as GraphQLObjectType;
        expect(movieType).toBeDefined();

        const movieFields = movieType.getFields();
        const movieActorsAggregate = movieFields["actorsAggregate"];
        expect(movieActorsAggregate).toBeUndefined();

        const movieActorActorsAggregationSelection = schema.getType(
            "MovieActorActorsAggregationSelection"
        ) as GraphQLObjectType;
        expect(movieActorActorsAggregationSelection).toBeUndefined();
    });

    test("should enable nested aggregation", async () => {
        const typeDefs = gql`
            type Actor {
                username: String!
                password: String!
            }

            type Movie {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: true)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();
        const movieType = schema.getType("Movie") as GraphQLObjectType;
        expect(movieType).toBeDefined();

        const movieFields = movieType.getFields();
        const movieActorsAggregate = movieFields["actorsAggregate"];
        expect(movieActorsAggregate).toBeDefined();

        const movieActorActorsAggregationSelection = schema.getType(
            "MovieActorActorsAggregationSelection"
        ) as GraphQLObjectType;
        expect(movieActorActorsAggregationSelection).toBeDefined();
    });

    test("should work in conjunction with @query aggregate:false and @relationship aggregate:true", async () => {
        const typeDefs = gql`
            type Actor @query(aggregate: false) {
                username: String!
                password: String!
            }

            type Movie {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: true)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();
        const movieType = schema.getType("Movie") as GraphQLObjectType;
        expect(movieType).toBeDefined();

        const movieFields = movieType.getFields();
        const movieActorsAggregate = movieFields["actorsAggregate"];
        expect(movieActorsAggregate).toBeDefined();

        const queryFields = schema.getQueryType()?.getFields() as GraphQLFieldMap<any, any>;

        const movies = queryFields["movies"];
        const actors = queryFields["actors"];

        expect(movies).toBeDefined();
        expect(actors).toBeDefined();

        const moviesConnection = queryFields["moviesConnection"];
        const actorsConnection = queryFields["actorsConnection"];

        expect(moviesConnection).toBeDefined();
        expect(actorsConnection).toBeDefined();

        const moviesAggregate = queryFields["moviesAggregate"];
        const actorsAggregate = queryFields["actorsAggregate"];

        expect(moviesAggregate).toBeDefined();
        expect(actorsAggregate).toBeUndefined();

        const movieActorActorsAggregationSelection = schema.getType(
            "MovieActorActorsAggregationSelection"
        ) as GraphQLObjectType;
        expect(movieActorActorsAggregationSelection).toBeDefined();
    });

    test("should work in conjunction with @query aggregate:true and @relationship aggregate:false", async () => {
        const typeDefs = gql`
            type Actor @query(aggregate: true) {
                username: String!
                password: String!
            }

            type Movie {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: false)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();
        const movieType = schema.getType("Movie") as GraphQLObjectType;
        expect(movieType).toBeDefined();

        const movieFields = movieType.getFields();
        const movieActorsAggregate = movieFields["actorsAggregate"];
        expect(movieActorsAggregate).toBeUndefined();

        const queryFields = schema.getQueryType()?.getFields() as GraphQLFieldMap<any, any>;

        const movies = queryFields["movies"];
        const actors = queryFields["actors"];

        expect(movies).toBeDefined();
        expect(actors).toBeDefined();

        const moviesConnection = queryFields["moviesConnection"];
        const actorsConnection = queryFields["actorsConnection"];

        expect(moviesConnection).toBeDefined();
        expect(actorsConnection).toBeDefined();

        const moviesAggregate = queryFields["moviesAggregate"];
        const actorsAggregate = queryFields["actorsAggregate"];

        expect(moviesAggregate).toBeDefined();
        expect(actorsAggregate).toBeDefined();

        const movieActorActorsAggregationSelection = schema.getType(
            "MovieActorActorsAggregationSelection"
        ) as GraphQLObjectType;
        expect(movieActorActorsAggregationSelection).toBeUndefined();
    });

    describe("snapshot tests", () => {
        test("aggregate argument set as false", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: false)
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  password: String!
                  username: String!
                }

                type ActorAggregateSelection {
                  count: Int!
                  password: StringAggregateSelection!
                  username: StringAggregateSelection!
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  password: String!
                  username: String!
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
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
                  password: SortDirection
                  username: SortDirection
                }

                input ActorUpdateInput {
                  password: String
                  username: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  password: String
                  password_CONTAINS: String
                  password_ENDS_WITH: String
                  password_IN: [String!]
                  password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_STARTS_WITH: String
                  username: String
                  username_CONTAINS: String
                  username_ENDS_WITH: String
                  username_IN: [String!]
                  username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_STARTS_WITH: String
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

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Movie {
                  actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  title: String
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
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: ActorWhere
                  node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
                  password_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_AVERAGE_LENGTH_EQUAL: Float
                  password_AVERAGE_LENGTH_GT: Float
                  password_AVERAGE_LENGTH_GTE: Float
                  password_AVERAGE_LENGTH_LT: Float
                  password_AVERAGE_LENGTH_LTE: Float
                  password_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  password_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  password_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  password_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_LONGEST_LENGTH_EQUAL: Int
                  password_LONGEST_LENGTH_GT: Int
                  password_LONGEST_LENGTH_GTE: Int
                  password_LONGEST_LENGTH_LT: Int
                  password_LONGEST_LENGTH_LTE: Int
                  password_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  password_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  password_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_SHORTEST_LENGTH_EQUAL: Int
                  password_SHORTEST_LENGTH_GT: Int
                  password_SHORTEST_LENGTH_GTE: Int
                  password_SHORTEST_LENGTH_LT: Int
                  password_SHORTEST_LENGTH_LTE: Int
                  password_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_AVERAGE_LENGTH_EQUAL: Float
                  username_AVERAGE_LENGTH_GT: Float
                  username_AVERAGE_LENGTH_GTE: Float
                  username_AVERAGE_LENGTH_LT: Float
                  username_AVERAGE_LENGTH_LTE: Float
                  username_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  username_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  username_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  username_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_LONGEST_LENGTH_EQUAL: Int
                  username_LONGEST_LENGTH_GT: Int
                  username_LONGEST_LENGTH_GTE: Int
                  username_LONGEST_LENGTH_LT: Int
                  username_LONGEST_LENGTH_LTE: Int
                  username_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  username_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  username_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_SHORTEST_LENGTH_EQUAL: Int
                  username_SHORTEST_LENGTH_GT: Int
                  username_SHORTEST_LENGTH_GTE: Int
                  username_SHORTEST_LENGTH_LT: Int
                  username_SHORTEST_LENGTH_LTE: Int
                  username_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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
                  title: StringAggregateSelection!
                }

                input MovieConnectInput {
                  actors: [MovieActorsConnectFieldInput!]
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
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  title: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
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
                  \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere
                  \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere
                  actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere
                  \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere
                  title: String
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_IN: [String]
                  title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                  actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
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

                type UpdateActorsMutationResponse {
                  actors: [Actor!]!
                  info: UpdateInfo!
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
                }"
            `);
        });

        test("argument set as true", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: true)
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  password: String!
                  username: String!
                }

                type ActorAggregateSelection {
                  count: Int!
                  password: StringAggregateSelection!
                  username: StringAggregateSelection!
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  password: String!
                  username: String!
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
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
                  password: SortDirection
                  username: SortDirection
                }

                input ActorUpdateInput {
                  password: String
                  username: String
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  password: String
                  password_CONTAINS: String
                  password_ENDS_WITH: String
                  password_IN: [String!]
                  password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  password_STARTS_WITH: String
                  username: String
                  username_CONTAINS: String
                  username_ENDS_WITH: String
                  username_IN: [String!]
                  username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  username_STARTS_WITH: String
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

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Movie {
                  actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
                  actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                  actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  title: String
                }

                type MovieActorActorsAggregationSelection {
                  count: Int!
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
                  NOT: MovieActorsConnectionWhere
                  OR: [MovieActorsConnectionWhere!]
                  node: ActorWhere
                  node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
                  password_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_AVERAGE_LENGTH_EQUAL: Float
                  password_AVERAGE_LENGTH_GT: Float
                  password_AVERAGE_LENGTH_GTE: Float
                  password_AVERAGE_LENGTH_LT: Float
                  password_AVERAGE_LENGTH_LTE: Float
                  password_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  password_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  password_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  password_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_LONGEST_LENGTH_EQUAL: Int
                  password_LONGEST_LENGTH_GT: Int
                  password_LONGEST_LENGTH_GTE: Int
                  password_LONGEST_LENGTH_LT: Int
                  password_LONGEST_LENGTH_LTE: Int
                  password_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  password_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  password_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_SHORTEST_LENGTH_EQUAL: Int
                  password_SHORTEST_LENGTH_GT: Int
                  password_SHORTEST_LENGTH_GTE: Int
                  password_SHORTEST_LENGTH_LT: Int
                  password_SHORTEST_LENGTH_LTE: Int
                  password_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  password_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_AVERAGE_LENGTH_EQUAL: Float
                  username_AVERAGE_LENGTH_GT: Float
                  username_AVERAGE_LENGTH_GTE: Float
                  username_AVERAGE_LENGTH_LT: Float
                  username_AVERAGE_LENGTH_LTE: Float
                  username_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  username_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  username_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  username_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_LONGEST_LENGTH_EQUAL: Int
                  username_LONGEST_LENGTH_GT: Int
                  username_LONGEST_LENGTH_GTE: Int
                  username_LONGEST_LENGTH_LT: Int
                  username_LONGEST_LENGTH_LTE: Int
                  username_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  username_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                  username_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_SHORTEST_LENGTH_EQUAL: Int
                  username_SHORTEST_LENGTH_GT: Int
                  username_SHORTEST_LENGTH_GTE: Int
                  username_SHORTEST_LENGTH_LT: Int
                  username_SHORTEST_LENGTH_LTE: Int
                  username_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                  username_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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
                  title: StringAggregateSelection!
                }

                input MovieConnectInput {
                  actors: [MovieActorsConnectFieldInput!]
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
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  title: String
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
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
                  \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere
                  \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere
                  actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                  \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere
                  \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere
                  title: String
                  title_CONTAINS: String
                  title_ENDS_WITH: String
                  title_IN: [String]
                  title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                  title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                  actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                  movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                  moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                  moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
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

                type UpdateActorsMutationResponse {
                  actors: [Actor!]!
                  info: UpdateInfo!
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
                }"
            `);
        });

        describe("on INTERFACE", () => {
            test("aggregate argument set as false, (no-op as abstract does not support aggregation)", async () => {
                const typeDefs = gql`
                    type Actor implements Person {
                        username: String!
                        password: String!
                    }

                    interface Person {
                        username: String!
                        password: String!
                    }

                    type Movie {
                        title: String
                        actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: false)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor implements Person {
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorCreateInput {
                      password: String!
                      username: String!
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
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
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      password: String
                      username: String
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
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

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
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
                      password_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LENGTH_EQUAL: Float
                      password_AVERAGE_LENGTH_GT: Float
                      password_AVERAGE_LENGTH_GTE: Float
                      password_AVERAGE_LENGTH_LT: Float
                      password_AVERAGE_LENGTH_LTE: Float
                      password_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LENGTH_EQUAL: Int
                      password_LONGEST_LENGTH_GT: Int
                      password_LONGEST_LENGTH_GTE: Int
                      password_LONGEST_LENGTH_LT: Int
                      password_LONGEST_LENGTH_LTE: Int
                      password_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int
                      password_SHORTEST_LENGTH_GT: Int
                      password_SHORTEST_LENGTH_GTE: Int
                      password_SHORTEST_LENGTH_LT: Int
                      password_SHORTEST_LENGTH_LTE: Int
                      password_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LENGTH_EQUAL: Float
                      username_AVERAGE_LENGTH_GT: Float
                      username_AVERAGE_LENGTH_GTE: Float
                      username_AVERAGE_LENGTH_LT: Float
                      username_AVERAGE_LENGTH_LTE: Float
                      username_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LENGTH_EQUAL: Int
                      username_LONGEST_LENGTH_GT: Int
                      username_LONGEST_LENGTH_GTE: Int
                      username_LONGEST_LENGTH_LT: Int
                      username_LONGEST_LENGTH_LTE: Int
                      username_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int
                      username_SHORTEST_LENGTH_GT: Int
                      username_SHORTEST_LENGTH_GTE: Int
                      username_SHORTEST_LENGTH_LT: Int
                      username_SHORTEST_LENGTH_LTE: Int
                      username_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
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
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
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
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

                    type PeopleConnection {
                      edges: [PersonEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    interface Person {
                      password: String!
                      username: String!
                    }

                    type PersonAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input PersonConnectWhere {
                      node: PersonWhere!
                    }

                    input PersonCreateInput {
                      Actor: ActorCreateInput
                    }

                    type PersonEdge {
                      cursor: String!
                      node: Person!
                    }

                    enum PersonImplementation {
                      Actor
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
                      password: SortDirection
                      username: SortDirection
                    }

                    input PersonUpdateInput {
                      password: String
                      username: String
                    }

                    input PersonWhere {
                      AND: [PersonWhere!]
                      NOT: PersonWhere
                      OR: [PersonWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      typename_IN: [PersonImplementation!]
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
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

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
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
                    }"
                `);
            });
            test("aggregate argument set as true, (no-op as abstract does not support aggregation)", async () => {
                const typeDefs = gql`
                    type Actor implements Person {
                        username: String!
                        password: String!
                    }

                    interface Person {
                        username: String!
                        password: String!
                    }

                    type Movie {
                        title: String
                        actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: true)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor implements Person {
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorCreateInput {
                      password: String!
                      username: String!
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
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
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      password: String
                      username: String
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
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

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                      actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
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
                      password_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LENGTH_EQUAL: Float
                      password_AVERAGE_LENGTH_GT: Float
                      password_AVERAGE_LENGTH_GTE: Float
                      password_AVERAGE_LENGTH_LT: Float
                      password_AVERAGE_LENGTH_LTE: Float
                      password_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LENGTH_EQUAL: Int
                      password_LONGEST_LENGTH_GT: Int
                      password_LONGEST_LENGTH_GTE: Int
                      password_LONGEST_LENGTH_LT: Int
                      password_LONGEST_LENGTH_LTE: Int
                      password_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int
                      password_SHORTEST_LENGTH_GT: Int
                      password_SHORTEST_LENGTH_GTE: Int
                      password_SHORTEST_LENGTH_LT: Int
                      password_SHORTEST_LENGTH_LTE: Int
                      password_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LENGTH_EQUAL: Float
                      username_AVERAGE_LENGTH_GT: Float
                      username_AVERAGE_LENGTH_GTE: Float
                      username_AVERAGE_LENGTH_LT: Float
                      username_AVERAGE_LENGTH_LTE: Float
                      username_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LENGTH_EQUAL: Int
                      username_LONGEST_LENGTH_GT: Int
                      username_LONGEST_LENGTH_GTE: Int
                      username_LONGEST_LENGTH_LT: Int
                      username_LONGEST_LENGTH_LTE: Int
                      username_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int
                      username_SHORTEST_LENGTH_GT: Int
                      username_SHORTEST_LENGTH_GTE: Int
                      username_SHORTEST_LENGTH_LT: Int
                      username_SHORTEST_LENGTH_LTE: Int
                      username_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
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
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
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
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
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
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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

                    type PeopleConnection {
                      edges: [PersonEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    interface Person {
                      password: String!
                      username: String!
                    }

                    type PersonAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input PersonConnectWhere {
                      node: PersonWhere!
                    }

                    input PersonCreateInput {
                      Actor: ActorCreateInput
                    }

                    type PersonEdge {
                      cursor: String!
                      node: Person!
                    }

                    enum PersonImplementation {
                      Actor
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
                      password: SortDirection
                      username: SortDirection
                    }

                    input PersonUpdateInput {
                      password: String
                      username: String
                    }

                    input PersonWhere {
                      AND: [PersonWhere!]
                      NOT: PersonWhere
                      OR: [PersonWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      typename_IN: [PersonImplementation!]
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
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

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
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
                    }"
                `);
            });
        });

        describe("on UNION", () => {
            test("aggregate argument set as false, (no-op as abstract does not support aggregation)", async () => {
                const typeDefs = gql`
                    type Actor {
                        username: String!
                        password: String!
                    }

                    type Person {
                        name: String!
                    }

                    union CastMember = Actor | Person

                    type Movie {
                        title: String
                        actors: [CastMember!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: false)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      password: String!
                      username: String!
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
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
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      password: String
                      username: String
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    union CastMember = Actor | Person

                    input CastMemberWhere {
                      Actor: ActorWhere
                      Person: PersonWhere
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
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

                    type Movie {
                      actors(directed: Boolean = true, options: QueryOptions, where: CastMemberWhere): [CastMember!]!
                      actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    input MovieActorsActorConnectFieldInput {
                      where: ActorConnectWhere
                    }

                    input MovieActorsActorConnectionWhere {
                      AND: [MovieActorsActorConnectionWhere!]
                      NOT: MovieActorsActorConnectionWhere
                      OR: [MovieActorsActorConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsActorCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsActorDeleteFieldInput {
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorDisconnectFieldInput {
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                    }

                    input MovieActorsActorUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsActorUpdateFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                      delete: [MovieActorsActorDeleteFieldInput!]
                      disconnect: [MovieActorsActorDisconnectFieldInput!]
                      update: MovieActorsActorUpdateConnectionInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsConnectInput {
                      Actor: [MovieActorsActorConnectFieldInput!]
                      Person: [MovieActorsPersonConnectFieldInput!]
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionWhere {
                      Actor: MovieActorsActorConnectionWhere
                      Person: MovieActorsPersonConnectionWhere
                    }

                    input MovieActorsCreateFieldInput {
                      Actor: [MovieActorsActorCreateFieldInput!]
                      Person: [MovieActorsPersonCreateFieldInput!]
                    }

                    input MovieActorsCreateInput {
                      Actor: MovieActorsActorFieldInput
                      Person: MovieActorsPersonFieldInput
                    }

                    input MovieActorsDeleteInput {
                      Actor: [MovieActorsActorDeleteFieldInput!]
                      Person: [MovieActorsPersonDeleteFieldInput!]
                    }

                    input MovieActorsDisconnectInput {
                      Actor: [MovieActorsActorDisconnectFieldInput!]
                      Person: [MovieActorsPersonDisconnectFieldInput!]
                    }

                    input MovieActorsPersonConnectFieldInput {
                      where: PersonConnectWhere
                    }

                    input MovieActorsPersonConnectionWhere {
                      AND: [MovieActorsPersonConnectionWhere!]
                      NOT: MovieActorsPersonConnectionWhere
                      OR: [MovieActorsPersonConnectionWhere!]
                      node: PersonWhere
                      node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsPersonCreateFieldInput {
                      node: PersonCreateInput!
                    }

                    input MovieActorsPersonDeleteFieldInput {
                      where: MovieActorsPersonConnectionWhere
                    }

                    input MovieActorsPersonDisconnectFieldInput {
                      where: MovieActorsPersonConnectionWhere
                    }

                    input MovieActorsPersonFieldInput {
                      connect: [MovieActorsPersonConnectFieldInput!]
                      create: [MovieActorsPersonCreateFieldInput!]
                    }

                    input MovieActorsPersonUpdateConnectionInput {
                      node: PersonUpdateInput
                    }

                    input MovieActorsPersonUpdateFieldInput {
                      connect: [MovieActorsPersonConnectFieldInput!]
                      create: [MovieActorsPersonCreateFieldInput!]
                      delete: [MovieActorsPersonDeleteFieldInput!]
                      disconnect: [MovieActorsPersonDisconnectFieldInput!]
                      update: MovieActorsPersonUpdateConnectionInput
                      where: MovieActorsPersonConnectionWhere
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: CastMember!
                    }

                    input MovieActorsUpdateInput {
                      Actor: [MovieActorsActorUpdateFieldInput!]
                      Person: [MovieActorsPersonUpdateFieldInput!]
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: MovieActorsConnectInput
                    }

                    input MovieCreateInput {
                      actors: MovieActorsCreateInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: MovieActorsDeleteInput
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

                    input MovieRelationInput {
                      actors: MovieActorsCreateFieldInput
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: String
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: CastMemberWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
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
                      \\"\\"\\"Return Movies where all of the related CastMembers match this filter\\"\\"\\"
                      actors_ALL: CastMemberWhere
                      \\"\\"\\"Return Movies where none of the related CastMembers match this filter\\"\\"\\"
                      actors_NONE: CastMemberWhere
                      actors_NOT: CastMemberWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related CastMembers match this filter\\"\\"\\"
                      actors_SINGLE: CastMemberWhere
                      \\"\\"\\"Return Movies where some of the related CastMembers match this filter\\"\\"\\"
                      actors_SOME: CastMemberWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                      createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                      deleteActors(where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      deletePeople(where: PersonWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                      name: String!
                    }

                    type PersonAggregateSelection {
                      count: Int!
                      name: StringAggregateSelection!
                    }

                    input PersonConnectWhere {
                      node: PersonWhere!
                    }

                    input PersonCreateInput {
                      name: String!
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
                      name_IN: [String!]
                      name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      name_STARTS_WITH: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      castMembers(options: QueryOptions, where: CastMemberWhere): [CastMember!]!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                      people(options: PersonOptions, where: PersonWhere): [Person!]!
                      peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                      peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
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
            test("aggregate argument set as true, (no-op as abstract does not support aggregation)", async () => {
                const typeDefs = gql`
                    type Actor {
                        username: String!
                        password: String!
                    }

                    type Person {
                        name: String!
                    }

                    union CastMember = Actor | Person

                    type Movie {
                        title: String
                        actors: [CastMember!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: true)
                    }
                `;

                const neoSchema = new Neo4jGraphQL({ typeDefs });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      password: String!
                      username: String!
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
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
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      password: String
                      username: String
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    union CastMember = Actor | Person

                    input CastMemberWhere {
                      Actor: ActorWhere
                      Person: PersonWhere
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
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

                    type Movie {
                      actors(directed: Boolean = true, options: QueryOptions, where: CastMemberWhere): [CastMember!]!
                      actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    input MovieActorsActorConnectFieldInput {
                      where: ActorConnectWhere
                    }

                    input MovieActorsActorConnectionWhere {
                      AND: [MovieActorsActorConnectionWhere!]
                      NOT: MovieActorsActorConnectionWhere
                      OR: [MovieActorsActorConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsActorCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsActorDeleteFieldInput {
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorDisconnectFieldInput {
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                    }

                    input MovieActorsActorUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsActorUpdateFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                      delete: [MovieActorsActorDeleteFieldInput!]
                      disconnect: [MovieActorsActorDisconnectFieldInput!]
                      update: MovieActorsActorUpdateConnectionInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsConnectInput {
                      Actor: [MovieActorsActorConnectFieldInput!]
                      Person: [MovieActorsPersonConnectFieldInput!]
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionWhere {
                      Actor: MovieActorsActorConnectionWhere
                      Person: MovieActorsPersonConnectionWhere
                    }

                    input MovieActorsCreateFieldInput {
                      Actor: [MovieActorsActorCreateFieldInput!]
                      Person: [MovieActorsPersonCreateFieldInput!]
                    }

                    input MovieActorsCreateInput {
                      Actor: MovieActorsActorFieldInput
                      Person: MovieActorsPersonFieldInput
                    }

                    input MovieActorsDeleteInput {
                      Actor: [MovieActorsActorDeleteFieldInput!]
                      Person: [MovieActorsPersonDeleteFieldInput!]
                    }

                    input MovieActorsDisconnectInput {
                      Actor: [MovieActorsActorDisconnectFieldInput!]
                      Person: [MovieActorsPersonDisconnectFieldInput!]
                    }

                    input MovieActorsPersonConnectFieldInput {
                      where: PersonConnectWhere
                    }

                    input MovieActorsPersonConnectionWhere {
                      AND: [MovieActorsPersonConnectionWhere!]
                      NOT: MovieActorsPersonConnectionWhere
                      OR: [MovieActorsPersonConnectionWhere!]
                      node: PersonWhere
                      node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsPersonCreateFieldInput {
                      node: PersonCreateInput!
                    }

                    input MovieActorsPersonDeleteFieldInput {
                      where: MovieActorsPersonConnectionWhere
                    }

                    input MovieActorsPersonDisconnectFieldInput {
                      where: MovieActorsPersonConnectionWhere
                    }

                    input MovieActorsPersonFieldInput {
                      connect: [MovieActorsPersonConnectFieldInput!]
                      create: [MovieActorsPersonCreateFieldInput!]
                    }

                    input MovieActorsPersonUpdateConnectionInput {
                      node: PersonUpdateInput
                    }

                    input MovieActorsPersonUpdateFieldInput {
                      connect: [MovieActorsPersonConnectFieldInput!]
                      create: [MovieActorsPersonCreateFieldInput!]
                      delete: [MovieActorsPersonDeleteFieldInput!]
                      disconnect: [MovieActorsPersonDisconnectFieldInput!]
                      update: MovieActorsPersonUpdateConnectionInput
                      where: MovieActorsPersonConnectionWhere
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: CastMember!
                    }

                    input MovieActorsUpdateInput {
                      Actor: [MovieActorsActorUpdateFieldInput!]
                      Person: [MovieActorsPersonUpdateFieldInput!]
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: MovieActorsConnectInput
                    }

                    input MovieCreateInput {
                      actors: MovieActorsCreateInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: MovieActorsDeleteInput
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

                    input MovieRelationInput {
                      actors: MovieActorsCreateFieldInput
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: String
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: CastMemberWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
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
                      \\"\\"\\"Return Movies where all of the related CastMembers match this filter\\"\\"\\"
                      actors_ALL: CastMemberWhere
                      \\"\\"\\"Return Movies where none of the related CastMembers match this filter\\"\\"\\"
                      actors_NONE: CastMemberWhere
                      actors_NOT: CastMemberWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related CastMembers match this filter\\"\\"\\"
                      actors_SINGLE: CastMemberWhere
                      \\"\\"\\"Return Movies where some of the related CastMembers match this filter\\"\\"\\"
                      actors_SOME: CastMemberWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
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
                      createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                      deleteActors(where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      deletePeople(where: PersonWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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
                      name: String!
                    }

                    type PersonAggregateSelection {
                      count: Int!
                      name: StringAggregateSelection!
                    }

                    input PersonConnectWhere {
                      node: PersonWhere!
                    }

                    input PersonCreateInput {
                      name: String!
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
                      name_IN: [String!]
                      name_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      name_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      name_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      name_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      name_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      name_STARTS_WITH: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      castMembers(options: QueryOptions, where: CastMemberWhere): [CastMember!]!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                      people(options: PersonOptions, where: PersonWhere): [Person!]!
                      peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                      peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
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

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
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
    });
});
