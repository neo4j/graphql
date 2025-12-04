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
import type { GraphQLNamedInputType } from "graphql";
import { gql } from "graphql-tag";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../../src";

describe("Relationship nested operations", () => {
    describe("Related to a concrete type", () => {
        test("Should not generate UpdateFieldInput input with no nested operations", async () => {
            const typeDefs = gql`
                type Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const updateFieldInput = schema.getType("MovieActorsUpdateFieldInput") as GraphQLNamedInputType;
            expect(updateFieldInput).toBeUndefined();

            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));

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

                type CountConnection {
                  edges: Int!
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
                  id: ID
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

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  id: ID
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
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregate {
                  count: Count!
                  node: PersonAggregateNode!
                }

                type PersonAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
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
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type Query {
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

        test("Single relationship with nested operation CREATE specified", async () => {
            const typeDefs = gql`
                type Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
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

                type CountConnection {
                  edges: Int!
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
                  id: ID
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

                input MovieActorsFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregate {
                  count: Count!
                  node: PersonAggregateNode!
                }

                type PersonAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
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
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type Query {
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

        test("Single relationship with nested operation CONNECT specified", async () => {
            const typeDefs = gql`
                type Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT])
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

                type CountConnection {
                  edges: Int!
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
                  id: ID
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

                input MovieActorsFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
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
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
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
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type Query {
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

        test("Single relationship with nested operation UPDATE specified", async () => {
            const typeDefs = gql`
                type Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [UPDATE])
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

                type CountConnection {
                  edges: Int!
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
                  id: ID
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

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                input MovieActorsUpdateConnectionInput {
                  node: PersonUpdateInput
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsUpdateFieldInput {
                  update: MovieActorsUpdateConnectionInput
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  id: ID
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
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregate {
                  count: Count!
                  node: PersonAggregateNode!
                }

                type PersonAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
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
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type Query {
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

        test("Single relationship with nested operation DELETE specified", async () => {
            const typeDefs = gql`
                type Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DELETE])
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

                type CountConnection {
                  edges: Int!
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
                  id: ID
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

                input MovieActorsDeleteFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  delete: [MovieActorsDeleteFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  id: ID
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
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregate {
                  count: Count!
                  node: PersonAggregateNode!
                }

                type PersonAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
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
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type Query {
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

        test("Single relationship with nested operation DISCONNECT specified", async () => {
            const typeDefs = gql`
                type Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DISCONNECT])
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

                type CountConnection {
                  edges: Int!
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
                  id: ID
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

                input MovieActorsDisconnectFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  disconnect: [MovieActorsDisconnectFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  id: ID
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
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregate {
                  count: Count!
                  node: PersonAggregateNode!
                }

                type PersonAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
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
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type Query {
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

        test("Two relationships with nested operations specified on one", async () => {
            const typeDefs = gql`
                type Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                    producers: [Person!]! @relationship(type: "PRODUCED", direction: IN, nestedOperations: [DISCONNECT])
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

                type CountConnection {
                  edges: Int!
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
                  id: ID
                  producers(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  producersConnection(after: String, first: Int, sort: [MovieProducersConnectionSort!], where: MovieProducersConnectionWhere): MovieProducersConnection!
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
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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
                  name: StringAggregateSelection!
                }

                type MoviePersonProducersAggregateSelection {
                  count: CountConnection!
                  node: MoviePersonProducersNodeAggregateSelection
                }

                type MoviePersonProducersNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                input MovieProducersAggregateInput {
                  AND: [MovieProducersAggregateInput!]
                  NOT: MovieProducersAggregateInput
                  OR: [MovieProducersAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: MovieProducersNodeAggregationWhereInput
                }

                type MovieProducersConnection {
                  aggregate: MoviePersonProducersAggregateSelection!
                  edges: [MovieProducersRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieProducersConnectionAggregateInput {
                  AND: [MovieProducersConnectionAggregateInput!]
                  NOT: MovieProducersConnectionAggregateInput
                  OR: [MovieProducersConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: MovieProducersNodeAggregationWhereInput
                }

                input MovieProducersConnectionFilters {
                  \\"\\"\\"
                  Filter Movies by aggregating results on related MovieProducersConnections
                  \\"\\"\\"
                  aggregate: MovieProducersConnectionAggregateInput
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  all: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  none: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  single: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  some: MovieProducersConnectionWhere
                }

                input MovieProducersConnectionSort {
                  node: PersonSort
                }

                input MovieProducersConnectionWhere {
                  AND: [MovieProducersConnectionWhere!]
                  NOT: MovieProducersConnectionWhere
                  OR: [MovieProducersConnectionWhere!]
                  node: PersonWhere
                }

                input MovieProducersDisconnectFieldInput {
                  where: MovieProducersConnectionWhere
                }

                input MovieProducersNodeAggregationWhereInput {
                  AND: [MovieProducersNodeAggregationWhereInput!]
                  NOT: MovieProducersNodeAggregationWhereInput
                  OR: [MovieProducersNodeAggregationWhereInput!]
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

                type MovieProducersRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieProducersUpdateFieldInput {
                  disconnect: [MovieProducersDisconnectFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                  producers: [MovieProducersUpdateFieldInput!]
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                  producers: PersonRelationshipFilters
                  producersAggregate: MovieProducersAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the producersConnection filter, please use { producersConnection: { aggregate: {...} } } instead\\")
                  producersConnection: MovieProducersConnectionFilters
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_ALL: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_NONE: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SINGLE: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SOME: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  producers_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: { all: ... }' instead.\\")
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  producers_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: { none: ... }' instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  producers_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  producers_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: {  some: ... }' instead.\\")
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
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
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
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
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
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type Query {
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

        test("Two relationships with nested operations specified on both", async () => {
            const typeDefs = gql`
                type Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
                    producers: [Person!]! @relationship(type: "PRODUCED", direction: IN, nestedOperations: [DISCONNECT])
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

                type CountConnection {
                  edges: Int!
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
                  id: ID
                  producers(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  producersConnection(after: String, first: Int, sort: [MovieProducersConnectionSort!], where: MovieProducersConnectionWhere): MovieProducersConnection!
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

                input MovieActorsFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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
                  name: StringAggregateSelection!
                }

                type MoviePersonProducersAggregateSelection {
                  count: CountConnection!
                  node: MoviePersonProducersNodeAggregateSelection
                }

                type MoviePersonProducersNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                input MovieProducersAggregateInput {
                  AND: [MovieProducersAggregateInput!]
                  NOT: MovieProducersAggregateInput
                  OR: [MovieProducersAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: MovieProducersNodeAggregationWhereInput
                }

                type MovieProducersConnection {
                  aggregate: MoviePersonProducersAggregateSelection!
                  edges: [MovieProducersRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieProducersConnectionAggregateInput {
                  AND: [MovieProducersConnectionAggregateInput!]
                  NOT: MovieProducersConnectionAggregateInput
                  OR: [MovieProducersConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: MovieProducersNodeAggregationWhereInput
                }

                input MovieProducersConnectionFilters {
                  \\"\\"\\"
                  Filter Movies by aggregating results on related MovieProducersConnections
                  \\"\\"\\"
                  aggregate: MovieProducersConnectionAggregateInput
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  all: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  none: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  single: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  some: MovieProducersConnectionWhere
                }

                input MovieProducersConnectionSort {
                  node: PersonSort
                }

                input MovieProducersConnectionWhere {
                  AND: [MovieProducersConnectionWhere!]
                  NOT: MovieProducersConnectionWhere
                  OR: [MovieProducersConnectionWhere!]
                  node: PersonWhere
                }

                input MovieProducersDisconnectFieldInput {
                  where: MovieProducersConnectionWhere
                }

                input MovieProducersNodeAggregationWhereInput {
                  AND: [MovieProducersNodeAggregationWhereInput!]
                  NOT: MovieProducersNodeAggregationWhereInput
                  OR: [MovieProducersNodeAggregationWhereInput!]
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

                type MovieProducersRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieProducersUpdateFieldInput {
                  disconnect: [MovieProducersDisconnectFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                  producers: [MovieProducersUpdateFieldInput!]
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                  producers: PersonRelationshipFilters
                  producersAggregate: MovieProducersAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the producersConnection filter, please use { producersConnection: { aggregate: {...} } } instead\\")
                  producersConnection: MovieProducersConnectionFilters
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_ALL: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_NONE: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SINGLE: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SOME: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  producers_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: { all: ... }' instead.\\")
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  producers_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: { none: ... }' instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  producers_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  producers_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: {  some: ... }' instead.\\")
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
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Person {
                  name: String
                }

                type PersonAggregate {
                  count: Count!
                  node: PersonAggregateNode!
                }

                type PersonAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  name: String
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
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
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type Query {
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

    describe("Related to a union type", () => {
        test("Should not generate UpdateFieldInput input with no nested operations", async () => {
            const typeDefs = gql`
                type PersonOne @node {
                    name: String
                }

                type PersonTwo @node {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const updateFieldInput = schema.getType("MovieActorsUpdateFieldInput") as GraphQLNamedInputType;
            expect(updateFieldInput).toBeUndefined();

            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
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

                type Movie {
                  actors(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  id: ID
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
                }

                input MovieUpdateInput {
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonRelationshipFilters
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: StringScalarMutations
                  nameTwo_SET: String @deprecated(reason: \\"Please use the generic mutation 'nameTwo: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: StringScalarFilters
                  nameTwo_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { contains: ... }\\")
                  nameTwo_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { endsWith: ... }\\")
                  nameTwo_EQ: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { eq: ... }\\")
                  nameTwo_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { in: ... }\\")
                  nameTwo_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Single relationship with nested operation CREATE specified", async () => {
            const typeDefs = gql`
                type PersonOne @node {
                    name: String
                }

                type PersonTwo @node {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
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

                type Movie {
                  actors(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsCreateInput {
                  PersonOne: MovieActorsPersonOneFieldInput
                  PersonTwo: MovieActorsPersonTwoFieldInput
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                }

                input MovieActorsPersonOneCreateFieldInput {
                  node: PersonOneCreateInput!
                }

                input MovieActorsPersonOneFieldInput {
                  create: [MovieActorsPersonOneCreateFieldInput!]
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  create: [MovieActorsPersonOneCreateFieldInput!]
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                }

                input MovieActorsPersonTwoCreateFieldInput {
                  node: PersonTwoCreateInput!
                }

                input MovieActorsPersonTwoFieldInput {
                  create: [MovieActorsPersonTwoCreateFieldInput!]
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  create: [MovieActorsPersonTwoCreateFieldInput!]
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  actors: MovieActorsCreateInput
                  id: ID
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
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonRelationshipFilters
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: StringScalarMutations
                  nameTwo_SET: String @deprecated(reason: \\"Please use the generic mutation 'nameTwo: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: StringScalarFilters
                  nameTwo_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { contains: ... }\\")
                  nameTwo_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { endsWith: ... }\\")
                  nameTwo_EQ: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { eq: ... }\\")
                  nameTwo_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { in: ... }\\")
                  nameTwo_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Single relationship with nested operation CONNECT specified", async () => {
            const typeDefs = gql`
                type PersonOne @node {
                    name: String
                }

                type PersonTwo @node {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
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

                type Movie {
                  actors(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsCreateInput {
                  PersonOne: MovieActorsPersonOneFieldInput
                  PersonTwo: MovieActorsPersonTwoFieldInput
                }

                input MovieActorsPersonOneConnectFieldInput {
                  where: PersonOneConnectWhere
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                }

                input MovieActorsPersonOneFieldInput {
                  connect: [MovieActorsPersonOneConnectFieldInput!]
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  connect: [MovieActorsPersonOneConnectFieldInput!]
                }

                input MovieActorsPersonTwoConnectFieldInput {
                  where: PersonTwoConnectWhere
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                }

                input MovieActorsPersonTwoFieldInput {
                  connect: [MovieActorsPersonTwoConnectFieldInput!]
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  connect: [MovieActorsPersonTwoConnectFieldInput!]
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  actors: MovieActorsCreateInput
                  id: ID
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
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonRelationshipFilters
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneConnectWhere {
                  node: PersonOneWhere!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoConnectWhere {
                  node: PersonTwoWhere!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: StringScalarMutations
                  nameTwo_SET: String @deprecated(reason: \\"Please use the generic mutation 'nameTwo: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: StringScalarFilters
                  nameTwo_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { contains: ... }\\")
                  nameTwo_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { endsWith: ... }\\")
                  nameTwo_EQ: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { eq: ... }\\")
                  nameTwo_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { in: ... }\\")
                  nameTwo_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Single relationship with nested operation UPDATE specified", async () => {
            const typeDefs = gql`
                type PersonOne @node {
                    name: String
                }

                type PersonTwo @node {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [UPDATE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
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

                type Movie {
                  actors(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                }

                input MovieActorsPersonOneUpdateConnectionInput {
                  node: PersonOneUpdateInput
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  update: MovieActorsPersonOneUpdateConnectionInput
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                }

                input MovieActorsPersonTwoUpdateConnectionInput {
                  node: PersonTwoUpdateInput
                  where: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  update: MovieActorsPersonTwoUpdateConnectionInput
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  id: ID
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
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonRelationshipFilters
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: StringScalarMutations
                  nameTwo_SET: String @deprecated(reason: \\"Please use the generic mutation 'nameTwo: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: StringScalarFilters
                  nameTwo_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { contains: ... }\\")
                  nameTwo_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { endsWith: ... }\\")
                  nameTwo_EQ: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { eq: ... }\\")
                  nameTwo_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { in: ... }\\")
                  nameTwo_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Single relationship with nested operation DELETE specified", async () => {
            const typeDefs = gql`
                type PersonOne @node {
                    name: String
                }

                type PersonTwo @node {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DELETE])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
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

                type Movie {
                  actors(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsDeleteInput {
                  PersonOne: [MovieActorsPersonOneDeleteFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoDeleteFieldInput!]
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                }

                input MovieActorsPersonOneDeleteFieldInput {
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  delete: [MovieActorsPersonOneDeleteFieldInput!]
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                }

                input MovieActorsPersonTwoDeleteFieldInput {
                  where: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  delete: [MovieActorsPersonTwoDeleteFieldInput!]
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  id: ID
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
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonRelationshipFilters
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: StringScalarMutations
                  nameTwo_SET: String @deprecated(reason: \\"Please use the generic mutation 'nameTwo: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: StringScalarFilters
                  nameTwo_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { contains: ... }\\")
                  nameTwo_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { endsWith: ... }\\")
                  nameTwo_EQ: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { eq: ... }\\")
                  nameTwo_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { in: ... }\\")
                  nameTwo_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Single relationship with nested operation DISCONNECT specified", async () => {
            const typeDefs = gql`
                type PersonOne @node {
                    name: String
                }

                type PersonTwo @node {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DISCONNECT])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
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

                type Movie {
                  actors(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                }

                input MovieActorsPersonOneDisconnectFieldInput {
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  disconnect: [MovieActorsPersonOneDisconnectFieldInput!]
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                }

                input MovieActorsPersonTwoDisconnectFieldInput {
                  where: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  disconnect: [MovieActorsPersonTwoDisconnectFieldInput!]
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  id: ID
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
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonRelationshipFilters
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: StringScalarMutations
                  nameTwo_SET: String @deprecated(reason: \\"Please use the generic mutation 'nameTwo: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: StringScalarFilters
                  nameTwo_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { contains: ... }\\")
                  nameTwo_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { endsWith: ... }\\")
                  nameTwo_EQ: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { eq: ... }\\")
                  nameTwo_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { in: ... }\\")
                  nameTwo_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Two relationships with nested operations specified on one", async () => {
            const typeDefs = gql`
                type PersonOne @node {
                    name: String
                }

                type PersonTwo @node {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                    producers: [Person!]! @relationship(type: "PRODUCED", direction: IN, nestedOperations: [DISCONNECT])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
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

                type Movie {
                  actors(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                  producers(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  producersConnection(after: String, first: Int, where: MovieProducersConnectionWhere): MovieProducersConnection!
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
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsCreateInput {
                  PersonOne: MovieActorsPersonOneFieldInput
                  PersonTwo: MovieActorsPersonTwoFieldInput
                }

                input MovieActorsDeleteInput {
                  PersonOne: [MovieActorsPersonOneDeleteFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoDeleteFieldInput!]
                }

                input MovieActorsPersonOneConnectFieldInput {
                  where: PersonOneConnectWhere
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                }

                input MovieActorsPersonOneCreateFieldInput {
                  node: PersonOneCreateInput!
                }

                input MovieActorsPersonOneDeleteFieldInput {
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonOneDisconnectFieldInput {
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonOneFieldInput {
                  connect: [MovieActorsPersonOneConnectFieldInput!]
                  create: [MovieActorsPersonOneCreateFieldInput!]
                }

                input MovieActorsPersonOneUpdateConnectionInput {
                  node: PersonOneUpdateInput
                  where: MovieActorsPersonOneConnectionWhere
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  connect: [MovieActorsPersonOneConnectFieldInput!]
                  create: [MovieActorsPersonOneCreateFieldInput!]
                  delete: [MovieActorsPersonOneDeleteFieldInput!]
                  disconnect: [MovieActorsPersonOneDisconnectFieldInput!]
                  update: MovieActorsPersonOneUpdateConnectionInput
                }

                input MovieActorsPersonTwoConnectFieldInput {
                  where: PersonTwoConnectWhere
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                }

                input MovieActorsPersonTwoCreateFieldInput {
                  node: PersonTwoCreateInput!
                }

                input MovieActorsPersonTwoDeleteFieldInput {
                  where: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonTwoDisconnectFieldInput {
                  where: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonTwoFieldInput {
                  connect: [MovieActorsPersonTwoConnectFieldInput!]
                  create: [MovieActorsPersonTwoCreateFieldInput!]
                }

                input MovieActorsPersonTwoUpdateConnectionInput {
                  node: PersonTwoUpdateInput
                  where: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  connect: [MovieActorsPersonTwoConnectFieldInput!]
                  create: [MovieActorsPersonTwoCreateFieldInput!]
                  delete: [MovieActorsPersonTwoDeleteFieldInput!]
                  disconnect: [MovieActorsPersonTwoDisconnectFieldInput!]
                  update: MovieActorsPersonTwoUpdateConnectionInput
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  actors: MovieActorsCreateInput
                  id: ID
                }

                input MovieDeleteInput {
                  actors: MovieActorsDeleteInput
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                type MovieProducersConnection {
                  edges: [MovieProducersRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieProducersConnectionFilters {
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  all: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  none: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  single: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  some: MovieProducersConnectionWhere
                }

                input MovieProducersConnectionWhere {
                  PersonOne: MovieProducersPersonOneConnectionWhere
                  PersonTwo: MovieProducersPersonTwoConnectionWhere
                }

                input MovieProducersPersonOneConnectionWhere {
                  AND: [MovieProducersPersonOneConnectionWhere!]
                  NOT: MovieProducersPersonOneConnectionWhere
                  OR: [MovieProducersPersonOneConnectionWhere!]
                  node: PersonOneWhere
                }

                input MovieProducersPersonOneDisconnectFieldInput {
                  where: MovieProducersPersonOneConnectionWhere
                }

                input MovieProducersPersonOneUpdateFieldInput {
                  disconnect: [MovieProducersPersonOneDisconnectFieldInput!]
                }

                input MovieProducersPersonTwoConnectionWhere {
                  AND: [MovieProducersPersonTwoConnectionWhere!]
                  NOT: MovieProducersPersonTwoConnectionWhere
                  OR: [MovieProducersPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                }

                input MovieProducersPersonTwoDisconnectFieldInput {
                  where: MovieProducersPersonTwoConnectionWhere
                }

                input MovieProducersPersonTwoUpdateFieldInput {
                  disconnect: [MovieProducersPersonTwoDisconnectFieldInput!]
                }

                type MovieProducersRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieProducersUpdateInput {
                  PersonOne: [MovieProducersPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieProducersPersonTwoUpdateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                  producers: MovieProducersUpdateInput
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonRelationshipFilters
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                  producers: PersonRelationshipFilters
                  producersConnection: MovieProducersConnectionFilters
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_ALL: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_NONE: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SINGLE: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SOME: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  producers_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: { all: ... }' instead.\\")
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  producers_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: { none: ... }' instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  producers_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  producers_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: {  some: ... }' instead.\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneConnectWhere {
                  node: PersonOneWhere!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoConnectWhere {
                  node: PersonTwoWhere!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: StringScalarMutations
                  nameTwo_SET: String @deprecated(reason: \\"Please use the generic mutation 'nameTwo: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: StringScalarFilters
                  nameTwo_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { contains: ... }\\")
                  nameTwo_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { endsWith: ... }\\")
                  nameTwo_EQ: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { eq: ... }\\")
                  nameTwo_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { in: ... }\\")
                  nameTwo_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Two relationships with nested operations specified on both", async () => {
            const typeDefs = gql`
                type PersonOne @node {
                    name: String
                }

                type PersonTwo @node {
                    nameTwo: String
                }

                union Person = PersonOne | PersonTwo

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
                    producers: [Person!]! @relationship(type: "PRODUCED", direction: IN, nestedOperations: [DISCONNECT])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
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

                type Movie {
                  actors(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                  producers(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  producersConnection(after: String, first: Int, where: MovieProducersConnectionWhere): MovieProducersConnection!
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
                  PersonOne: MovieActorsPersonOneConnectionWhere
                  PersonTwo: MovieActorsPersonTwoConnectionWhere
                }

                input MovieActorsCreateInput {
                  PersonOne: MovieActorsPersonOneFieldInput
                  PersonTwo: MovieActorsPersonTwoFieldInput
                }

                input MovieActorsPersonOneConnectionWhere {
                  AND: [MovieActorsPersonOneConnectionWhere!]
                  NOT: MovieActorsPersonOneConnectionWhere
                  OR: [MovieActorsPersonOneConnectionWhere!]
                  node: PersonOneWhere
                }

                input MovieActorsPersonOneCreateFieldInput {
                  node: PersonOneCreateInput!
                }

                input MovieActorsPersonOneFieldInput {
                  create: [MovieActorsPersonOneCreateFieldInput!]
                }

                input MovieActorsPersonOneUpdateFieldInput {
                  create: [MovieActorsPersonOneCreateFieldInput!]
                }

                input MovieActorsPersonTwoConnectionWhere {
                  AND: [MovieActorsPersonTwoConnectionWhere!]
                  NOT: MovieActorsPersonTwoConnectionWhere
                  OR: [MovieActorsPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                }

                input MovieActorsPersonTwoCreateFieldInput {
                  node: PersonTwoCreateInput!
                }

                input MovieActorsPersonTwoFieldInput {
                  create: [MovieActorsPersonTwoCreateFieldInput!]
                }

                input MovieActorsPersonTwoUpdateFieldInput {
                  create: [MovieActorsPersonTwoCreateFieldInput!]
                }

                type MovieActorsRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieActorsUpdateInput {
                  PersonOne: [MovieActorsPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieActorsPersonTwoUpdateFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  actors: MovieActorsCreateInput
                  id: ID
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                type MovieProducersConnection {
                  edges: [MovieProducersRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieProducersConnectionFilters {
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  all: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  none: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  single: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  some: MovieProducersConnectionWhere
                }

                input MovieProducersConnectionWhere {
                  PersonOne: MovieProducersPersonOneConnectionWhere
                  PersonTwo: MovieProducersPersonTwoConnectionWhere
                }

                input MovieProducersPersonOneConnectionWhere {
                  AND: [MovieProducersPersonOneConnectionWhere!]
                  NOT: MovieProducersPersonOneConnectionWhere
                  OR: [MovieProducersPersonOneConnectionWhere!]
                  node: PersonOneWhere
                }

                input MovieProducersPersonOneDisconnectFieldInput {
                  where: MovieProducersPersonOneConnectionWhere
                }

                input MovieProducersPersonOneUpdateFieldInput {
                  disconnect: [MovieProducersPersonOneDisconnectFieldInput!]
                }

                input MovieProducersPersonTwoConnectionWhere {
                  AND: [MovieProducersPersonTwoConnectionWhere!]
                  NOT: MovieProducersPersonTwoConnectionWhere
                  OR: [MovieProducersPersonTwoConnectionWhere!]
                  node: PersonTwoWhere
                }

                input MovieProducersPersonTwoDisconnectFieldInput {
                  where: MovieProducersPersonTwoConnectionWhere
                }

                input MovieProducersPersonTwoUpdateFieldInput {
                  disconnect: [MovieProducersPersonTwoDisconnectFieldInput!]
                }

                type MovieProducersRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieProducersUpdateInput {
                  PersonOne: [MovieProducersPersonOneUpdateFieldInput!]
                  PersonTwo: [MovieProducersPersonTwoUpdateFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: MovieActorsUpdateInput
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                  producers: MovieProducersUpdateInput
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  actors: PersonRelationshipFilters
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                  producers: PersonRelationshipFilters
                  producersConnection: MovieProducersConnectionFilters
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_ALL: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_NONE: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SINGLE: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SOME: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  producers_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: { all: ... }' instead.\\")
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  producers_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: { none: ... }' instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  producers_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  producers_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: {  some: ... }' instead.\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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

                type PersonTwo {
                  nameTwo: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  nameTwo: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  nameTwo: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  nameTwo: SortDirection
                }

                input PersonTwoUpdateInput {
                  nameTwo: StringScalarMutations
                  nameTwo_SET: String @deprecated(reason: \\"Please use the generic mutation 'nameTwo: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  nameTwo: StringScalarFilters
                  nameTwo_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { contains: ... }\\")
                  nameTwo_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { endsWith: ... }\\")
                  nameTwo_EQ: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { eq: ... }\\")
                  nameTwo_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { in: ... }\\")
                  nameTwo_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter nameTwo: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  PersonOne: PersonOneWhere
                  PersonTwo: PersonTwoWhere
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

    describe("Related to an interface type", () => {
        test("Should not generate UpdateFieldInput input with no nested operations", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person @node {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [])
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const updateFieldInput = schema.getType("MovieActorsUpdateFieldInput") as GraphQLNamedInputType;
            expect(updateFieldInput).toBeUndefined();

            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));

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

                type CountConnection {
                  edges: Int!
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

                \\"\\"\\"Int list filters\\"\\"\\"
                input IntListFilters {
                  eq: [Int!]
                  includes: Int
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

                \\"\\"\\"Mutations for a list for Int\\"\\"\\"
                input ListIntMutations {
                  pop: Int
                  push: [Int!]
                  set: [Int!]
                }

                type Movie {
                  actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  id: ID
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
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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

                type PeopleConnection {
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregate {
                  count: Count!
                  node: PersonAggregateNode!
                }

                type PersonAggregateNode {
                  name: StringAggregateSelection!
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                  someExtraProp: ListIntMutations
                  someExtraProp_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { pop: ... } }' instead.\\")
                  someExtraProp_PUSH: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { push: ... } }' instead.\\")
                  someExtraProp_SET: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  someExtraProp: IntListFilters
                  someExtraProp_EQ: [Int!] @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { eq: ... }\\")
                  someExtraProp_INCLUDES: Int @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { includes: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  typename: [PersonImplementation!]
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Single relationship with nested operation CREATE specified", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person @node {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE])
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

                type CountConnection {
                  edges: Int!
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

                \\"\\"\\"Int list filters\\"\\"\\"
                input IntListFilters {
                  eq: [Int!]
                  includes: Int
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

                \\"\\"\\"Mutations for a list for Int\\"\\"\\"
                input ListIntMutations {
                  pop: Int
                  push: [Int!]
                  set: [Int!]
                }

                type Movie {
                  actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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

                input MovieActorsFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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

                type PeopleConnection {
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregate {
                  count: Count!
                  node: PersonAggregateNode!
                }

                type PersonAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  PersonOne: PersonOneCreateInput
                  PersonTwo: PersonTwoCreateInput
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                  someExtraProp: ListIntMutations
                  someExtraProp_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { pop: ... } }' instead.\\")
                  someExtraProp_PUSH: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { push: ... } }' instead.\\")
                  someExtraProp_SET: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  someExtraProp: IntListFilters
                  someExtraProp_EQ: [Int!] @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { eq: ... }\\")
                  someExtraProp_INCLUDES: Int @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { includes: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  typename: [PersonImplementation!]
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Single relationship with nested operation CONNECT specified", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person @node {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CONNECT])
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

                type CountConnection {
                  edges: Int!
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

                \\"\\"\\"Int list filters\\"\\"\\"
                input IntListFilters {
                  eq: [Int!]
                  includes: Int
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

                \\"\\"\\"Mutations for a list for Int\\"\\"\\"
                input ListIntMutations {
                  pop: Int
                  push: [Int!]
                  set: [Int!]
                }

                type Movie {
                  actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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

                input MovieActorsFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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

                type PeopleConnection {
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
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

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                  someExtraProp: ListIntMutations
                  someExtraProp_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { pop: ... } }' instead.\\")
                  someExtraProp_PUSH: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { push: ... } }' instead.\\")
                  someExtraProp_SET: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  someExtraProp: IntListFilters
                  someExtraProp_EQ: [Int!] @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { eq: ... }\\")
                  someExtraProp_INCLUDES: Int @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { includes: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  typename: [PersonImplementation!]
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Single relationship with nested operation UPDATE specified", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person @node {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [UPDATE])
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

                type CountConnection {
                  edges: Int!
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

                \\"\\"\\"Int list filters\\"\\"\\"
                input IntListFilters {
                  eq: [Int!]
                  includes: Int
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

                \\"\\"\\"Mutations for a list for Int\\"\\"\\"
                input ListIntMutations {
                  pop: Int
                  push: [Int!]
                  set: [Int!]
                }

                type Movie {
                  actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                input MovieActorsUpdateConnectionInput {
                  node: PersonUpdateInput
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsUpdateFieldInput {
                  update: MovieActorsUpdateConnectionInput
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  id: ID
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
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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

                type PeopleConnection {
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregate {
                  count: Count!
                  node: PersonAggregateNode!
                }

                type PersonAggregateNode {
                  name: StringAggregateSelection!
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                  someExtraProp: ListIntMutations
                  someExtraProp_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { pop: ... } }' instead.\\")
                  someExtraProp_PUSH: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { push: ... } }' instead.\\")
                  someExtraProp_SET: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  someExtraProp: IntListFilters
                  someExtraProp_EQ: [Int!] @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { eq: ... }\\")
                  someExtraProp_INCLUDES: Int @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { includes: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  typename: [PersonImplementation!]
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Single relationship with nested operation DELETE specified", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person @node {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DELETE])
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

                type CountConnection {
                  edges: Int!
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

                \\"\\"\\"Int list filters\\"\\"\\"
                input IntListFilters {
                  eq: [Int!]
                  includes: Int
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

                \\"\\"\\"Mutations for a list for Int\\"\\"\\"
                input ListIntMutations {
                  pop: Int
                  push: [Int!]
                  set: [Int!]
                }

                type Movie {
                  actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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

                input MovieActorsDeleteFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  delete: [MovieActorsDeleteFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  id: ID
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
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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

                type PeopleConnection {
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregate {
                  count: Count!
                  node: PersonAggregateNode!
                }

                type PersonAggregateNode {
                  name: StringAggregateSelection!
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                  someExtraProp: ListIntMutations
                  someExtraProp_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { pop: ... } }' instead.\\")
                  someExtraProp_PUSH: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { push: ... } }' instead.\\")
                  someExtraProp_SET: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  someExtraProp: IntListFilters
                  someExtraProp_EQ: [Int!] @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { eq: ... }\\")
                  someExtraProp_INCLUDES: Int @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { includes: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  typename: [PersonImplementation!]
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Single relationship with nested operation DISCONNECT specified", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person @node {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [DISCONNECT])
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

                type CountConnection {
                  edges: Int!
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

                \\"\\"\\"Int list filters\\"\\"\\"
                input IntListFilters {
                  eq: [Int!]
                  includes: Int
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

                \\"\\"\\"Mutations for a list for Int\\"\\"\\"
                input ListIntMutations {
                  pop: Int
                  push: [Int!]
                  set: [Int!]
                }

                type Movie {
                  actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
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

                input MovieActorsDisconnectFieldInput {
                  where: MovieActorsConnectionWhere
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  disconnect: [MovieActorsDisconnectFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  id: ID
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
                  name: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
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

                type PeopleConnection {
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregate {
                  count: Count!
                  node: PersonAggregateNode!
                }

                type PersonAggregateNode {
                  name: StringAggregateSelection!
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                  someExtraProp: ListIntMutations
                  someExtraProp_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { pop: ... } }' instead.\\")
                  someExtraProp_PUSH: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { push: ... } }' instead.\\")
                  someExtraProp_SET: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  someExtraProp: IntListFilters
                  someExtraProp_EQ: [Int!] @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { eq: ... }\\")
                  someExtraProp_INCLUDES: Int @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { includes: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  typename: [PersonImplementation!]
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Two relationships with nested operations specified on one", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person @node {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                    producers: [Person!]! @relationship(type: "PRODUCED", direction: IN, nestedOperations: [DISCONNECT])
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

                type CountConnection {
                  edges: Int!
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

                \\"\\"\\"Int list filters\\"\\"\\"
                input IntListFilters {
                  eq: [Int!]
                  includes: Int
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

                \\"\\"\\"Mutations for a list for Int\\"\\"\\"
                input ListIntMutations {
                  pop: Int
                  push: [Int!]
                  set: [Int!]
                }

                type Movie {
                  actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                  producers(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  producersConnection(after: String, first: Int, sort: [MovieProducersConnectionSort!], where: MovieProducersConnectionWhere): MovieProducersConnection!
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
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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
                  name: StringAggregateSelection!
                }

                type MoviePersonProducersAggregateSelection {
                  count: CountConnection!
                  node: MoviePersonProducersNodeAggregateSelection
                }

                type MoviePersonProducersNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                input MovieProducersAggregateInput {
                  AND: [MovieProducersAggregateInput!]
                  NOT: MovieProducersAggregateInput
                  OR: [MovieProducersAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: MovieProducersNodeAggregationWhereInput
                }

                type MovieProducersConnection {
                  aggregate: MoviePersonProducersAggregateSelection!
                  edges: [MovieProducersRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieProducersConnectionAggregateInput {
                  AND: [MovieProducersConnectionAggregateInput!]
                  NOT: MovieProducersConnectionAggregateInput
                  OR: [MovieProducersConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: MovieProducersNodeAggregationWhereInput
                }

                input MovieProducersConnectionFilters {
                  \\"\\"\\"
                  Filter Movies by aggregating results on related MovieProducersConnections
                  \\"\\"\\"
                  aggregate: MovieProducersConnectionAggregateInput
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  all: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  none: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  single: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  some: MovieProducersConnectionWhere
                }

                input MovieProducersConnectionSort {
                  node: PersonSort
                }

                input MovieProducersConnectionWhere {
                  AND: [MovieProducersConnectionWhere!]
                  NOT: MovieProducersConnectionWhere
                  OR: [MovieProducersConnectionWhere!]
                  node: PersonWhere
                }

                input MovieProducersDisconnectFieldInput {
                  where: MovieProducersConnectionWhere
                }

                input MovieProducersNodeAggregationWhereInput {
                  AND: [MovieProducersNodeAggregationWhereInput!]
                  NOT: MovieProducersNodeAggregationWhereInput
                  OR: [MovieProducersNodeAggregationWhereInput!]
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

                type MovieProducersRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieProducersUpdateFieldInput {
                  disconnect: [MovieProducersDisconnectFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                  producers: [MovieProducersUpdateFieldInput!]
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                  producers: PersonRelationshipFilters
                  producersAggregate: MovieProducersAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the producersConnection filter, please use { producersConnection: { aggregate: {...} } } instead\\")
                  producersConnection: MovieProducersConnectionFilters
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_ALL: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_NONE: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SINGLE: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SOME: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  producers_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: { all: ... }' instead.\\")
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  producers_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: { none: ... }' instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  producers_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  producers_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: {  some: ... }' instead.\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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

                type PeopleConnection {
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
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
                  PersonOne: PersonOneCreateInput
                  PersonTwo: PersonTwoCreateInput
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                  someExtraProp: ListIntMutations
                  someExtraProp_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { pop: ... } }' instead.\\")
                  someExtraProp_PUSH: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { push: ... } }' instead.\\")
                  someExtraProp_SET: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  someExtraProp: IntListFilters
                  someExtraProp_EQ: [Int!] @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { eq: ... }\\")
                  someExtraProp_INCLUDES: Int @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { includes: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  typename: [PersonImplementation!]
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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

        test("Two relationships with nested operations specified on both", async () => {
            const typeDefs = gql`
                interface Person {
                    name: String
                }

                type PersonOne implements Person @node {
                    name: String
                    someExtraProp: [Int!]!
                }

                type PersonTwo implements Person @node {
                    name: String
                }

                type Movie @node {
                    id: ID
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN, nestedOperations: [CREATE, DELETE])
                    producers: [Person!]! @relationship(type: "PRODUCED", direction: IN, nestedOperations: [DISCONNECT])
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

                type CountConnection {
                  edges: Int!
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

                \\"\\"\\"Int list filters\\"\\"\\"
                input IntListFilters {
                  eq: [Int!]
                  includes: Int
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

                \\"\\"\\"Mutations for a list for Int\\"\\"\\"
                input ListIntMutations {
                  pop: Int
                  push: [Int!]
                  set: [Int!]
                }

                type Movie {
                  actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                  id: ID
                  producers(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  producersConnection(after: String, first: Int, sort: [MovieProducersConnectionSort!], where: MovieProducersConnectionWhere): MovieProducersConnection!
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

                input MovieActorsFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                }

                input MovieActorsNodeAggregationWhereInput {
                  AND: [MovieActorsNodeAggregationWhereInput!]
                  NOT: MovieActorsNodeAggregationWhereInput
                  OR: [MovieActorsNodeAggregationWhereInput!]
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
                  node: Person!
                }

                input MovieActorsUpdateFieldInput {
                  create: [MovieActorsCreateFieldInput!]
                  delete: [MovieActorsDeleteFieldInput!]
                }

                type MovieAggregate {
                  count: Count!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  id: ID
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
                  name: StringAggregateSelection!
                }

                type MoviePersonProducersAggregateSelection {
                  count: CountConnection!
                  node: MoviePersonProducersNodeAggregateSelection
                }

                type MoviePersonProducersNodeAggregateSelection {
                  name: StringAggregateSelection!
                }

                input MovieProducersAggregateInput {
                  AND: [MovieProducersAggregateInput!]
                  NOT: MovieProducersAggregateInput
                  OR: [MovieProducersAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: MovieProducersNodeAggregationWhereInput
                }

                type MovieProducersConnection {
                  aggregate: MoviePersonProducersAggregateSelection!
                  edges: [MovieProducersRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input MovieProducersConnectionAggregateInput {
                  AND: [MovieProducersConnectionAggregateInput!]
                  NOT: MovieProducersConnectionAggregateInput
                  OR: [MovieProducersConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: MovieProducersNodeAggregationWhereInput
                }

                input MovieProducersConnectionFilters {
                  \\"\\"\\"
                  Filter Movies by aggregating results on related MovieProducersConnections
                  \\"\\"\\"
                  aggregate: MovieProducersConnectionAggregateInput
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  all: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  none: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  single: MovieProducersConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  some: MovieProducersConnectionWhere
                }

                input MovieProducersConnectionSort {
                  node: PersonSort
                }

                input MovieProducersConnectionWhere {
                  AND: [MovieProducersConnectionWhere!]
                  NOT: MovieProducersConnectionWhere
                  OR: [MovieProducersConnectionWhere!]
                  node: PersonWhere
                }

                input MovieProducersDisconnectFieldInput {
                  where: MovieProducersConnectionWhere
                }

                input MovieProducersNodeAggregationWhereInput {
                  AND: [MovieProducersNodeAggregationWhereInput!]
                  NOT: MovieProducersNodeAggregationWhereInput
                  OR: [MovieProducersNodeAggregationWhereInput!]
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

                type MovieProducersRelationship {
                  cursor: String!
                  node: Person!
                }

                input MovieProducersUpdateFieldInput {
                  disconnect: [MovieProducersDisconnectFieldInput!]
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  id: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  id: IDScalarMutations
                  id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
                  producers: [MovieProducersUpdateFieldInput!]
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
                  id: IDScalarFilters
                  id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
                  id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
                  id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
                  id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
                  id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
                  producers: PersonRelationshipFilters
                  producersAggregate: MovieProducersAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the producersConnection filter, please use { producersConnection: { aggregate: {...} } } instead\\")
                  producersConnection: MovieProducersConnectionFilters
                  \\"\\"\\"
                  Return Movies where all of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_ALL: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where none of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_NONE: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SINGLE: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where some of the related MovieProducersConnections match this filter
                  \\"\\"\\"
                  producersConnection_SOME: MovieProducersConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'producersConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                  producers_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: { all: ... }' instead.\\")
                  \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                  producers_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: { none: ... }' instead.\\")
                  \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                  producers_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                  producers_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'producers: {  some: ... }' instead.\\")
                }

                type MoviesConnection {
                  aggregate: MovieAggregate!
                  edges: [MovieEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Mutation {
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createPersonOnes(input: [PersonOneCreateInput!]!): CreatePersonOnesMutationResponse!
                  createPersonTwos(input: [PersonTwoCreateInput!]!): CreatePersonTwosMutationResponse!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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

                type PeopleConnection {
                  aggregate: PersonAggregate!
                  edges: [PersonEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                interface Person {
                  name: String
                }

                type PersonAggregate {
                  count: Count!
                  node: PersonAggregateNode!
                }

                type PersonAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonCreateInput {
                  PersonOne: PersonOneCreateInput
                  PersonTwo: PersonTwoCreateInput
                }

                type PersonEdge {
                  cursor: String!
                  node: Person!
                }

                enum PersonImplementation {
                  PersonOne
                  PersonTwo
                }

                type PersonOne implements Person {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneAggregate {
                  count: Count!
                  node: PersonOneAggregateNode!
                }

                type PersonOneAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonOneCreateInput {
                  name: String
                  someExtraProp: [Int!]!
                }

                type PersonOneEdge {
                  cursor: String!
                  node: PersonOne!
                }

                \\"\\"\\"
                Fields to sort PersonOnes by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonOneSort object.
                \\"\\"\\"
                input PersonOneSort {
                  name: SortDirection
                }

                input PersonOneUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                  someExtraProp: ListIntMutations
                  someExtraProp_POP: Int @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { pop: ... } }' instead.\\")
                  someExtraProp_PUSH: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { push: ... } }' instead.\\")
                  someExtraProp_SET: [Int!] @deprecated(reason: \\"Please use the generic mutation 'someExtraProp: { set: ... } }' instead.\\")
                }

                input PersonOneWhere {
                  AND: [PersonOneWhere!]
                  NOT: PersonOneWhere
                  OR: [PersonOneWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  someExtraProp: IntListFilters
                  someExtraProp_EQ: [Int!] @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { eq: ... }\\")
                  someExtraProp_INCLUDES: Int @deprecated(reason: \\"Please use the relevant generic filter someExtraProp: { includes: ... }\\")
                }

                type PersonOnesConnection {
                  aggregate: PersonOneAggregate!
                  edges: [PersonOneEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
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
                  name: SortDirection
                }

                type PersonTwo implements Person {
                  name: String
                }

                type PersonTwoAggregate {
                  count: Count!
                  node: PersonTwoAggregateNode!
                }

                type PersonTwoAggregateNode {
                  name: StringAggregateSelection!
                }

                input PersonTwoCreateInput {
                  name: String
                }

                type PersonTwoEdge {
                  cursor: String!
                  node: PersonTwo!
                }

                \\"\\"\\"
                Fields to sort PersonTwos by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonTwoSort object.
                \\"\\"\\"
                input PersonTwoSort {
                  name: SortDirection
                }

                input PersonTwoUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input PersonTwoWhere {
                  AND: [PersonTwoWhere!]
                  NOT: PersonTwoWhere
                  OR: [PersonTwoWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                }

                type PersonTwosConnection {
                  aggregate: PersonTwoAggregate!
                  edges: [PersonTwoEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input PersonWhere {
                  AND: [PersonWhere!]
                  NOT: PersonWhere
                  OR: [PersonWhere!]
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
                  typename: [PersonImplementation!]
                }

                type Query {
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                  peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
                  personOnes(limit: Int, offset: Int, sort: [PersonOneSort!], where: PersonOneWhere): [PersonOne!]!
                  personOnesConnection(after: String, first: Int, sort: [PersonOneSort!], where: PersonOneWhere): PersonOnesConnection!
                  personTwos(limit: Int, offset: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): [PersonTwo!]!
                  personTwosConnection(after: String, first: Int, sort: [PersonTwoSort!], where: PersonTwoWhere): PersonTwosConnection!
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
});
