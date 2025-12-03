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
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";

describe("@settable", () => {
    test("Disable create fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) @node {
                title: String!
                description: String @settable(onCreate: false, onUpdate: true)
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Movie {
              description: String
              title: String!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              description: StringAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              title: String!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              description: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              description: StringScalarMutations
              description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              description: StringScalarFilters
              description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
              description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
              description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
              description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
              description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
              deleteMovies(where: MovieWhere): DeleteInfo!
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
            }"
        `);
    });

    test("Disable update fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) @node {
                title: String!
                description: String @settable(onCreate: true, onUpdate: false)
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Movie {
              description: String
              title: String!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              description: StringAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              description: String
              title: String!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              description: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              description: StringScalarFilters
              description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
              description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
              description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
              description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
              description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
              deleteMovies(where: MovieWhere): DeleteInfo!
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
            }"
        `);
    });

    test("Disable create and update fields", async () => {
        const typeDefs = gql`
            type Movie @query(aggregate: true) @node {
                title: String!
                description: String @settable(onCreate: false, onUpdate: false)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Movie {
              description: String
              title: String!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              description: StringAggregateSelection!
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              title: String!
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              description: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              description: StringScalarFilters
              description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
              description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
              description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
              description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
              description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
              deleteMovies(where: MovieWhere): DeleteInfo!
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
            }"
        `);
    });

    describe("Relationships to a concrete type", () => {
        test("Prevent relationship field creation", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Movie!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @settable(onCreate: false, onUpdate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  actedIn(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  where: MovieConnectWhere
                }

                type ActorActedInConnection {
                  aggregate: ActorMovieActedInAggregateSelection!
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionAggregateInput {
                  AND: [ActorActedInConnectionAggregateInput!]
                  NOT: ActorActedInConnectionAggregateInput
                  OR: [ActorActedInConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectionFilters {
                  \\"\\"\\"
                  Filter Actors by aggregating results on related ActorActedInConnections
                  \\"\\"\\"
                  aggregate: ActorActedInConnectionAggregateInput
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  all: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  none: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  single: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  some: ActorActedInConnectionWhere
                }

                input ActorActedInConnectionSort {
                  node: MovieSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description: StringScalarAggregationFilters
                  description_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { eq: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gte: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { eq: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { eq: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lte: ... } } }' instead.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Movie!
                }

                input ActorActedInUpdateConnectionInput {
                  node: MovieUpdateInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInUpdateFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                  delete: [ActorActedInDeleteFieldInput!]
                  disconnect: [ActorActedInDisconnectFieldInput!]
                  update: ActorActedInUpdateConnectionInput
                }

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
                  name: StringAggregateSelection!
                }

                input ActorCreateInput {
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorMovieActedInAggregateSelection {
                  count: CountConnection!
                  node: ActorMovieActedInNodeAggregateSelection
                }

                type ActorMovieActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: MovieRelationshipFilters
                  actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
                  actedInConnection: ActorActedInConnectionFilters
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                  actedIn_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
                  \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                  actedIn_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
                  \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                  actedIn_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                  actedIn_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
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
                  description: String
                  title: String!
                }

                type MovieAggregate {
                  count: Count!
                  node: MovieAggregateNode!
                }

                type MovieAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieConnectWhere {
                  node: MovieWhere!
                }

                input MovieCreateInput {
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
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

        test("Prevent relationship field update", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Movie!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @settable(onCreate: true, onUpdate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  actedIn(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  where: MovieConnectWhere
                }

                type ActorActedInConnection {
                  aggregate: ActorMovieActedInAggregateSelection!
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionAggregateInput {
                  AND: [ActorActedInConnectionAggregateInput!]
                  NOT: ActorActedInConnectionAggregateInput
                  OR: [ActorActedInConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectionFilters {
                  \\"\\"\\"
                  Filter Actors by aggregating results on related ActorActedInConnections
                  \\"\\"\\"
                  aggregate: ActorActedInConnectionAggregateInput
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  all: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  none: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  single: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  some: ActorActedInConnectionWhere
                }

                input ActorActedInConnectionSort {
                  node: MovieSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description: StringScalarAggregationFilters
                  description_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { eq: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gte: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { eq: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { eq: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lte: ... } } }' instead.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Movie!
                }

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
                  name: StringAggregateSelection!
                }

                input ActorCreateInput {
                  actedIn: ActorActedInFieldInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorMovieActedInAggregateSelection {
                  count: CountConnection!
                  node: ActorMovieActedInNodeAggregateSelection
                }

                type ActorMovieActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: MovieRelationshipFilters
                  actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
                  actedInConnection: ActorActedInConnectionFilters
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                  actedIn_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
                  \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                  actedIn_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
                  \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                  actedIn_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                  actedIn_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
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
                  description: String
                  title: String!
                }

                type MovieAggregate {
                  count: Count!
                  node: MovieAggregateNode!
                }

                type MovieAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieConnectWhere {
                  node: MovieWhere!
                }

                input MovieCreateInput {
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
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

        test("Prevent update on nested relationships", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT) @settable(onUpdate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  actedIn(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  connect: [MovieConnectInput!]
                  where: MovieConnectWhere
                }

                type ActorActedInConnection {
                  aggregate: ActorMovieActedInAggregateSelection!
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionAggregateInput {
                  AND: [ActorActedInConnectionAggregateInput!]
                  NOT: ActorActedInConnectionAggregateInput
                  OR: [ActorActedInConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectionFilters {
                  \\"\\"\\"
                  Filter Actors by aggregating results on related ActorActedInConnections
                  \\"\\"\\"
                  aggregate: ActorActedInConnectionAggregateInput
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  all: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  none: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  single: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  some: ActorActedInConnectionWhere
                }

                input ActorActedInConnectionSort {
                  node: MovieSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  delete: MovieDeleteInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  disconnect: MovieDisconnectInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description: StringScalarAggregationFilters
                  description_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { eq: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gte: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { eq: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { eq: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lte: ... } } }' instead.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Movie!
                }

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  actedIn: ActorActedInFieldInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                input ActorDisconnectInput {
                  actedIn: [ActorActedInDisconnectFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorMovieActedInAggregateSelection {
                  count: CountConnection!
                  node: ActorMovieActedInNodeAggregateSelection
                }

                type ActorMovieActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
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
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: MovieRelationshipFilters
                  actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
                  actedInConnection: ActorActedInConnectionFilters
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                  actedIn_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
                  \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                  actedIn_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
                  \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                  actedIn_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                  actedIn_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
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
                  description: String
                  title: String!
                }

                type MovieActorActorsAggregateSelection {
                  count: CountConnection!
                  node: MovieActorActorsNodeAggregateSelection
                }

                type MovieActorActorsNodeAggregateSelection {
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
                  description: StringAggregateSelection!
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
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
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
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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

        test("Prevent create on nested relationships", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT) @settable(onCreate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  actedIn(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  connect: [MovieConnectInput!]
                  where: MovieConnectWhere
                }

                type ActorActedInConnection {
                  aggregate: ActorMovieActedInAggregateSelection!
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionAggregateInput {
                  AND: [ActorActedInConnectionAggregateInput!]
                  NOT: ActorActedInConnectionAggregateInput
                  OR: [ActorActedInConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectionFilters {
                  \\"\\"\\"
                  Filter Actors by aggregating results on related ActorActedInConnections
                  \\"\\"\\"
                  aggregate: ActorActedInConnectionAggregateInput
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  all: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  none: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  single: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  some: ActorActedInConnectionWhere
                }

                input ActorActedInConnectionSort {
                  node: MovieSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  delete: MovieDeleteInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  disconnect: MovieDisconnectInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description: StringScalarAggregationFilters
                  description_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { eq: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gte: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { eq: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { eq: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lte: ... } } }' instead.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Movie!
                }

                input ActorActedInUpdateConnectionInput {
                  node: MovieUpdateInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInUpdateFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                  delete: [ActorActedInDeleteFieldInput!]
                  disconnect: [ActorActedInDisconnectFieldInput!]
                  update: ActorActedInUpdateConnectionInput
                }

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                input ActorDisconnectInput {
                  actedIn: [ActorActedInDisconnectFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorMovieActedInAggregateSelection {
                  count: CountConnection!
                  node: ActorMovieActedInNodeAggregateSelection
                }

                type ActorMovieActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
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
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: MovieRelationshipFilters
                  actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
                  actedInConnection: ActorActedInConnectionFilters
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                  actedIn_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
                  \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                  actedIn_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
                  \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                  actedIn_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                  actedIn_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
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
                  description: String
                  title: String!
                }

                type MovieActorActorsAggregateSelection {
                  count: CountConnection!
                  node: MovieActorActorsNodeAggregateSelection
                }

                type MovieActorActorsNodeAggregateSelection {
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
                  description: StringAggregateSelection!
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
                  description: String
                  title: String!
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
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
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
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
    });
    describe("Relationships to a union type", () => {
        test("Prevent relationship field creation", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Series @query(aggregate: true) @node {
                    name: String!
                    description: String
                }

                union Production = Movie | Series

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @settable(onCreate: false, onUpdate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  actedIn(limit: Int, offset: Int, where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, first: Int, where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionFilters {
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  all: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  none: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  single: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  some: ActorActedInConnectionWhere
                }

                input ActorActedInConnectionWhere {
                  Movie: ActorActedInMovieConnectionWhere
                  Series: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInDeleteInput {
                  Movie: [ActorActedInMovieDeleteFieldInput!]
                  Series: [ActorActedInSeriesDeleteFieldInput!]
                }

                input ActorActedInMovieConnectFieldInput {
                  where: MovieConnectWhere
                }

                input ActorActedInMovieConnectionWhere {
                  AND: [ActorActedInMovieConnectionWhere!]
                  NOT: ActorActedInMovieConnectionWhere
                  OR: [ActorActedInMovieConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInMovieCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInMovieDeleteFieldInput {
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieDisconnectFieldInput {
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieUpdateConnectionInput {
                  node: MovieUpdateInput
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieUpdateFieldInput {
                  connect: [ActorActedInMovieConnectFieldInput!]
                  create: [ActorActedInMovieCreateFieldInput!]
                  delete: [ActorActedInMovieDeleteFieldInput!]
                  disconnect: [ActorActedInMovieDisconnectFieldInput!]
                  update: ActorActedInMovieUpdateConnectionInput
                }

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                input ActorActedInSeriesConnectFieldInput {
                  where: SeriesConnectWhere
                }

                input ActorActedInSeriesConnectionWhere {
                  AND: [ActorActedInSeriesConnectionWhere!]
                  NOT: ActorActedInSeriesConnectionWhere
                  OR: [ActorActedInSeriesConnectionWhere!]
                  node: SeriesWhere
                }

                input ActorActedInSeriesCreateFieldInput {
                  node: SeriesCreateInput!
                }

                input ActorActedInSeriesDeleteFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesDisconnectFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesUpdateConnectionInput {
                  node: SeriesUpdateInput
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesUpdateFieldInput {
                  connect: [ActorActedInSeriesConnectFieldInput!]
                  create: [ActorActedInSeriesCreateFieldInput!]
                  delete: [ActorActedInSeriesDeleteFieldInput!]
                  disconnect: [ActorActedInSeriesDisconnectFieldInput!]
                  update: ActorActedInSeriesUpdateConnectionInput
                }

                input ActorActedInUpdateInput {
                  Movie: [ActorActedInMovieUpdateFieldInput!]
                  Series: [ActorActedInSeriesUpdateFieldInput!]
                }

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
                  name: StringAggregateSelection!
                }

                input ActorCreateInput {
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: ActorActedInDeleteInput
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: ActorActedInUpdateInput
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionRelationshipFilters
                  actedInConnection: ActorActedInConnectionFilters
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
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

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Movie {
                  description: String
                  title: String!
                }

                type MovieAggregate {
                  count: Count!
                  node: MovieAggregateNode!
                }

                type MovieAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieConnectWhere {
                  node: MovieWhere!
                }

                input MovieCreateInput {
                  description: String
                  title: String!
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Production = Movie | Series

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

                input ProductionWhere {
                  Movie: MovieWhere
                  Series: SeriesWhere
                }

                type Query {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, where: ProductionWhere): [Production!]!
                  series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                type Series {
                  description: String
                  name: String!
                }

                type SeriesAggregate {
                  count: Count!
                  node: SeriesAggregateNode!
                }

                type SeriesAggregateNode {
                  description: StringAggregateSelection!
                  name: StringAggregateSelection!
                }

                input SeriesConnectWhere {
                  node: SeriesWhere!
                }

                type SeriesConnection {
                  aggregate: SeriesAggregate!
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  description: String
                  name: String!
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  name: SortDirection
                }

                input SeriesUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
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

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Prevent relationship field update", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Series @query(aggregate: true) @node {
                    name: String!
                    description: String
                }

                union Production = Movie | Series

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @settable(onCreate: true, onUpdate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  actedIn(limit: Int, offset: Int, where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, first: Int, where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionFilters {
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  all: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  none: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  single: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  some: ActorActedInConnectionWhere
                }

                input ActorActedInConnectionWhere {
                  Movie: ActorActedInMovieConnectionWhere
                  Series: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInCreateInput {
                  Movie: ActorActedInMovieFieldInput
                  Series: ActorActedInSeriesFieldInput
                }

                input ActorActedInDeleteInput {
                  Movie: [ActorActedInMovieDeleteFieldInput!]
                  Series: [ActorActedInSeriesDeleteFieldInput!]
                }

                input ActorActedInMovieConnectFieldInput {
                  where: MovieConnectWhere
                }

                input ActorActedInMovieConnectionWhere {
                  AND: [ActorActedInMovieConnectionWhere!]
                  NOT: ActorActedInMovieConnectionWhere
                  OR: [ActorActedInMovieConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInMovieCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInMovieDeleteFieldInput {
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieFieldInput {
                  connect: [ActorActedInMovieConnectFieldInput!]
                  create: [ActorActedInMovieCreateFieldInput!]
                }

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                input ActorActedInSeriesConnectFieldInput {
                  where: SeriesConnectWhere
                }

                input ActorActedInSeriesConnectionWhere {
                  AND: [ActorActedInSeriesConnectionWhere!]
                  NOT: ActorActedInSeriesConnectionWhere
                  OR: [ActorActedInSeriesConnectionWhere!]
                  node: SeriesWhere
                }

                input ActorActedInSeriesCreateFieldInput {
                  node: SeriesCreateInput!
                }

                input ActorActedInSeriesDeleteFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesFieldInput {
                  connect: [ActorActedInSeriesConnectFieldInput!]
                  create: [ActorActedInSeriesCreateFieldInput!]
                }

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
                  name: StringAggregateSelection!
                }

                input ActorCreateInput {
                  actedIn: ActorActedInCreateInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: ActorActedInDeleteInput
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionRelationshipFilters
                  actedInConnection: ActorActedInConnectionFilters
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
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

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
                }

                \\"\\"\\"
                Information about the number of nodes and relationships deleted during a delete mutation
                \\"\\"\\"
                type DeleteInfo {
                  nodesDeleted: Int!
                  relationshipsDeleted: Int!
                }

                type Movie {
                  description: String
                  title: String!
                }

                type MovieAggregate {
                  count: Count!
                  node: MovieAggregateNode!
                }

                type MovieAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieConnectWhere {
                  node: MovieWhere!
                }

                input MovieCreateInput {
                  description: String
                  title: String!
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Production = Movie | Series

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

                input ProductionWhere {
                  Movie: MovieWhere
                  Series: SeriesWhere
                }

                type Query {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, where: ProductionWhere): [Production!]!
                  series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                type Series {
                  description: String
                  name: String!
                }

                type SeriesAggregate {
                  count: Count!
                  node: SeriesAggregateNode!
                }

                type SeriesAggregateNode {
                  description: StringAggregateSelection!
                  name: StringAggregateSelection!
                }

                input SeriesConnectWhere {
                  node: SeriesWhere!
                }

                type SeriesConnection {
                  aggregate: SeriesAggregate!
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  description: String
                  name: String!
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  name: SortDirection
                }

                input SeriesUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
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

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Prevent update on nested relationships", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Series @query(aggregate: true) @node {
                    name: String!
                    description: String
                }

                union Production = Movie | Series

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT) @settable(onUpdate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  actedIn(limit: Int, offset: Int, where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, first: Int, where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInConnectInput {
                  Movie: [ActorActedInMovieConnectFieldInput!]
                  Series: [ActorActedInSeriesConnectFieldInput!]
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionFilters {
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  all: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  none: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  single: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  some: ActorActedInConnectionWhere
                }

                input ActorActedInConnectionWhere {
                  Movie: ActorActedInMovieConnectionWhere
                  Series: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInCreateInput {
                  Movie: ActorActedInMovieFieldInput
                  Series: ActorActedInSeriesFieldInput
                }

                input ActorActedInDeleteInput {
                  Movie: [ActorActedInMovieDeleteFieldInput!]
                  Series: [ActorActedInSeriesDeleteFieldInput!]
                }

                input ActorActedInDisconnectInput {
                  Movie: [ActorActedInMovieDisconnectFieldInput!]
                  Series: [ActorActedInSeriesDisconnectFieldInput!]
                }

                input ActorActedInMovieConnectFieldInput {
                  connect: [MovieConnectInput!]
                  where: MovieConnectWhere
                }

                input ActorActedInMovieConnectionWhere {
                  AND: [ActorActedInMovieConnectionWhere!]
                  NOT: ActorActedInMovieConnectionWhere
                  OR: [ActorActedInMovieConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInMovieCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInMovieDeleteFieldInput {
                  delete: MovieDeleteInput
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieDisconnectFieldInput {
                  disconnect: MovieDisconnectInput
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieFieldInput {
                  connect: [ActorActedInMovieConnectFieldInput!]
                  create: [ActorActedInMovieCreateFieldInput!]
                }

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                input ActorActedInSeriesConnectFieldInput {
                  where: SeriesConnectWhere
                }

                input ActorActedInSeriesConnectionWhere {
                  AND: [ActorActedInSeriesConnectionWhere!]
                  NOT: ActorActedInSeriesConnectionWhere
                  OR: [ActorActedInSeriesConnectionWhere!]
                  node: SeriesWhere
                }

                input ActorActedInSeriesCreateFieldInput {
                  node: SeriesCreateInput!
                }

                input ActorActedInSeriesDeleteFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesDisconnectFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesFieldInput {
                  connect: [ActorActedInSeriesConnectFieldInput!]
                  create: [ActorActedInSeriesCreateFieldInput!]
                }

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: ActorActedInConnectInput
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  actedIn: ActorActedInCreateInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: ActorActedInDeleteInput
                }

                input ActorDisconnectInput {
                  actedIn: ActorActedInDisconnectInput
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
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionRelationshipFilters
                  actedInConnection: ActorActedInConnectionFilters
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
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

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
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
                  description: String
                  title: String!
                }

                type MovieActorActorsAggregateSelection {
                  count: CountConnection!
                  node: MovieActorActorsNodeAggregateSelection
                }

                type MovieActorActorsNodeAggregateSelection {
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
                  description: StringAggregateSelection!
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
                  description: String
                  title: String!
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

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
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
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Production = Movie | Series

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

                input ProductionWhere {
                  Movie: MovieWhere
                  Series: SeriesWhere
                }

                type Query {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, where: ProductionWhere): [Production!]!
                  series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                type Series {
                  description: String
                  name: String!
                }

                type SeriesAggregate {
                  count: Count!
                  node: SeriesAggregateNode!
                }

                type SeriesAggregateNode {
                  description: StringAggregateSelection!
                  name: StringAggregateSelection!
                }

                input SeriesConnectWhere {
                  node: SeriesWhere!
                }

                type SeriesConnection {
                  aggregate: SeriesAggregate!
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  description: String
                  name: String!
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  name: SortDirection
                }

                input SeriesUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Prevent create on nested relationships", async () => {
            const typeDefs = gql`
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Series @query(aggregate: true) @node {
                    name: String!
                    description: String
                }

                union Production = Movie | Series

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT) @settable(onCreate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  actedIn(limit: Int, offset: Int, where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, first: Int, where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInConnectInput {
                  Movie: [ActorActedInMovieConnectFieldInput!]
                  Series: [ActorActedInSeriesConnectFieldInput!]
                }

                type ActorActedInConnection {
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionFilters {
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  all: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  none: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  single: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  some: ActorActedInConnectionWhere
                }

                input ActorActedInConnectionWhere {
                  Movie: ActorActedInMovieConnectionWhere
                  Series: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInDeleteInput {
                  Movie: [ActorActedInMovieDeleteFieldInput!]
                  Series: [ActorActedInSeriesDeleteFieldInput!]
                }

                input ActorActedInDisconnectInput {
                  Movie: [ActorActedInMovieDisconnectFieldInput!]
                  Series: [ActorActedInSeriesDisconnectFieldInput!]
                }

                input ActorActedInMovieConnectFieldInput {
                  connect: [MovieConnectInput!]
                  where: MovieConnectWhere
                }

                input ActorActedInMovieConnectionWhere {
                  AND: [ActorActedInMovieConnectionWhere!]
                  NOT: ActorActedInMovieConnectionWhere
                  OR: [ActorActedInMovieConnectionWhere!]
                  node: MovieWhere
                }

                input ActorActedInMovieCreateFieldInput {
                  node: MovieCreateInput!
                }

                input ActorActedInMovieDeleteFieldInput {
                  delete: MovieDeleteInput
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieDisconnectFieldInput {
                  disconnect: MovieDisconnectInput
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieUpdateConnectionInput {
                  node: MovieUpdateInput
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieUpdateFieldInput {
                  connect: [ActorActedInMovieConnectFieldInput!]
                  create: [ActorActedInMovieCreateFieldInput!]
                  delete: [ActorActedInMovieDeleteFieldInput!]
                  disconnect: [ActorActedInMovieDisconnectFieldInput!]
                  update: ActorActedInMovieUpdateConnectionInput
                }

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                input ActorActedInSeriesConnectFieldInput {
                  where: SeriesConnectWhere
                }

                input ActorActedInSeriesConnectionWhere {
                  AND: [ActorActedInSeriesConnectionWhere!]
                  NOT: ActorActedInSeriesConnectionWhere
                  OR: [ActorActedInSeriesConnectionWhere!]
                  node: SeriesWhere
                }

                input ActorActedInSeriesCreateFieldInput {
                  node: SeriesCreateInput!
                }

                input ActorActedInSeriesDeleteFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesDisconnectFieldInput {
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesUpdateConnectionInput {
                  node: SeriesUpdateInput
                  where: ActorActedInSeriesConnectionWhere
                }

                input ActorActedInSeriesUpdateFieldInput {
                  connect: [ActorActedInSeriesConnectFieldInput!]
                  create: [ActorActedInSeriesCreateFieldInput!]
                  delete: [ActorActedInSeriesDeleteFieldInput!]
                  disconnect: [ActorActedInSeriesDisconnectFieldInput!]
                  update: ActorActedInSeriesUpdateConnectionInput
                }

                input ActorActedInUpdateInput {
                  Movie: [ActorActedInMovieUpdateFieldInput!]
                  Series: [ActorActedInSeriesUpdateFieldInput!]
                }

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: ActorActedInConnectInput
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: ActorActedInDeleteInput
                }

                input ActorDisconnectInput {
                  actedIn: ActorActedInDisconnectInput
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
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: ActorActedInUpdateInput
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionRelationshipFilters
                  actedInConnection: ActorActedInConnectionFilters
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
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

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
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
                  description: String
                  title: String!
                }

                type MovieActorActorsAggregateSelection {
                  count: CountConnection!
                  node: MovieActorActorsNodeAggregateSelection
                }

                type MovieActorActorsNodeAggregateSelection {
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
                  description: StringAggregateSelection!
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
                  description: String
                  title: String!
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

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
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
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                union Production = Movie | Series

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

                input ProductionWhere {
                  Movie: MovieWhere
                  Series: SeriesWhere
                }

                type Query {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, where: ProductionWhere): [Production!]!
                  series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                type Series {
                  description: String
                  name: String!
                }

                type SeriesAggregate {
                  count: Count!
                  node: SeriesAggregateNode!
                }

                type SeriesAggregateNode {
                  description: StringAggregateSelection!
                  name: StringAggregateSelection!
                }

                input SeriesConnectWhere {
                  node: SeriesWhere!
                }

                type SeriesConnection {
                  aggregate: SeriesAggregate!
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  description: String
                  name: String!
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  name: SortDirection
                }

                input SeriesUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
                  name: StringScalarFilters
                  name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
                  name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
                  name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
                  name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
                  name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });
    });

    describe("Relationships to an interface type", () => {
        test("Prevent relationship field creation", async () => {
            const typeDefs = gql`
                interface Production {
                    title: String!
                    description: String
                }

                type Movie implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Series implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @settable(onCreate: false, onUpdate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  actedIn(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  where: ProductionConnectWhere
                }

                type ActorActedInConnection {
                  aggregate: ActorProductionActedInAggregateSelection!
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionAggregateInput {
                  AND: [ActorActedInConnectionAggregateInput!]
                  NOT: ActorActedInConnectionAggregateInput
                  OR: [ActorActedInConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectionFilters {
                  \\"\\"\\"
                  Filter Actors by aggregating results on related ActorActedInConnections
                  \\"\\"\\"
                  aggregate: ActorActedInConnectionAggregateInput
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  all: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  none: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  single: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  some: ActorActedInConnectionWhere
                }

                input ActorActedInConnectionSort {
                  node: ProductionSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: ProductionWhere
                }

                input ActorActedInCreateFieldInput {
                  node: ProductionCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description: StringScalarAggregationFilters
                  description_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { eq: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gte: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { eq: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { eq: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lte: ... } } }' instead.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                input ActorActedInUpdateConnectionInput {
                  node: ProductionUpdateInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInUpdateFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                  delete: [ActorActedInDeleteFieldInput!]
                  disconnect: [ActorActedInDisconnectFieldInput!]
                  update: ActorActedInUpdateConnectionInput
                }

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
                  name: StringAggregateSelection!
                }

                input ActorCreateInput {
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorProductionActedInAggregateSelection {
                  count: CountConnection!
                  node: ActorProductionActedInNodeAggregateSelection
                }

                type ActorProductionActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionRelationshipFilters
                  actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
                  actedInConnection: ActorActedInConnectionFilters
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
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

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
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

                type Movie implements Production {
                  description: String
                  title: String!
                }

                type MovieAggregate {
                  count: Count!
                  node: MovieAggregateNode!
                }

                type MovieAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieCreateInput {
                  description: String
                  title: String!
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                interface Production {
                  description: String
                  title: String!
                }

                type ProductionAggregate {
                  count: Count!
                  node: ProductionAggregateNode!
                }

                type ProductionAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input ProductionConnectWhere {
                  node: ProductionWhere!
                }

                input ProductionCreateInput {
                  Movie: MovieCreateInput
                  Series: SeriesCreateInput
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
                  description: SortDirection
                  title: SortDirection
                }

                input ProductionUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                }

                input ProductionWhere {
                  AND: [ProductionWhere!]
                  NOT: ProductionWhere
                  OR: [ProductionWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
                  title: StringScalarFilters
                  title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                  title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                  title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                  title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                  title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                  typename: [ProductionImplementation!]
                }

                type ProductionsConnection {
                  aggregate: ProductionAggregate!
                  edges: [ProductionEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Query {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
                  series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                type Series implements Production {
                  description: String
                  title: String!
                }

                type SeriesAggregate {
                  count: Count!
                  node: SeriesAggregateNode!
                }

                type SeriesAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                type SeriesConnection {
                  aggregate: SeriesAggregate!
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  description: String
                  title: String!
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  title: SortDirection
                }

                input SeriesUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Prevent relationship field update", async () => {
            const typeDefs = gql`
                interface Production {
                    title: String!
                    description: String
                }

                type Movie implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Series implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @settable(onCreate: true, onUpdate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  actedIn(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  where: ProductionConnectWhere
                }

                type ActorActedInConnection {
                  aggregate: ActorProductionActedInAggregateSelection!
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionAggregateInput {
                  AND: [ActorActedInConnectionAggregateInput!]
                  NOT: ActorActedInConnectionAggregateInput
                  OR: [ActorActedInConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectionFilters {
                  \\"\\"\\"
                  Filter Actors by aggregating results on related ActorActedInConnections
                  \\"\\"\\"
                  aggregate: ActorActedInConnectionAggregateInput
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  all: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  none: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  single: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  some: ActorActedInConnectionWhere
                }

                input ActorActedInConnectionSort {
                  node: ProductionSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: ProductionWhere
                }

                input ActorActedInCreateFieldInput {
                  node: ProductionCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description: StringScalarAggregationFilters
                  description_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { eq: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gte: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { eq: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { eq: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lte: ... } } }' instead.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
                  name: StringAggregateSelection!
                }

                input ActorCreateInput {
                  actedIn: ActorActedInFieldInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorProductionActedInAggregateSelection {
                  count: CountConnection!
                  node: ActorProductionActedInNodeAggregateSelection
                }

                type ActorProductionActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                \\"\\"\\"
                Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                \\"\\"\\"
                input ActorSort {
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionRelationshipFilters
                  actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
                  actedInConnection: ActorActedInConnectionFilters
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
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

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
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

                type Movie implements Production {
                  description: String
                  title: String!
                }

                type MovieAggregate {
                  count: Count!
                  node: MovieAggregateNode!
                }

                type MovieAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieCreateInput {
                  description: String
                  title: String!
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                }

                input MovieWhere {
                  AND: [MovieWhere!]
                  NOT: MovieWhere
                  OR: [MovieWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(where: MovieWhere): DeleteInfo!
                  deleteSeries(where: SeriesWhere): DeleteInfo!
                  updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                interface Production {
                  description: String
                  title: String!
                }

                type ProductionAggregate {
                  count: Count!
                  node: ProductionAggregateNode!
                }

                type ProductionAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input ProductionConnectWhere {
                  node: ProductionWhere!
                }

                input ProductionCreateInput {
                  Movie: MovieCreateInput
                  Series: SeriesCreateInput
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
                  description: SortDirection
                  title: SortDirection
                }

                input ProductionWhere {
                  AND: [ProductionWhere!]
                  NOT: ProductionWhere
                  OR: [ProductionWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
                  title: StringScalarFilters
                  title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                  title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                  title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                  title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                  title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                  typename: [ProductionImplementation!]
                }

                type ProductionsConnection {
                  aggregate: ProductionAggregate!
                  edges: [ProductionEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Query {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
                  series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                type Series implements Production {
                  description: String
                  title: String!
                }

                type SeriesAggregate {
                  count: Count!
                  node: SeriesAggregateNode!
                }

                type SeriesAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                type SeriesConnection {
                  aggregate: SeriesAggregate!
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  description: String
                  title: String!
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  title: SortDirection
                }

                input SeriesUpdateInput {
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Prevent update on nested relationships", async () => {
            const typeDefs = gql`
                interface Production {
                    title: String!
                    description: String
                    actors: [Actor!]! @declareRelationship
                }

                type Movie implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Series implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT) @settable(onUpdate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  actedIn(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  connect: ProductionConnectInput
                  where: ProductionConnectWhere
                }

                type ActorActedInConnection {
                  aggregate: ActorProductionActedInAggregateSelection!
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionAggregateInput {
                  AND: [ActorActedInConnectionAggregateInput!]
                  NOT: ActorActedInConnectionAggregateInput
                  OR: [ActorActedInConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectionFilters {
                  \\"\\"\\"
                  Filter Actors by aggregating results on related ActorActedInConnections
                  \\"\\"\\"
                  aggregate: ActorActedInConnectionAggregateInput
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  all: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  none: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  single: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  some: ActorActedInConnectionWhere
                }

                input ActorActedInConnectionSort {
                  node: ProductionSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: ProductionWhere
                }

                input ActorActedInCreateFieldInput {
                  node: ProductionCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  delete: ProductionDeleteInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  disconnect: ProductionDisconnectInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description: StringScalarAggregationFilters
                  description_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { eq: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gte: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { eq: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { eq: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lte: ... } } }' instead.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  actedIn: ActorActedInFieldInput
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                input ActorDisconnectInput {
                  actedIn: [ActorActedInDisconnectFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorProductionActedInAggregateSelection {
                  count: CountConnection!
                  node: ActorProductionActedInNodeAggregateSelection
                }

                type ActorProductionActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
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
                  name: SortDirection
                }

                input ActorUpdateInput {
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionRelationshipFilters
                  actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
                  actedInConnection: ActorActedInConnectionFilters
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
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

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
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

                type Movie implements Production {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
                  description: String
                  title: String!
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

                input MovieActorsConnectionAggregateInput {
                  AND: [MovieActorsConnectionAggregateInput!]
                  NOT: MovieActorsConnectionAggregateInput
                  OR: [MovieActorsConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: MovieActorsNodeAggregationWhereInput
                }

                input MovieActorsConnectionFilters {
                  \\"\\"\\"
                  Filter Movies by aggregating results on related ProductionActorsConnections
                  \\"\\"\\"
                  aggregate: MovieActorsConnectionAggregateInput
                  \\"\\"\\"
                  Return Movies where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  all: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  none: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  single: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  some: ProductionActorsConnectionWhere
                }

                input MovieActorsCreateFieldInput {
                  node: ActorCreateInput!
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

                input MovieActorsUpdateConnectionInput {
                  node: ActorUpdateInput
                  where: ProductionActorsConnectionWhere
                }

                input MovieActorsUpdateFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                  create: [MovieActorsCreateFieldInput!]
                  delete: [ProductionActorsDeleteFieldInput!]
                  disconnect: [ProductionActorsDisconnectFieldInput!]
                  update: MovieActorsUpdateConnectionInput
                }

                type MovieAggregate {
                  count: Count!
                  node: MovieAggregateNode!
                }

                type MovieAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  description: String
                  title: String!
                }

                input MovieDeleteInput {
                  actors: [ProductionActorsDeleteFieldInput!]
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
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
                  Return Movies where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                  \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                  \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
                  updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                interface Production {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
                  description: String
                  title: String!
                }

                input ProductionActorsAggregateInput {
                  AND: [ProductionActorsAggregateInput!]
                  NOT: ProductionActorsAggregateInput
                  OR: [ProductionActorsAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: ProductionActorsNodeAggregationWhereInput
                }

                input ProductionActorsConnectFieldInput {
                  connect: [ActorConnectInput!]
                  where: ActorConnectWhere
                }

                type ProductionActorsConnection {
                  edges: [ProductionActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ProductionActorsConnectionAggregateInput {
                  AND: [ProductionActorsConnectionAggregateInput!]
                  NOT: ProductionActorsConnectionAggregateInput
                  OR: [ProductionActorsConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: ProductionActorsNodeAggregationWhereInput
                }

                input ProductionActorsConnectionFilters {
                  \\"\\"\\"
                  Filter Productions by aggregating results on related ProductionActorsConnections
                  \\"\\"\\"
                  aggregate: ProductionActorsConnectionAggregateInput
                  \\"\\"\\"
                  Return Productions where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  all: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Productions where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  none: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Productions where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  single: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Productions where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  some: ProductionActorsConnectionWhere
                }

                input ProductionActorsConnectionSort {
                  node: ActorSort
                }

                input ProductionActorsConnectionWhere {
                  AND: [ProductionActorsConnectionWhere!]
                  NOT: ProductionActorsConnectionWhere
                  OR: [ProductionActorsConnectionWhere!]
                  node: ActorWhere
                }

                input ProductionActorsDeleteFieldInput {
                  delete: ActorDeleteInput
                  where: ProductionActorsConnectionWhere
                }

                input ProductionActorsDisconnectFieldInput {
                  disconnect: ActorDisconnectInput
                  where: ProductionActorsConnectionWhere
                }

                input ProductionActorsNodeAggregationWhereInput {
                  AND: [ProductionActorsNodeAggregationWhereInput!]
                  NOT: ProductionActorsNodeAggregationWhereInput
                  OR: [ProductionActorsNodeAggregationWhereInput!]
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

                type ProductionActorsRelationship {
                  cursor: String!
                  node: Actor!
                }

                type ProductionAggregate {
                  count: Count!
                  node: ProductionAggregateNode!
                }

                type ProductionAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input ProductionConnectInput {
                  actors: [ProductionActorsConnectFieldInput!]
                }

                input ProductionConnectWhere {
                  node: ProductionWhere!
                }

                input ProductionCreateInput {
                  Movie: MovieCreateInput
                  Series: SeriesCreateInput
                }

                input ProductionDeleteInput {
                  actors: [ProductionActorsDeleteFieldInput!]
                }

                input ProductionDisconnectInput {
                  actors: [ProductionActorsDisconnectFieldInput!]
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
                  description: SortDirection
                  title: SortDirection
                }

                input ProductionWhere {
                  AND: [ProductionWhere!]
                  NOT: ProductionWhere
                  OR: [ProductionWhere!]
                  actors: ActorRelationshipFilters
                  actorsAggregate: ProductionActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
                  actorsConnection: ProductionActorsConnectionFilters
                  \\"\\"\\"
                  Return Productions where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Productions where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Productions where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Productions where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Productions where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                  \\"\\"\\"Return Productions where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                  \\"\\"\\"Return Productions where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Productions where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
                  title: StringScalarFilters
                  title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                  title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                  title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                  title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                  title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                  typename: [ProductionImplementation!]
                }

                type ProductionsConnection {
                  aggregate: ProductionAggregate!
                  edges: [ProductionEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Query {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
                  series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                type Series implements Production {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
                  description: String
                  title: String!
                }

                input SeriesActorsAggregateInput {
                  AND: [SeriesActorsAggregateInput!]
                  NOT: SeriesActorsAggregateInput
                  OR: [SeriesActorsAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: SeriesActorsNodeAggregationWhereInput
                }

                input SeriesActorsConnectFieldInput {
                  connect: [ActorConnectInput!]
                  where: ActorConnectWhere
                }

                input SeriesActorsConnectionAggregateInput {
                  AND: [SeriesActorsConnectionAggregateInput!]
                  NOT: SeriesActorsConnectionAggregateInput
                  OR: [SeriesActorsConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: SeriesActorsNodeAggregationWhereInput
                }

                input SeriesActorsConnectionFilters {
                  \\"\\"\\"
                  Filter Series by aggregating results on related ProductionActorsConnections
                  \\"\\"\\"
                  aggregate: SeriesActorsConnectionAggregateInput
                  \\"\\"\\"
                  Return Series where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  all: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Series where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  none: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Series where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  single: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Series where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  some: ProductionActorsConnectionWhere
                }

                input SeriesActorsCreateFieldInput {
                  node: ActorCreateInput!
                }

                input SeriesActorsFieldInput {
                  connect: [SeriesActorsConnectFieldInput!]
                  create: [SeriesActorsCreateFieldInput!]
                }

                input SeriesActorsNodeAggregationWhereInput {
                  AND: [SeriesActorsNodeAggregationWhereInput!]
                  NOT: SeriesActorsNodeAggregationWhereInput
                  OR: [SeriesActorsNodeAggregationWhereInput!]
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

                input SeriesActorsUpdateConnectionInput {
                  node: ActorUpdateInput
                  where: ProductionActorsConnectionWhere
                }

                input SeriesActorsUpdateFieldInput {
                  connect: [SeriesActorsConnectFieldInput!]
                  create: [SeriesActorsCreateFieldInput!]
                  delete: [ProductionActorsDeleteFieldInput!]
                  disconnect: [ProductionActorsDisconnectFieldInput!]
                  update: SeriesActorsUpdateConnectionInput
                }

                type SeriesAggregate {
                  count: Count!
                  node: SeriesAggregateNode!
                }

                type SeriesAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                type SeriesConnection {
                  aggregate: SeriesAggregate!
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  actors: SeriesActorsFieldInput
                  description: String
                  title: String!
                }

                input SeriesDeleteInput {
                  actors: [ProductionActorsDeleteFieldInput!]
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  title: SortDirection
                }

                input SeriesUpdateInput {
                  actors: [SeriesActorsUpdateFieldInput!]
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  actors: ActorRelationshipFilters
                  actorsAggregate: SeriesActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
                  actorsConnection: SeriesActorsConnectionFilters
                  \\"\\"\\"
                  Return Series where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Series where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Series where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Series where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                  \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                  \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });

        test("Prevent create on nested relationships", async () => {
            const typeDefs = gql`
                interface Production {
                    title: String!
                    description: String
                    actors: [Actor!]! @declareRelationship
                }

                type Movie implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Series implements Production @query(aggregate: true) @node {
                    title: String!
                    description: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT) @settable(onCreate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));
            expect(printedSchema).toMatchInlineSnapshot(`
                "schema {
                  query: Query
                  mutation: Mutation
                }

                type Actor {
                  actedIn(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  actedInConnection(after: String, first: Int, sort: [ActorActedInConnectionSort!], where: ActorActedInConnectionWhere): ActorActedInConnection!
                  name: String!
                }

                input ActorActedInAggregateInput {
                  AND: [ActorActedInAggregateInput!]
                  NOT: ActorActedInAggregateInput
                  OR: [ActorActedInAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectFieldInput {
                  connect: ProductionConnectInput
                  where: ProductionConnectWhere
                }

                type ActorActedInConnection {
                  aggregate: ActorProductionActedInAggregateSelection!
                  edges: [ActorActedInRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ActorActedInConnectionAggregateInput {
                  AND: [ActorActedInConnectionAggregateInput!]
                  NOT: ActorActedInConnectionAggregateInput
                  OR: [ActorActedInConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: ActorActedInNodeAggregationWhereInput
                }

                input ActorActedInConnectionFilters {
                  \\"\\"\\"
                  Filter Actors by aggregating results on related ActorActedInConnections
                  \\"\\"\\"
                  aggregate: ActorActedInConnectionAggregateInput
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  all: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  none: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  single: ActorActedInConnectionWhere
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  some: ActorActedInConnectionWhere
                }

                input ActorActedInConnectionSort {
                  node: ProductionSort
                }

                input ActorActedInConnectionWhere {
                  AND: [ActorActedInConnectionWhere!]
                  NOT: ActorActedInConnectionWhere
                  OR: [ActorActedInConnectionWhere!]
                  node: ProductionWhere
                }

                input ActorActedInCreateFieldInput {
                  node: ProductionCreateInput!
                }

                input ActorActedInDeleteFieldInput {
                  delete: ProductionDeleteInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInDisconnectFieldInput {
                  disconnect: ProductionDisconnectInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInNodeAggregationWhereInput {
                  AND: [ActorActedInNodeAggregationWhereInput!]
                  NOT: ActorActedInNodeAggregationWhereInput
                  OR: [ActorActedInNodeAggregationWhereInput!]
                  description: StringScalarAggregationFilters
                  description_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { eq: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { gte: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lt: ... } } }' instead.\\")
                  description_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'description: { averageLength: { lte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { eq: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { gte: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lt: ... } } }' instead.\\")
                  description_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { longestLength: { lte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { eq: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { gte: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lt: ... } } }' instead.\\")
                  description_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'description: { shortestLength: { lte: ... } } }' instead.\\")
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

                type ActorActedInRelationship {
                  cursor: String!
                  node: Production!
                }

                input ActorActedInUpdateConnectionInput {
                  node: ProductionUpdateInput
                  where: ActorActedInConnectionWhere
                }

                input ActorActedInUpdateFieldInput {
                  connect: [ActorActedInConnectFieldInput!]
                  create: [ActorActedInCreateFieldInput!]
                  delete: [ActorActedInDeleteFieldInput!]
                  disconnect: [ActorActedInDisconnectFieldInput!]
                  update: ActorActedInUpdateConnectionInput
                }

                type ActorAggregate {
                  count: Count!
                  node: ActorAggregateNode!
                }

                type ActorAggregateNode {
                  name: StringAggregateSelection!
                }

                input ActorConnectInput {
                  actedIn: [ActorActedInConnectFieldInput!]
                }

                input ActorConnectWhere {
                  node: ActorWhere!
                }

                input ActorCreateInput {
                  name: String!
                }

                input ActorDeleteInput {
                  actedIn: [ActorActedInDeleteFieldInput!]
                }

                input ActorDisconnectInput {
                  actedIn: [ActorActedInDisconnectFieldInput!]
                }

                type ActorEdge {
                  cursor: String!
                  node: Actor!
                }

                type ActorProductionActedInAggregateSelection {
                  count: CountConnection!
                  node: ActorProductionActedInNodeAggregateSelection
                }

                type ActorProductionActedInNodeAggregateSelection {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
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
                  name: SortDirection
                }

                input ActorUpdateInput {
                  actedIn: [ActorActedInUpdateFieldInput!]
                  name: StringScalarMutations
                  name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
                }

                input ActorWhere {
                  AND: [ActorWhere!]
                  NOT: ActorWhere
                  OR: [ActorWhere!]
                  actedIn: ProductionRelationshipFilters
                  actedInAggregate: ActorActedInAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actedInConnection filter, please use { actedInConnection: { aggregate: {...} } } instead\\")
                  actedInConnection: ActorActedInConnectionFilters
                  \\"\\"\\"
                  Return Actors where all of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_ALL: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where none of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_NONE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where one of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SINGLE: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Actors where some of the related ActorActedInConnections match this filter
                  \\"\\"\\"
                  actedInConnection_SOME: ActorActedInConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedInConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Actors where all of the related Productions match this filter\\"\\"\\"
                  actedIn_ALL: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { all: ... }' instead.\\")
                  \\"\\"\\"Return Actors where none of the related Productions match this filter\\"\\"\\"
                  actedIn_NONE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: { none: ... }' instead.\\")
                  \\"\\"\\"Return Actors where one of the related Productions match this filter\\"\\"\\"
                  actedIn_SINGLE: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Actors where some of the related Productions match this filter\\"\\"\\"
                  actedIn_SOME: ProductionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actedIn: {  some: ... }' instead.\\")
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

                type CreateSeriesMutationResponse {
                  info: CreateInfo!
                  series: [Series!]!
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

                type Movie implements Production {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
                  description: String
                  title: String!
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

                input MovieActorsConnectionAggregateInput {
                  AND: [MovieActorsConnectionAggregateInput!]
                  NOT: MovieActorsConnectionAggregateInput
                  OR: [MovieActorsConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: MovieActorsNodeAggregationWhereInput
                }

                input MovieActorsConnectionFilters {
                  \\"\\"\\"
                  Filter Movies by aggregating results on related ProductionActorsConnections
                  \\"\\"\\"
                  aggregate: MovieActorsConnectionAggregateInput
                  \\"\\"\\"
                  Return Movies where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  all: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  none: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  single: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Movies where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  some: ProductionActorsConnectionWhere
                }

                input MovieActorsCreateFieldInput {
                  node: ActorCreateInput!
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

                input MovieActorsUpdateConnectionInput {
                  node: ActorUpdateInput
                  where: ProductionActorsConnectionWhere
                }

                input MovieActorsUpdateFieldInput {
                  connect: [MovieActorsConnectFieldInput!]
                  create: [MovieActorsCreateFieldInput!]
                  delete: [ProductionActorsDeleteFieldInput!]
                  disconnect: [ProductionActorsDisconnectFieldInput!]
                  update: MovieActorsUpdateConnectionInput
                }

                type MovieAggregate {
                  count: Count!
                  node: MovieAggregateNode!
                }

                type MovieAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input MovieCreateInput {
                  actors: MovieActorsFieldInput
                  description: String
                  title: String!
                }

                input MovieDeleteInput {
                  actors: [ProductionActorsDeleteFieldInput!]
                }

                type MovieEdge {
                  cursor: String!
                  node: Movie!
                }

                \\"\\"\\"
                Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                \\"\\"\\"
                input MovieSort {
                  description: SortDirection
                  title: SortDirection
                }

                input MovieUpdateInput {
                  actors: [MovieActorsUpdateFieldInput!]
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
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
                  Return Movies where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Movies where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                  \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                  \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                  createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                  createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
                  deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                  deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                  deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
                  updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                  updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                  updateSeries(update: SeriesUpdateInput, where: SeriesWhere): UpdateSeriesMutationResponse!
                }

                \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                type PageInfo {
                  endCursor: String
                  hasNextPage: Boolean!
                  hasPreviousPage: Boolean!
                  startCursor: String
                }

                interface Production {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
                  description: String
                  title: String!
                }

                input ProductionActorsAggregateInput {
                  AND: [ProductionActorsAggregateInput!]
                  NOT: ProductionActorsAggregateInput
                  OR: [ProductionActorsAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: ProductionActorsNodeAggregationWhereInput
                }

                input ProductionActorsConnectFieldInput {
                  connect: [ActorConnectInput!]
                  where: ActorConnectWhere
                }

                type ProductionActorsConnection {
                  edges: [ProductionActorsRelationship!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input ProductionActorsConnectionAggregateInput {
                  AND: [ProductionActorsConnectionAggregateInput!]
                  NOT: ProductionActorsConnectionAggregateInput
                  OR: [ProductionActorsConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: ProductionActorsNodeAggregationWhereInput
                }

                input ProductionActorsConnectionFilters {
                  \\"\\"\\"
                  Filter Productions by aggregating results on related ProductionActorsConnections
                  \\"\\"\\"
                  aggregate: ProductionActorsConnectionAggregateInput
                  \\"\\"\\"
                  Return Productions where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  all: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Productions where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  none: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Productions where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  single: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Productions where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  some: ProductionActorsConnectionWhere
                }

                input ProductionActorsConnectionSort {
                  node: ActorSort
                }

                input ProductionActorsConnectionWhere {
                  AND: [ProductionActorsConnectionWhere!]
                  NOT: ProductionActorsConnectionWhere
                  OR: [ProductionActorsConnectionWhere!]
                  node: ActorWhere
                }

                input ProductionActorsCreateFieldInput {
                  node: ActorCreateInput!
                }

                input ProductionActorsDeleteFieldInput {
                  delete: ActorDeleteInput
                  where: ProductionActorsConnectionWhere
                }

                input ProductionActorsDisconnectFieldInput {
                  disconnect: ActorDisconnectInput
                  where: ProductionActorsConnectionWhere
                }

                input ProductionActorsNodeAggregationWhereInput {
                  AND: [ProductionActorsNodeAggregationWhereInput!]
                  NOT: ProductionActorsNodeAggregationWhereInput
                  OR: [ProductionActorsNodeAggregationWhereInput!]
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

                type ProductionActorsRelationship {
                  cursor: String!
                  node: Actor!
                }

                input ProductionActorsUpdateConnectionInput {
                  node: ActorUpdateInput
                  where: ProductionActorsConnectionWhere
                }

                input ProductionActorsUpdateFieldInput {
                  connect: [ProductionActorsConnectFieldInput!]
                  create: [ProductionActorsCreateFieldInput!]
                  delete: [ProductionActorsDeleteFieldInput!]
                  disconnect: [ProductionActorsDisconnectFieldInput!]
                  update: ProductionActorsUpdateConnectionInput
                }

                type ProductionAggregate {
                  count: Count!
                  node: ProductionAggregateNode!
                }

                type ProductionAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                input ProductionConnectInput {
                  actors: [ProductionActorsConnectFieldInput!]
                }

                input ProductionConnectWhere {
                  node: ProductionWhere!
                }

                input ProductionCreateInput {
                  Movie: MovieCreateInput
                  Series: SeriesCreateInput
                }

                input ProductionDeleteInput {
                  actors: [ProductionActorsDeleteFieldInput!]
                }

                input ProductionDisconnectInput {
                  actors: [ProductionActorsDisconnectFieldInput!]
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
                  description: SortDirection
                  title: SortDirection
                }

                input ProductionUpdateInput {
                  actors: [ProductionActorsUpdateFieldInput!]
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                }

                input ProductionWhere {
                  AND: [ProductionWhere!]
                  NOT: ProductionWhere
                  OR: [ProductionWhere!]
                  actors: ActorRelationshipFilters
                  actorsAggregate: ProductionActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
                  actorsConnection: ProductionActorsConnectionFilters
                  \\"\\"\\"
                  Return Productions where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Productions where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Productions where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Productions where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Productions where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                  \\"\\"\\"Return Productions where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                  \\"\\"\\"Return Productions where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Productions where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
                  title: StringScalarFilters
                  title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                  title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                  title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                  title_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                  title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                  typename: [ProductionImplementation!]
                }

                type ProductionsConnection {
                  aggregate: ProductionAggregate!
                  edges: [ProductionEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                type Query {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                  movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                  moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                  productions(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
                  productionsConnection(after: String, first: Int, sort: [ProductionSort!], where: ProductionWhere): ProductionsConnection!
                  series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
                  seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
                }

                type Series implements Production {
                  actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                  actorsConnection(after: String, first: Int, sort: [ProductionActorsConnectionSort!], where: ProductionActorsConnectionWhere): ProductionActorsConnection!
                  description: String
                  title: String!
                }

                input SeriesActorsAggregateInput {
                  AND: [SeriesActorsAggregateInput!]
                  NOT: SeriesActorsAggregateInput
                  OR: [SeriesActorsAggregateInput!]
                  count: IntScalarFilters
                  count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                  count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                  count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                  count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                  count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                  node: SeriesActorsNodeAggregationWhereInput
                }

                input SeriesActorsConnectFieldInput {
                  connect: [ActorConnectInput!]
                  where: ActorConnectWhere
                }

                input SeriesActorsConnectionAggregateInput {
                  AND: [SeriesActorsConnectionAggregateInput!]
                  NOT: SeriesActorsConnectionAggregateInput
                  OR: [SeriesActorsConnectionAggregateInput!]
                  count: ConnectionAggregationCountFilterInput
                  node: SeriesActorsNodeAggregationWhereInput
                }

                input SeriesActorsConnectionFilters {
                  \\"\\"\\"
                  Filter Series by aggregating results on related ProductionActorsConnections
                  \\"\\"\\"
                  aggregate: SeriesActorsConnectionAggregateInput
                  \\"\\"\\"
                  Return Series where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  all: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Series where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  none: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Series where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  single: ProductionActorsConnectionWhere
                  \\"\\"\\"
                  Return Series where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  some: ProductionActorsConnectionWhere
                }

                input SeriesActorsCreateFieldInput {
                  node: ActorCreateInput!
                }

                input SeriesActorsFieldInput {
                  connect: [SeriesActorsConnectFieldInput!]
                  create: [SeriesActorsCreateFieldInput!]
                }

                input SeriesActorsNodeAggregationWhereInput {
                  AND: [SeriesActorsNodeAggregationWhereInput!]
                  NOT: SeriesActorsNodeAggregationWhereInput
                  OR: [SeriesActorsNodeAggregationWhereInput!]
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

                input SeriesActorsUpdateConnectionInput {
                  node: ActorUpdateInput
                  where: ProductionActorsConnectionWhere
                }

                input SeriesActorsUpdateFieldInput {
                  connect: [SeriesActorsConnectFieldInput!]
                  create: [SeriesActorsCreateFieldInput!]
                  delete: [ProductionActorsDeleteFieldInput!]
                  disconnect: [ProductionActorsDisconnectFieldInput!]
                  update: SeriesActorsUpdateConnectionInput
                }

                type SeriesAggregate {
                  count: Count!
                  node: SeriesAggregateNode!
                }

                type SeriesAggregateNode {
                  description: StringAggregateSelection!
                  title: StringAggregateSelection!
                }

                type SeriesConnection {
                  aggregate: SeriesAggregate!
                  edges: [SeriesEdge!]!
                  pageInfo: PageInfo!
                  totalCount: Int!
                }

                input SeriesCreateInput {
                  actors: SeriesActorsFieldInput
                  description: String
                  title: String!
                }

                input SeriesDeleteInput {
                  actors: [ProductionActorsDeleteFieldInput!]
                }

                type SeriesEdge {
                  cursor: String!
                  node: Series!
                }

                \\"\\"\\"
                Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
                \\"\\"\\"
                input SeriesSort {
                  description: SortDirection
                  title: SortDirection
                }

                input SeriesUpdateInput {
                  actors: [SeriesActorsUpdateFieldInput!]
                  description: StringScalarMutations
                  description_SET: String @deprecated(reason: \\"Please use the generic mutation 'description: { set: ... } }' instead.\\")
                  title: StringScalarMutations
                  title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                }

                input SeriesWhere {
                  AND: [SeriesWhere!]
                  NOT: SeriesWhere
                  OR: [SeriesWhere!]
                  actors: ActorRelationshipFilters
                  actorsAggregate: SeriesActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
                  actorsConnection: SeriesActorsConnectionFilters
                  \\"\\"\\"
                  Return Series where all of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_ALL: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Series where none of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_NONE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Series where one of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SINGLE: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                  \\"\\"\\"
                  Return Series where some of the related ProductionActorsConnections match this filter
                  \\"\\"\\"
                  actorsConnection_SOME: ProductionActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                  \\"\\"\\"Return Series where all of the related Actors match this filter\\"\\"\\"
                  actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                  \\"\\"\\"Return Series where none of the related Actors match this filter\\"\\"\\"
                  actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                  \\"\\"\\"Return Series where one of the related Actors match this filter\\"\\"\\"
                  actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                  \\"\\"\\"Return Series where some of the related Actors match this filter\\"\\"\\"
                  actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                  description: StringScalarFilters
                  description_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter description: { contains: ... }\\")
                  description_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { endsWith: ... }\\")
                  description_EQ: String @deprecated(reason: \\"Please use the relevant generic filter description: { eq: ... }\\")
                  description_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter description: { in: ... }\\")
                  description_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter description: { startsWith: ... }\\")
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
                }

                type UpdateSeriesMutationResponse {
                  info: UpdateInfo!
                  series: [Series!]!
                }"
            `);
        });
    });
});
