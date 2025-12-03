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
import type { GraphQLFieldMap, GraphQLNonNull, GraphQLObjectType } from "graphql";
import { lexicographicSortSchema } from "graphql";
import { Neo4jGraphQL } from "../../../src";

describe("@relationship directive, aggregate argument", () => {
    test("the default behavior should enable nested aggregation", async () => {
        const typeDefs = /* GraphQL */ `
            type Actor @node {
                username: String!
                password: String!
            }

            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();

        const movieType = schema.getType("Movie") as GraphQLObjectType;
        expect(movieType).toBeDefined();

        const { actorsConnection } = movieType.getFields();

        expect(actorsConnection).toBeDefined();

        const { aggregate, edges } = (actorsConnection?.type as GraphQLNonNull<GraphQLObjectType>).ofType.getFields();
        expect(aggregate).toBeDefined();
        expect(edges).toBeDefined();
    });

    test("should disable nested aggregation", async () => {
        const typeDefs = /* GraphQL */ `
            type Actor @node {
                username: String!
                password: String!
            }

            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: false)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();
        const movieType = schema.getType("Movie") as GraphQLObjectType;
        expect(movieType).toBeDefined();

        const { actorsConnection } = movieType.getFields();

        expect(actorsConnection).toBeDefined();

        const { aggregate, edges } = (actorsConnection?.type as GraphQLNonNull<GraphQLObjectType>).ofType.getFields();
        expect(aggregate).toBeUndefined();
        expect(edges).toBeDefined();
    });

    test("should enable nested aggregation", async () => {
        const typeDefs = /* GraphQL */ `
            type Actor @node {
                username: String!
                password: String!
            }

            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: true)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();
        const movieType = schema.getType("Movie") as GraphQLObjectType;
        expect(movieType).toBeDefined();

        const { actorsConnection } = movieType.getFields();

        expect(actorsConnection).toBeDefined();

        const { aggregate, edges } = (actorsConnection?.type as GraphQLNonNull<GraphQLObjectType>).ofType.getFields();
        expect(aggregate).toBeDefined();
        expect(edges).toBeDefined();
    });

    test("should work in conjunction with @query aggregate:false and @relationship aggregate:true", async () => {
        const typeDefs = /* GraphQL */ `
            type Actor @query(aggregate: false) @node {
                username: String!
                password: String!
            }

            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: true)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const schema = await neoSchema.getSchema();
        const movieType = schema.getType("Movie") as GraphQLObjectType;
        expect(movieType).toBeDefined();

        const { actorsConnection } = movieType.getFields();

        expect(actorsConnection).toBeDefined();

        const { aggregate, edges } = (actorsConnection?.type as GraphQLNonNull<GraphQLObjectType>).ofType.getFields();

        expect(aggregate).toBeDefined();
        expect(edges).toBeDefined();

        const { actorsConnection: topLevelActorsConnection } = schema.getQueryType()?.getFields() as GraphQLFieldMap<
            any,
            any
        >;

        expect(topLevelActorsConnection).toBeDefined();

        const { aggregate: topLevelAggregateInsideConnection, edges: topLevelEdgesInsideConnection } = (
            topLevelActorsConnection?.type as GraphQLNonNull<GraphQLObjectType>
        ).ofType.getFields();

        expect(topLevelAggregateInsideConnection).toBeUndefined();
        expect(topLevelEdgesInsideConnection).toBeDefined();
    });

    test("should work in conjunction with @query aggregate:true and @relationship aggregate:false", async () => {
        const typeDefs = /* GraphQL */ `
            type Actor @query(aggregate: true) @node {
                username: String!
                password: String!
            }

            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, aggregate: false)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();
        const movieType = schema.getType("Movie") as GraphQLObjectType;
        expect(movieType).toBeDefined();

        const { actorsConnection } = movieType.getFields();

        expect(actorsConnection).toBeDefined();

        const { aggregate, edges } = (actorsConnection?.type as GraphQLNonNull<GraphQLObjectType>).ofType.getFields();

        expect(aggregate).toBeUndefined();
        expect(edges).toBeDefined();

        const { actorsConnection: topLevelActorsConnection } = schema.getQueryType()?.getFields() as GraphQLFieldMap<
            any,
            any
        >;

        expect(topLevelActorsConnection).toBeDefined();

        const { aggregate: topLevelAggregateInsideConnection, edges: topLevelEdgesInsideConnection } = (
            topLevelActorsConnection?.type as GraphQLNonNull<GraphQLObjectType>
        ).ofType.getFields();

        expect(topLevelAggregateInsideConnection).toBeDefined();
        expect(topLevelEdgesInsideConnection).toBeDefined();
    });

    describe("snapshot tests", () => {
        test("aggregate argument set as false", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @node {
                    username: String!
                    password: String!
                }

                type Movie @node {
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

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
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
                  password: StringScalarMutations
                  password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                  username: StringScalarMutations
                  username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
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
                  where: ActorConnectWhere
                }

                type MovieActorsConnection {
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

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  title: String
                }

                input MovieDeleteInput {
                  actors: [MovieActorsDeleteFieldInput!]
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
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
                  deleteActors(where: ActorWhere): DeleteInfo!
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

        test("argument set as true", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @node {
                    username: String!
                    password: String!
                }

                type Movie @node {
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

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
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
                  password: StringScalarMutations
                  password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                  username: StringScalarMutations
                  username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
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

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  title: String
                }

                input MovieDeleteInput {
                  actors: [MovieActorsDeleteFieldInput!]
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
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
                  deleteActors(where: ActorWhere): DeleteInfo!
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

        describe("on INTERFACE", () => {
            test("aggregate argument set as false, (no-op as abstract does not support aggregation)", async () => {
                const typeDefs = /* GraphQL */ `
                    type Actor implements Person @node {
                        username: String!
                        password: String!
                    }

                    interface Person {
                        username: String!
                        password: String!
                    }

                    type Movie @node {
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

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
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

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
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
                      actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
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
                      where: PersonConnectWhere
                    }

                    type MovieActorsConnection {
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
                      node: PersonSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: PersonWhere
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
                      node: Person!
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: PersonUpdateInput
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

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
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
                      actors: PersonRelationshipFilters
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
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
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
                      deleteActors(where: ActorWhere): DeleteInfo!
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

                    type PeopleConnection {
                      aggregate: PersonAggregate!
                      edges: [PersonEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    interface Person {
                      password: String!
                      username: String!
                    }

                    type PersonAggregate {
                      count: Count!
                      node: PersonAggregateNode!
                    }

                    type PersonAggregateNode {
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

                    input PersonRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related People match this filter\\"\\"\\"
                      all: PersonWhere
                      \\"\\"\\"Filter type where none of the related People match this filter\\"\\"\\"
                      none: PersonWhere
                      \\"\\"\\"Filter type where one of the related People match this filter\\"\\"\\"
                      single: PersonWhere
                      \\"\\"\\"Filter type where some of the related People match this filter\\"\\"\\"
                      some: PersonWhere
                    }

                    \\"\\"\\"
                    Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                    \\"\\"\\"
                    input PersonSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input PersonUpdateInput {
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input PersonWhere {
                      AND: [PersonWhere!]
                      NOT: PersonWhere
                      OR: [PersonWhere!]
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      typename: [PersonImplementation!]
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                      people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
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
            test("aggregate argument set as true, (no-op as abstract does not support aggregation)", async () => {
                const typeDefs = /* GraphQL */ `
                    type Actor implements Person @node {
                        username: String!
                        password: String!
                    }

                    interface Person {
                        username: String!
                        password: String!
                    }

                    type Movie @node {
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

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
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

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
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
                      actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
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
                      where: PersonConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MoviePersonActorsAggregateSelection!
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
                      node: PersonSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: PersonWhere
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
                      node: Person!
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: PersonUpdateInput
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

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MoviePersonActorsAggregateSelection {
                      count: CountConnection!
                      node: MoviePersonActorsNodeAggregateSelection
                    }

                    type MoviePersonActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
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
                      actors: PersonRelationshipFilters
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
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
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
                      deleteActors(where: ActorWhere): DeleteInfo!
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

                    type PeopleConnection {
                      aggregate: PersonAggregate!
                      edges: [PersonEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    interface Person {
                      password: String!
                      username: String!
                    }

                    type PersonAggregate {
                      count: Count!
                      node: PersonAggregateNode!
                    }

                    type PersonAggregateNode {
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

                    input PersonRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related People match this filter\\"\\"\\"
                      all: PersonWhere
                      \\"\\"\\"Filter type where none of the related People match this filter\\"\\"\\"
                      none: PersonWhere
                      \\"\\"\\"Filter type where one of the related People match this filter\\"\\"\\"
                      single: PersonWhere
                      \\"\\"\\"Filter type where some of the related People match this filter\\"\\"\\"
                      some: PersonWhere
                    }

                    \\"\\"\\"
                    Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                    \\"\\"\\"
                    input PersonSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input PersonUpdateInput {
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input PersonWhere {
                      AND: [PersonWhere!]
                      NOT: PersonWhere
                      OR: [PersonWhere!]
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      typename: [PersonImplementation!]
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                      people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
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

        describe("on UNION", () => {
            test("aggregate argument set as false, (no-op as abstract does not support aggregation)", async () => {
                const typeDefs = /* GraphQL */ `
                    type Actor @node {
                        username: String!
                        password: String!
                    }

                    type Person @node {
                        name: String!
                    }

                    union CastMember = Actor | Person

                    type Movie @node {
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

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
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

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
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

                    union CastMember = Actor | Person

                    input CastMemberRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related CastMembers match this filter\\"\\"\\"
                      all: CastMemberWhere
                      \\"\\"\\"Filter type where none of the related CastMembers match this filter\\"\\"\\"
                      none: CastMemberWhere
                      \\"\\"\\"Filter type where one of the related CastMembers match this filter\\"\\"\\"
                      single: CastMemberWhere
                      \\"\\"\\"Filter type where some of the related CastMembers match this filter\\"\\"\\"
                      some: CastMemberWhere
                    }

                    input CastMemberWhere {
                      Actor: ActorWhere
                      Person: PersonWhere
                    }

                    type Count {
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

                    type Movie {
                      actors(limit: Int, offset: Int, where: CastMemberWhere): [CastMember!]!
                      actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
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
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorUpdateFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                      delete: [MovieActorsActorDeleteFieldInput!]
                      disconnect: [MovieActorsActorDisconnectFieldInput!]
                      update: MovieActorsActorUpdateConnectionInput
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionFilters {
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

                    input MovieActorsConnectionWhere {
                      Actor: MovieActorsActorConnectionWhere
                      Person: MovieActorsPersonConnectionWhere
                    }

                    input MovieActorsCreateInput {
                      Actor: MovieActorsActorFieldInput
                      Person: MovieActorsPersonFieldInput
                    }

                    input MovieActorsDeleteInput {
                      Actor: [MovieActorsActorDeleteFieldInput!]
                      Person: [MovieActorsPersonDeleteFieldInput!]
                    }

                    input MovieActorsPersonConnectFieldInput {
                      where: PersonConnectWhere
                    }

                    input MovieActorsPersonConnectionWhere {
                      AND: [MovieActorsPersonConnectionWhere!]
                      NOT: MovieActorsPersonConnectionWhere
                      OR: [MovieActorsPersonConnectionWhere!]
                      node: PersonWhere
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
                      where: MovieActorsPersonConnectionWhere
                    }

                    input MovieActorsPersonUpdateFieldInput {
                      connect: [MovieActorsPersonConnectFieldInput!]
                      create: [MovieActorsPersonCreateFieldInput!]
                      delete: [MovieActorsPersonDeleteFieldInput!]
                      disconnect: [MovieActorsPersonDisconnectFieldInput!]
                      update: MovieActorsPersonUpdateConnectionInput
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: CastMember!
                    }

                    input MovieActorsUpdateInput {
                      Actor: [MovieActorsActorUpdateFieldInput!]
                      Person: [MovieActorsPersonUpdateFieldInput!]
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsCreateInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: MovieActorsDeleteInput
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: CastMemberRelationshipFilters
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
                      \\"\\"\\"Return Movies where all of the related CastMembers match this filter\\"\\"\\"
                      actors_ALL: CastMemberWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related CastMembers match this filter\\"\\"\\"
                      actors_NONE: CastMemberWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related CastMembers match this filter\\"\\"\\"
                      actors_SINGLE: CastMemberWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related CastMembers match this filter\\"\\"\\"
                      actors_SOME: CastMemberWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
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
                      createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                      deleteActors(where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      deletePeople(where: PersonWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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

                    type Person {
                      name: String!
                    }

                    type PersonAggregate {
                      count: Count!
                      node: PersonAggregateNode!
                    }

                    type PersonAggregateNode {
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

                    \\"\\"\\"
                    Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                    \\"\\"\\"
                    input PersonSort {
                      name: SortDirection
                    }

                    input PersonUpdateInput {
                      name: StringScalarMutations
                      name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                    }

                    input PersonWhere {
                      AND: [PersonWhere!]
                      NOT: PersonWhere
                      OR: [PersonWhere!]
                      name: StringScalarFilters
                      name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                      name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                      name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                      name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                      name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      castMembers(limit: Int, offset: Int, where: CastMemberWhere): [CastMember!]!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                      people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
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
                    }

                    type UpdatePeopleMutationResponse {
                      info: UpdateInfo!
                      people: [Person!]!
                    }"
                `);
            });
            test("aggregate argument set as true, (no-op as abstract does not support aggregation)", async () => {
                const typeDefs = /* GraphQL */ `
                    type Actor @node {
                        username: String!
                        password: String!
                    }

                    type Person @node {
                        name: String!
                    }

                    union CastMember = Actor | Person

                    type Movie @node {
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

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
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

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
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

                    union CastMember = Actor | Person

                    input CastMemberRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related CastMembers match this filter\\"\\"\\"
                      all: CastMemberWhere
                      \\"\\"\\"Filter type where none of the related CastMembers match this filter\\"\\"\\"
                      none: CastMemberWhere
                      \\"\\"\\"Filter type where one of the related CastMembers match this filter\\"\\"\\"
                      single: CastMemberWhere
                      \\"\\"\\"Filter type where some of the related CastMembers match this filter\\"\\"\\"
                      some: CastMemberWhere
                    }

                    input CastMemberWhere {
                      Actor: ActorWhere
                      Person: PersonWhere
                    }

                    type Count {
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

                    type Movie {
                      actors(limit: Int, offset: Int, where: CastMemberWhere): [CastMember!]!
                      actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
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
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorUpdateFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                      delete: [MovieActorsActorDeleteFieldInput!]
                      disconnect: [MovieActorsActorDisconnectFieldInput!]
                      update: MovieActorsActorUpdateConnectionInput
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionFilters {
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

                    input MovieActorsConnectionWhere {
                      Actor: MovieActorsActorConnectionWhere
                      Person: MovieActorsPersonConnectionWhere
                    }

                    input MovieActorsCreateInput {
                      Actor: MovieActorsActorFieldInput
                      Person: MovieActorsPersonFieldInput
                    }

                    input MovieActorsDeleteInput {
                      Actor: [MovieActorsActorDeleteFieldInput!]
                      Person: [MovieActorsPersonDeleteFieldInput!]
                    }

                    input MovieActorsPersonConnectFieldInput {
                      where: PersonConnectWhere
                    }

                    input MovieActorsPersonConnectionWhere {
                      AND: [MovieActorsPersonConnectionWhere!]
                      NOT: MovieActorsPersonConnectionWhere
                      OR: [MovieActorsPersonConnectionWhere!]
                      node: PersonWhere
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
                      where: MovieActorsPersonConnectionWhere
                    }

                    input MovieActorsPersonUpdateFieldInput {
                      connect: [MovieActorsPersonConnectFieldInput!]
                      create: [MovieActorsPersonCreateFieldInput!]
                      delete: [MovieActorsPersonDeleteFieldInput!]
                      disconnect: [MovieActorsPersonDisconnectFieldInput!]
                      update: MovieActorsPersonUpdateConnectionInput
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: CastMember!
                    }

                    input MovieActorsUpdateInput {
                      Actor: [MovieActorsActorUpdateFieldInput!]
                      Person: [MovieActorsPersonUpdateFieldInput!]
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsCreateInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: MovieActorsDeleteInput
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: CastMemberRelationshipFilters
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
                      \\"\\"\\"Return Movies where all of the related CastMembers match this filter\\"\\"\\"
                      actors_ALL: CastMemberWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related CastMembers match this filter\\"\\"\\"
                      actors_NONE: CastMemberWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related CastMembers match this filter\\"\\"\\"
                      actors_SINGLE: CastMemberWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related CastMembers match this filter\\"\\"\\"
                      actors_SOME: CastMemberWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
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
                      createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
                      deleteActors(where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      deletePeople(where: PersonWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
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

                    type Person {
                      name: String!
                    }

                    type PersonAggregate {
                      count: Count!
                      node: PersonAggregateNode!
                    }

                    type PersonAggregateNode {
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

                    \\"\\"\\"
                    Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                    \\"\\"\\"
                    input PersonSort {
                      name: SortDirection
                    }

                    input PersonUpdateInput {
                      name: StringScalarMutations
                      name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                    }

                    input PersonWhere {
                      AND: [PersonWhere!]
                      NOT: PersonWhere
                      OR: [PersonWhere!]
                      name: StringScalarFilters
                      name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                      name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                      name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                      name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                      name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      castMembers(limit: Int, offset: Int, where: CastMemberWhere): [CastMember!]!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                      people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
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
