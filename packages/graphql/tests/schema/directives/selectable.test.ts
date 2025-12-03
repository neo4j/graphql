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
import { Neo4jGraphQL } from "../../../src";
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";

describe("@selectable", () => {
    test("Disable read fields", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @query(aggregate: true) @node {
                title: String!
                description: String @selectable(onRead: false, onAggregate: true)
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

    test("Disable aggregation fields", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @query(aggregate: true) @node {
                title: String!
                description: String @selectable(onRead: true, onAggregate: false)
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

    test("Disable read and aggregate fields", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @query(aggregate: true) @node {
                title: String!
                description: String @selectable(onRead: false, onAggregate: false)
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

    test("Disable read fields on subscriptions", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @query(aggregate: true) @node {
                title: String!
                description: String @selectable(onRead: false, onAggregate: true)
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

    describe("relationships fields to a concrete type", () => {
        test("Disable read on relationship field", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Movie!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @selectable(onRead: false, onAggregate: true)
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
        test("Disable aggregation on relationship field (no-op as controlled by @relationship(aggregate: false))", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @query(aggregate: true) @node {
                    title: String!
                    description: String
                }

                type Actor @query(aggregate: true) @node {
                    name: String!
                    actedIn: [Movie!]!
                        @relationship(type: "ACTED_IN", direction: OUT)
                        @selectable(onRead: true, onAggregate: true)
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
    });

    describe("relationships fields to a union type", () => {
        test("Disable read on relationship field", async () => {
            const typeDefs = /* GraphQL */ `
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
                        @selectable(onRead: false, onAggregate: true)
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
                  name: String!
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

                input ActorActedInMovieDisconnectFieldInput {
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieFieldInput {
                  connect: [ActorActedInMovieConnectFieldInput!]
                  create: [ActorActedInMovieCreateFieldInput!]
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
        test("Disable aggregation on relationship field (no-op as controlled by @relationship(aggregate: false))", async () => {
            const typeDefs = /* GraphQL */ `
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
                        @selectable(onRead: true, onAggregate: false)
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

                input ActorActedInMovieDisconnectFieldInput {
                  where: ActorActedInMovieConnectionWhere
                }

                input ActorActedInMovieFieldInput {
                  connect: [ActorActedInMovieConnectFieldInput!]
                  create: [ActorActedInMovieCreateFieldInput!]
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

                input ActorActedInSeriesFieldInput {
                  connect: [ActorActedInSeriesConnectFieldInput!]
                  create: [ActorActedInSeriesCreateFieldInput!]
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
    });

    describe("relationships fields to an interface type", () => {
        test("Disable read on relationship field", async () => {
            const typeDefs = /* GraphQL */ `
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
                        @selectable(onRead: false, onAggregate: true)
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
        test("Disable aggregation on relationship field (no-op as controlled by @relationship(aggregate: false))", async () => {
            const typeDefs = /* GraphQL */ `
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
                        @selectable(onRead: true, onAggregate: false)
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
    });
});
