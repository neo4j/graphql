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

describe("https://github.com/neo4j/graphql/issues/5821", () => {
    test("does not generate queries for interfaces without implementation", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
            }

            type Actor @node {
                name: String
            }

            interface Production {
                name: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Actor {
              name: String
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            input ActorCreateInput {
              name: String
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
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type Movie {
              title: String
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              title: String
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
              title: StringScalarMutations
              title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
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
