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

describe("single item relationships from a declared relationship", () => {
    test("1-* relationship", async () => {
        const typeDefs = gql`
            interface Actor {
                name: String!
            }
            interface Production {
                title: String!
                actor: Actor @declareRelationship
                director: Person! @declareRelationship
            }

            type Movie @node {
                title: String!
                actor: Actor @relationship(type: "ACTED_IN", direction: IN)
                director: Person! @relationship(type: "DIRECTED", direction: IN)
            }

            type Series @node {
                name: String!
                actor: Actor @relationship(type: "ACTED_IN", direction: IN)
                director: Person! @relationship(type: "DIRECTED", direction: IN)
            }

            type Dog implements Actor @node {
                name: String!
            }

            type Person implements Actor @node {
                name: String!
            }
        `;
        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                excludeDeprecatedFields: {
                    mutationOperations: true,
                    aggregationFilters: true,
                    aggregationFiltersOutsideConnection: true,
                    relationshipFilters: true,
                    attributeFilters: true,
                },
            },
        });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            interface Actor {
              name: String!
            }

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            enum ActorImplementation {
              Dog
              Person
            }

            \\"\\"\\"
            Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
            \\"\\"\\"
            input ActorSort {
              name: SortDirection
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              name: StringScalarFilters
              typename: [ActorImplementation!]
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

            type CreateDogsMutationResponse {
              dogs: [Dog!]!
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

            type Dog implements Actor {
              name: String!
            }

            type DogAggregate {
              count: Count!
              node: DogAggregateNode!
            }

            type DogAggregateNode {
              name: StringAggregateSelection!
            }

            input DogCreateInput {
              name: String!
            }

            type DogEdge {
              cursor: String!
              node: Dog!
            }

            \\"\\"\\"
            Fields to sort Dogs by. The order in which sorts are applied is not guaranteed when specifying many fields in one DogSort object.
            \\"\\"\\"
            input DogSort {
              name: SortDirection
            }

            input DogUpdateInput {
              name: StringScalarMutations
            }

            input DogWhere {
              AND: [DogWhere!]
              NOT: DogWhere
              OR: [DogWhere!]
              name: StringScalarFilters
            }

            type DogsConnection {
              aggregate: DogAggregate!
              edges: [DogEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Movie {
              actor(where: ActorWhere): Actor
              actorConnection(where: MovieActorConnectionWhere): MovieActorConnection!
              director(where: PersonWhere): Person!
              directorConnection(where: MovieDirectorConnectionWhere): MovieDirectorConnection!
              title: String!
            }

            type MovieActorConnection {
              edges: [MovieActorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorConnectionWhere {
              AND: [MovieActorConnectionWhere!]
              NOT: MovieActorConnectionWhere
              OR: [MovieActorConnectionWhere!]
              node: ActorWhere
            }

            type MovieActorRelationship {
              cursor: String!
              node: Actor!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              title: String!
            }

            type MovieDirectorConnection {
              edges: [MovieDirectorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieDirectorConnectionWhere {
              AND: [MovieDirectorConnectionWhere!]
              NOT: MovieDirectorConnectionWhere
              OR: [MovieDirectorConnectionWhere!]
              node: PersonWhere
            }

            type MovieDirectorRelationship {
              cursor: String!
              node: Person!
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
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              title: StringScalarFilters
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createDogs(input: [DogCreateInput!]!): CreateDogsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              createSeries(input: [SeriesCreateInput!]!): CreateSeriesMutationResponse!
              deleteDogs(where: DogWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              deletePeople(where: PersonWhere): DeleteInfo!
              deleteSeries(where: SeriesWhere): DeleteInfo!
              updateDogs(update: DogUpdateInput, where: DogWhere): UpdateDogsMutationResponse!
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

            type Person implements Actor {
              name: String!
            }

            type PersonAggregate {
              count: Count!
              node: PersonAggregateNode!
            }

            type PersonAggregateNode {
              name: StringAggregateSelection!
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
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              name: StringScalarFilters
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              dogs(limit: Int, offset: Int, sort: [DogSort!], where: DogWhere): [Dog!]!
              dogsConnection(after: String, first: Int, sort: [DogSort!], where: DogWhere): DogsConnection!
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
              people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
              peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
              series(limit: Int, offset: Int, sort: [SeriesSort!], where: SeriesWhere): [Series!]!
              seriesConnection(after: String, first: Int, sort: [SeriesSort!], where: SeriesWhere): SeriesConnection!
            }

            type Series {
              actor(where: ActorWhere): Actor
              actorConnection(where: SeriesActorConnectionWhere): SeriesActorConnection!
              director(where: PersonWhere): Person!
              directorConnection(where: SeriesDirectorConnectionWhere): SeriesDirectorConnection!
              name: String!
            }

            type SeriesActorConnection {
              edges: [SeriesActorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesActorConnectionWhere {
              AND: [SeriesActorConnectionWhere!]
              NOT: SeriesActorConnectionWhere
              OR: [SeriesActorConnectionWhere!]
              node: ActorWhere
            }

            type SeriesActorRelationship {
              cursor: String!
              node: Actor!
            }

            type SeriesAggregate {
              count: Count!
              node: SeriesAggregateNode!
            }

            type SeriesAggregateNode {
              name: StringAggregateSelection!
            }

            type SeriesConnection {
              aggregate: SeriesAggregate!
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              name: String!
            }

            type SeriesDirectorConnection {
              edges: [SeriesDirectorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesDirectorConnectionWhere {
              AND: [SeriesDirectorConnectionWhere!]
              NOT: SeriesDirectorConnectionWhere
              OR: [SeriesDirectorConnectionWhere!]
              node: PersonWhere
            }

            type SeriesDirectorRelationship {
              cursor: String!
              node: Person!
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              name: SortDirection
            }

            input SeriesUpdateInput {
              name: StringScalarMutations
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              name: StringScalarFilters
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

            type UpdateDogsMutationResponse {
              dogs: [Dog!]!
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
            }

            type UpdateSeriesMutationResponse {
              info: UpdateInfo!
              series: [Series!]!
            }"
        `);
    });
});
