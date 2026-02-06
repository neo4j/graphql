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
    test("1-1 relationship", async () => {
        const typeDefs = gql`
            interface Actor {
                name: String!
            }
            interface Production {
                title: String!
                actor: Actor @declareRelationship
                director: Person @declareRelationship
            }

            type Movie implements Production @node {
                title: String!
                actor: Actor @relationship(type: "ACTED_IN", direction: IN)
                director: Person @relationship(type: "DIRECTED", direction: IN)
            }

            type Series implements Production @node {
                title: String!
                actor: Actor @relationship(type: "ACTED_IN", direction: IN)
                director: Person @relationship(type: "DIRECTED", direction: IN)
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

            input ActorCreateInput {
              Dog: DogCreateInput
              Person: PersonCreateInput
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

            type Movie implements Production {
              actor: Actor
              actorConnection: ProductionActorConnection!
              director: Person
              directorConnection: ProductionDirectorConnection!
              title: String!
            }

            input MovieActorCreateFieldInput {
              node: ActorCreateInput!
            }

            input MovieActorFieldInput {
              create: MovieActorCreateFieldInput
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              actor: MovieActorFieldInput
              director: MovieDirectorFieldInput
              title: String!
            }

            input MovieDirectorCreateFieldInput {
              node: PersonCreateInput!
            }

            input MovieDirectorFieldInput {
              create: MovieDirectorCreateFieldInput
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
              actor: ActorWhere
              actorConnection: ProductionActorConnectionWhere
              director: PersonWhere
              directorConnection: ProductionDirectorConnectionWhere
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

            interface Production {
              actor: Actor
              actorConnection: ProductionActorConnection!
              director: Person
              directorConnection: ProductionDirectorConnection!
              title: String!
            }

            type ProductionActorConnection {
              edges: [ProductionActorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionActorConnectionWhere {
              AND: [ProductionActorConnectionWhere!]
              NOT: ProductionActorConnectionWhere
              OR: [ProductionActorConnectionWhere!]
              node: ActorWhere
            }

            type ProductionActorRelationship {
              cursor: String!
              node: Actor!
            }

            type ProductionAggregate {
              count: Count!
              node: ProductionAggregateNode!
            }

            type ProductionAggregateNode {
              title: StringAggregateSelection!
            }

            type ProductionDirectorConnection {
              edges: [ProductionDirectorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionDirectorConnectionWhere {
              AND: [ProductionDirectorConnectionWhere!]
              NOT: ProductionDirectorConnectionWhere
              OR: [ProductionDirectorConnectionWhere!]
              node: PersonWhere
            }

            type ProductionDirectorRelationship {
              cursor: String!
              node: Person!
            }

            type ProductionEdge {
              cursor: String!
              node: Production!
            }

            enum ProductionImplementation {
              Movie
              Series
            }

            \\"\\"\\"
            Fields to sort Productions by. The order in which sorts are applied is not guaranteed when specifying many fields in one ProductionSort object.
            \\"\\"\\"
            input ProductionSort {
              title: SortDirection
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              actor: ActorWhere
              actorConnection: ProductionActorConnectionWhere
              director: PersonWhere
              directorConnection: ProductionDirectorConnectionWhere
              title: StringScalarFilters
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
              dogs(limit: Int, offset: Int, sort: [DogSort!], where: DogWhere): [Dog!]!
              dogsConnection(after: String, first: Int, sort: [DogSort!], where: DogWhere): DogsConnection!
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
              actor: Actor
              actorConnection: ProductionActorConnection!
              director: Person
              directorConnection: ProductionDirectorConnection!
              title: String!
            }

            input SeriesActorCreateFieldInput {
              node: ActorCreateInput!
            }

            input SeriesActorFieldInput {
              create: SeriesActorCreateFieldInput
            }

            type SeriesAggregate {
              count: Count!
              node: SeriesAggregateNode!
            }

            type SeriesAggregateNode {
              title: StringAggregateSelection!
            }

            type SeriesConnection {
              aggregate: SeriesAggregate!
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              actor: SeriesActorFieldInput
              director: SeriesDirectorFieldInput
              title: String!
            }

            input SeriesDirectorCreateFieldInput {
              node: PersonCreateInput!
            }

            input SeriesDirectorFieldInput {
              create: SeriesDirectorCreateFieldInput
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              title: SortDirection
            }

            input SeriesUpdateInput {
              title: StringScalarMutations
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actor: ActorWhere
              actorConnection: ProductionActorConnectionWhere
              director: PersonWhere
              directorConnection: ProductionDirectorConnectionWhere
              title: StringScalarFilters
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
    test("1-* relationship", async () => {
        const typeDefs = gql`
            interface Actor {
                name: String!
                actedIn: Production @declareRelationship
                directed: [Production!]! @declareRelationship
            }
            interface Production {
                title: String!
                actor: [Actor!]! @declareRelationship
                director: Person @declareRelationship
            }

            type Movie implements Production @node {
                title: String!
                actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                director: Person @relationship(type: "DIRECTED", direction: IN)
            }

            type Series implements Production @node {
                title: String!
                actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                director: Person @relationship(type: "DIRECTED", direction: IN)
            }

            type Dog implements Actor @node {
                name: String!
                actedIn: Production @relationship(type: "ACTED_IN", direction: OUT)
                directed: [Production!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type Person implements Actor @node {
                name: String!
                actedIn: Production @relationship(type: "ACTED_IN", direction: OUT)
                directed: [Production!]! @relationship(type: "DIRECTED", direction: OUT)
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
              actedIn: Production
              actedInConnection: ActorActedInConnection!
              directed(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              directedConnection(after: String, first: Int, sort: [ActorDirectedConnectionSort!], where: ActorDirectedConnectionWhere): ActorDirectedConnection!
              name: String!
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              node: ProductionWhere
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
              directed: [ActorDirectedConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              Dog: DogCreateInput
              Person: PersonCreateInput
            }

            input ActorDeleteInput {
              directed: [ActorDirectedDeleteFieldInput!]
            }

            input ActorDirectedConnectFieldInput {
              connect: ProductionConnectInput
              where: ProductionConnectWhere
            }

            type ActorDirectedConnection {
              edges: [ActorDirectedRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorDirectedConnectionAggregateInput {
              AND: [ActorDirectedConnectionAggregateInput!]
              NOT: ActorDirectedConnectionAggregateInput
              OR: [ActorDirectedConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: ActorDirectedNodeAggregationWhereInput
            }

            input ActorDirectedConnectionFilters {
              \\"\\"\\"
              Filter Actors by aggregating results on related ActorDirectedConnections
              \\"\\"\\"
              aggregate: ActorDirectedConnectionAggregateInput
              \\"\\"\\"
              Return Actors where all of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              all: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              none: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              single: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              some: ActorDirectedConnectionWhere
            }

            input ActorDirectedConnectionSort {
              node: ProductionSort
            }

            input ActorDirectedConnectionWhere {
              AND: [ActorDirectedConnectionWhere!]
              NOT: ActorDirectedConnectionWhere
              OR: [ActorDirectedConnectionWhere!]
              node: ProductionWhere
            }

            input ActorDirectedCreateFieldInput {
              node: ProductionCreateInput!
            }

            input ActorDirectedDeleteFieldInput {
              delete: ProductionDeleteInput
              where: ActorDirectedConnectionWhere
            }

            input ActorDirectedDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: ActorDirectedConnectionWhere
            }

            input ActorDirectedNodeAggregationWhereInput {
              AND: [ActorDirectedNodeAggregationWhereInput!]
              NOT: ActorDirectedNodeAggregationWhereInput
              OR: [ActorDirectedNodeAggregationWhereInput!]
              title: StringScalarAggregationFilters
            }

            type ActorDirectedRelationship {
              cursor: String!
              node: Production!
            }

            input ActorDirectedUpdateConnectionInput {
              node: ProductionUpdateInput
              where: ActorDirectedConnectionWhere
            }

            input ActorDirectedUpdateFieldInput {
              connect: [ActorDirectedConnectFieldInput!]
              create: [ActorDirectedCreateFieldInput!]
              delete: [ActorDirectedDeleteFieldInput!]
              disconnect: [ActorDirectedDisconnectFieldInput!]
              update: ActorDirectedUpdateConnectionInput
            }

            input ActorDisconnectInput {
              directed: [ActorDirectedDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            enum ActorImplementation {
              Dog
              Person
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
              directed: [ActorDirectedUpdateFieldInput!]
              name: StringScalarMutations
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ProductionWhere
              actedInConnection: ActorActedInConnectionWhere
              directed: ProductionRelationshipFilters
              directedConnection: ActorDirectedConnectionFilters
              name: StringScalarFilters
              typename: [ActorImplementation!]
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
              actedIn: Production
              actedInConnection: ActorActedInConnection!
              directed(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              directedConnection(after: String, first: Int, sort: [ActorDirectedConnectionSort!], where: ActorDirectedConnectionWhere): ActorDirectedConnection!
              name: String!
            }

            input DogActedInCreateFieldInput {
              node: ProductionCreateInput!
            }

            input DogActedInFieldInput {
              create: DogActedInCreateFieldInput
            }

            type DogAggregate {
              count: Count!
              node: DogAggregateNode!
            }

            type DogAggregateNode {
              name: StringAggregateSelection!
            }

            input DogCreateInput {
              actedIn: DogActedInFieldInput
              directed: DogDirectedFieldInput
              name: String!
            }

            input DogDeleteInput {
              directed: [DogDirectedDeleteFieldInput!]
            }

            input DogDirectedConnectFieldInput {
              connect: ProductionConnectInput
              where: ProductionConnectWhere
            }

            input DogDirectedConnectionAggregateInput {
              AND: [DogDirectedConnectionAggregateInput!]
              NOT: DogDirectedConnectionAggregateInput
              OR: [DogDirectedConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: DogDirectedNodeAggregationWhereInput
            }

            input DogDirectedConnectionFilters {
              \\"\\"\\"Filter Dogs by aggregating results on related ActorDirectedConnections\\"\\"\\"
              aggregate: DogDirectedConnectionAggregateInput
              \\"\\"\\"
              Return Dogs where all of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              all: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return Dogs where none of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              none: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return Dogs where one of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              single: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return Dogs where some of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              some: ActorDirectedConnectionWhere
            }

            input DogDirectedCreateFieldInput {
              node: ProductionCreateInput!
            }

            input DogDirectedDeleteFieldInput {
              delete: ProductionDeleteInput
              where: ActorDirectedConnectionWhere
            }

            input DogDirectedDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: ActorDirectedConnectionWhere
            }

            input DogDirectedFieldInput {
              connect: [DogDirectedConnectFieldInput!]
              create: [DogDirectedCreateFieldInput!]
            }

            input DogDirectedNodeAggregationWhereInput {
              AND: [DogDirectedNodeAggregationWhereInput!]
              NOT: DogDirectedNodeAggregationWhereInput
              OR: [DogDirectedNodeAggregationWhereInput!]
              title: StringScalarAggregationFilters
            }

            input DogDirectedUpdateConnectionInput {
              node: ProductionUpdateInput
              where: ActorDirectedConnectionWhere
            }

            input DogDirectedUpdateFieldInput {
              connect: [DogDirectedConnectFieldInput!]
              create: [DogDirectedCreateFieldInput!]
              delete: [DogDirectedDeleteFieldInput!]
              disconnect: [DogDirectedDisconnectFieldInput!]
              update: DogDirectedUpdateConnectionInput
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
              directed: [DogDirectedUpdateFieldInput!]
              name: StringScalarMutations
            }

            input DogWhere {
              AND: [DogWhere!]
              NOT: DogWhere
              OR: [DogWhere!]
              actedIn: ProductionWhere
              actedInConnection: ActorActedInConnectionWhere
              directed: ProductionRelationshipFilters
              directedConnection: DogDirectedConnectionFilters
              name: StringScalarFilters
            }

            type DogsConnection {
              aggregate: DogAggregate!
              edges: [DogEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              actor(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorConnection(after: String, first: Int, sort: [ProductionActorConnectionSort!], where: ProductionActorConnectionWhere): ProductionActorConnection!
              director: Person
              directorConnection: ProductionDirectorConnection!
              title: String!
            }

            input MovieActorConnectFieldInput {
              connect: ActorConnectInput
              where: ActorConnectWhere
            }

            input MovieActorConnectionAggregateInput {
              AND: [MovieActorConnectionAggregateInput!]
              NOT: MovieActorConnectionAggregateInput
              OR: [MovieActorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: MovieActorNodeAggregationWhereInput
            }

            input MovieActorConnectionFilters {
              \\"\\"\\"
              Filter Movies by aggregating results on related ProductionActorConnections
              \\"\\"\\"
              aggregate: MovieActorConnectionAggregateInput
              \\"\\"\\"
              Return Movies where all of the related ProductionActorConnections match this filter
              \\"\\"\\"
              all: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related ProductionActorConnections match this filter
              \\"\\"\\"
              none: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related ProductionActorConnections match this filter
              \\"\\"\\"
              single: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related ProductionActorConnections match this filter
              \\"\\"\\"
              some: ProductionActorConnectionWhere
            }

            input MovieActorCreateFieldInput {
              node: ActorCreateInput!
            }

            input MovieActorDeleteFieldInput {
              delete: ActorDeleteInput
              where: ProductionActorConnectionWhere
            }

            input MovieActorDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: ProductionActorConnectionWhere
            }

            input MovieActorFieldInput {
              connect: [MovieActorConnectFieldInput!]
              create: [MovieActorCreateFieldInput!]
            }

            input MovieActorNodeAggregationWhereInput {
              AND: [MovieActorNodeAggregationWhereInput!]
              NOT: MovieActorNodeAggregationWhereInput
              OR: [MovieActorNodeAggregationWhereInput!]
              name: StringScalarAggregationFilters
            }

            input MovieActorUpdateConnectionInput {
              node: ActorUpdateInput
              where: ProductionActorConnectionWhere
            }

            input MovieActorUpdateFieldInput {
              connect: [MovieActorConnectFieldInput!]
              create: [MovieActorCreateFieldInput!]
              delete: [MovieActorDeleteFieldInput!]
              disconnect: [MovieActorDisconnectFieldInput!]
              update: MovieActorUpdateConnectionInput
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              actor: MovieActorFieldInput
              director: MovieDirectorFieldInput
              title: String!
            }

            input MovieDeleteInput {
              actor: [MovieActorDeleteFieldInput!]
            }

            input MovieDirectorCreateFieldInput {
              node: PersonCreateInput!
            }

            input MovieDirectorFieldInput {
              create: MovieDirectorCreateFieldInput
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
              actor: [MovieActorUpdateFieldInput!]
              title: StringScalarMutations
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actor: ActorRelationshipFilters
              actorConnection: MovieActorConnectionFilters
              director: PersonWhere
              directorConnection: ProductionDirectorConnectionWhere
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
              deleteDogs(delete: DogDeleteInput, where: DogWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
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
              actedIn: Production
              actedInConnection: ActorActedInConnection!
              directed(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              directedConnection(after: String, first: Int, sort: [ActorDirectedConnectionSort!], where: ActorDirectedConnectionWhere): ActorDirectedConnection!
              name: String!
            }

            input PersonActedInCreateFieldInput {
              node: ProductionCreateInput!
            }

            input PersonActedInFieldInput {
              create: PersonActedInCreateFieldInput
            }

            type PersonAggregate {
              count: Count!
              node: PersonAggregateNode!
            }

            type PersonAggregateNode {
              name: StringAggregateSelection!
            }

            input PersonCreateInput {
              actedIn: PersonActedInFieldInput
              directed: PersonDirectedFieldInput
              name: String!
            }

            input PersonDeleteInput {
              directed: [PersonDirectedDeleteFieldInput!]
            }

            input PersonDirectedConnectFieldInput {
              connect: ProductionConnectInput
              where: ProductionConnectWhere
            }

            input PersonDirectedConnectionAggregateInput {
              AND: [PersonDirectedConnectionAggregateInput!]
              NOT: PersonDirectedConnectionAggregateInput
              OR: [PersonDirectedConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: PersonDirectedNodeAggregationWhereInput
            }

            input PersonDirectedConnectionFilters {
              \\"\\"\\"
              Filter People by aggregating results on related ActorDirectedConnections
              \\"\\"\\"
              aggregate: PersonDirectedConnectionAggregateInput
              \\"\\"\\"
              Return People where all of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              all: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return People where none of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              none: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return People where one of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              single: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return People where some of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              some: ActorDirectedConnectionWhere
            }

            input PersonDirectedCreateFieldInput {
              node: ProductionCreateInput!
            }

            input PersonDirectedDeleteFieldInput {
              delete: ProductionDeleteInput
              where: ActorDirectedConnectionWhere
            }

            input PersonDirectedDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: ActorDirectedConnectionWhere
            }

            input PersonDirectedFieldInput {
              connect: [PersonDirectedConnectFieldInput!]
              create: [PersonDirectedCreateFieldInput!]
            }

            input PersonDirectedNodeAggregationWhereInput {
              AND: [PersonDirectedNodeAggregationWhereInput!]
              NOT: PersonDirectedNodeAggregationWhereInput
              OR: [PersonDirectedNodeAggregationWhereInput!]
              title: StringScalarAggregationFilters
            }

            input PersonDirectedUpdateConnectionInput {
              node: ProductionUpdateInput
              where: ActorDirectedConnectionWhere
            }

            input PersonDirectedUpdateFieldInput {
              connect: [PersonDirectedConnectFieldInput!]
              create: [PersonDirectedCreateFieldInput!]
              delete: [PersonDirectedDeleteFieldInput!]
              disconnect: [PersonDirectedDisconnectFieldInput!]
              update: PersonDirectedUpdateConnectionInput
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
              directed: [PersonDirectedUpdateFieldInput!]
              name: StringScalarMutations
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              actedIn: ProductionWhere
              actedInConnection: ActorActedInConnectionWhere
              directed: ProductionRelationshipFilters
              directedConnection: PersonDirectedConnectionFilters
              name: StringScalarFilters
            }

            interface Production {
              actor(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorConnection(after: String, first: Int, sort: [ProductionActorConnectionSort!], where: ProductionActorConnectionWhere): ProductionActorConnection!
              director: Person
              directorConnection: ProductionDirectorConnection!
              title: String!
            }

            input ProductionActorConnectFieldInput {
              connect: ActorConnectInput
              where: ActorConnectWhere
            }

            type ProductionActorConnection {
              edges: [ProductionActorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionActorConnectionAggregateInput {
              AND: [ProductionActorConnectionAggregateInput!]
              NOT: ProductionActorConnectionAggregateInput
              OR: [ProductionActorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: ProductionActorNodeAggregationWhereInput
            }

            input ProductionActorConnectionFilters {
              \\"\\"\\"
              Filter Productions by aggregating results on related ProductionActorConnections
              \\"\\"\\"
              aggregate: ProductionActorConnectionAggregateInput
              \\"\\"\\"
              Return Productions where all of the related ProductionActorConnections match this filter
              \\"\\"\\"
              all: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Productions where none of the related ProductionActorConnections match this filter
              \\"\\"\\"
              none: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Productions where one of the related ProductionActorConnections match this filter
              \\"\\"\\"
              single: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Productions where some of the related ProductionActorConnections match this filter
              \\"\\"\\"
              some: ProductionActorConnectionWhere
            }

            input ProductionActorConnectionSort {
              node: ActorSort
            }

            input ProductionActorConnectionWhere {
              AND: [ProductionActorConnectionWhere!]
              NOT: ProductionActorConnectionWhere
              OR: [ProductionActorConnectionWhere!]
              node: ActorWhere
            }

            input ProductionActorCreateFieldInput {
              node: ActorCreateInput!
            }

            input ProductionActorDeleteFieldInput {
              delete: ActorDeleteInput
              where: ProductionActorConnectionWhere
            }

            input ProductionActorDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: ProductionActorConnectionWhere
            }

            input ProductionActorNodeAggregationWhereInput {
              AND: [ProductionActorNodeAggregationWhereInput!]
              NOT: ProductionActorNodeAggregationWhereInput
              OR: [ProductionActorNodeAggregationWhereInput!]
              name: StringScalarAggregationFilters
            }

            type ProductionActorRelationship {
              cursor: String!
              node: Actor!
            }

            input ProductionActorUpdateConnectionInput {
              node: ActorUpdateInput
              where: ProductionActorConnectionWhere
            }

            input ProductionActorUpdateFieldInput {
              connect: [ProductionActorConnectFieldInput!]
              create: [ProductionActorCreateFieldInput!]
              delete: [ProductionActorDeleteFieldInput!]
              disconnect: [ProductionActorDisconnectFieldInput!]
              update: ProductionActorUpdateConnectionInput
            }

            type ProductionAggregate {
              count: Count!
              node: ProductionAggregateNode!
            }

            type ProductionAggregateNode {
              title: StringAggregateSelection!
            }

            input ProductionConnectInput {
              actor: [ProductionActorConnectFieldInput!]
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input ProductionDeleteInput {
              actor: [ProductionActorDeleteFieldInput!]
            }

            type ProductionDirectorConnection {
              edges: [ProductionDirectorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionDirectorConnectionWhere {
              AND: [ProductionDirectorConnectionWhere!]
              NOT: ProductionDirectorConnectionWhere
              OR: [ProductionDirectorConnectionWhere!]
              node: PersonWhere
            }

            type ProductionDirectorRelationship {
              cursor: String!
              node: Person!
            }

            input ProductionDisconnectInput {
              actor: [ProductionActorDisconnectFieldInput!]
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
              title: SortDirection
            }

            input ProductionUpdateInput {
              actor: [ProductionActorUpdateFieldInput!]
              title: StringScalarMutations
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              actor: ActorRelationshipFilters
              actorConnection: ProductionActorConnectionFilters
              director: PersonWhere
              directorConnection: ProductionDirectorConnectionWhere
              title: StringScalarFilters
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
              dogs(limit: Int, offset: Int, sort: [DogSort!], where: DogWhere): [Dog!]!
              dogsConnection(after: String, first: Int, sort: [DogSort!], where: DogWhere): DogsConnection!
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
              actor(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorConnection(after: String, first: Int, sort: [ProductionActorConnectionSort!], where: ProductionActorConnectionWhere): ProductionActorConnection!
              director: Person
              directorConnection: ProductionDirectorConnection!
              title: String!
            }

            input SeriesActorConnectFieldInput {
              connect: ActorConnectInput
              where: ActorConnectWhere
            }

            input SeriesActorConnectionAggregateInput {
              AND: [SeriesActorConnectionAggregateInput!]
              NOT: SeriesActorConnectionAggregateInput
              OR: [SeriesActorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: SeriesActorNodeAggregationWhereInput
            }

            input SeriesActorConnectionFilters {
              \\"\\"\\"
              Filter Series by aggregating results on related ProductionActorConnections
              \\"\\"\\"
              aggregate: SeriesActorConnectionAggregateInput
              \\"\\"\\"
              Return Series where all of the related ProductionActorConnections match this filter
              \\"\\"\\"
              all: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Series where none of the related ProductionActorConnections match this filter
              \\"\\"\\"
              none: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Series where one of the related ProductionActorConnections match this filter
              \\"\\"\\"
              single: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Series where some of the related ProductionActorConnections match this filter
              \\"\\"\\"
              some: ProductionActorConnectionWhere
            }

            input SeriesActorCreateFieldInput {
              node: ActorCreateInput!
            }

            input SeriesActorDeleteFieldInput {
              delete: ActorDeleteInput
              where: ProductionActorConnectionWhere
            }

            input SeriesActorDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: ProductionActorConnectionWhere
            }

            input SeriesActorFieldInput {
              connect: [SeriesActorConnectFieldInput!]
              create: [SeriesActorCreateFieldInput!]
            }

            input SeriesActorNodeAggregationWhereInput {
              AND: [SeriesActorNodeAggregationWhereInput!]
              NOT: SeriesActorNodeAggregationWhereInput
              OR: [SeriesActorNodeAggregationWhereInput!]
              name: StringScalarAggregationFilters
            }

            input SeriesActorUpdateConnectionInput {
              node: ActorUpdateInput
              where: ProductionActorConnectionWhere
            }

            input SeriesActorUpdateFieldInput {
              connect: [SeriesActorConnectFieldInput!]
              create: [SeriesActorCreateFieldInput!]
              delete: [SeriesActorDeleteFieldInput!]
              disconnect: [SeriesActorDisconnectFieldInput!]
              update: SeriesActorUpdateConnectionInput
            }

            type SeriesAggregate {
              count: Count!
              node: SeriesAggregateNode!
            }

            type SeriesAggregateNode {
              title: StringAggregateSelection!
            }

            type SeriesConnection {
              aggregate: SeriesAggregate!
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              actor: SeriesActorFieldInput
              director: SeriesDirectorFieldInput
              title: String!
            }

            input SeriesDeleteInput {
              actor: [SeriesActorDeleteFieldInput!]
            }

            input SeriesDirectorCreateFieldInput {
              node: PersonCreateInput!
            }

            input SeriesDirectorFieldInput {
              create: SeriesDirectorCreateFieldInput
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              title: SortDirection
            }

            input SeriesUpdateInput {
              actor: [SeriesActorUpdateFieldInput!]
              title: StringScalarMutations
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actor: ActorRelationshipFilters
              actorConnection: SeriesActorConnectionFilters
              director: PersonWhere
              directorConnection: ProductionDirectorConnectionWhere
              title: StringScalarFilters
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

    test("1-* relationship with edge properties", async () => {
        const typeDefs = gql`
            interface Actor {
                name: String!
                actedIn: Production @declareRelationship
                directed: [Production!]! @declareRelationship
            }
            interface Production {
                title: String!
                actor: [Actor!]! @declareRelationship
                director: Person @declareRelationship
            }

            type Movie implements Production @node {
                title: String!
                actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedInMovie")
                director: Person @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
            }

            type Series implements Production @node {
                title: String!
                actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedInSeries")
                director: Person @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
            }

            type Dog implements Actor @node {
                name: String!
                actedIn: Production @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedInMovie")
                directed: [Production!]! @relationship(type: "DIRECTED", direction: OUT, properties: "Directed")
            }

            type Person implements Actor @node {
                name: String!
                actedIn: Production @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedInSeries")
                directed: [Production!]! @relationship(type: "DIRECTED", direction: OUT, properties: "Directed")
            }

            type ActedInMovie @relationshipProperties {
                scenes: Int!
            }
            type ActedInSeries @relationshipProperties {
                episodes: Int!
            }
            type Directed @relationshipProperties {
                year: Int!
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

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.actor
            * Dog.actedIn
            \\"\\"\\"
            type ActedInMovie {
              scenes: Int!
            }

            input ActedInMovieAggregationWhereInput {
              AND: [ActedInMovieAggregationWhereInput!]
              NOT: ActedInMovieAggregationWhereInput
              OR: [ActedInMovieAggregationWhereInput!]
              scenes: IntScalarAggregationFilters
            }

            input ActedInMovieCreateInput {
              scenes: Int!
            }

            input ActedInMovieSort {
              scenes: SortDirection
            }

            input ActedInMovieUpdateInput {
              scenes: IntScalarMutations
            }

            input ActedInMovieWhere {
              AND: [ActedInMovieWhere!]
              NOT: ActedInMovieWhere
              OR: [ActedInMovieWhere!]
              scenes: IntScalarFilters
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Series.actor
            * Person.actedIn
            \\"\\"\\"
            type ActedInSeries {
              episodes: Int!
            }

            input ActedInSeriesAggregationWhereInput {
              AND: [ActedInSeriesAggregationWhereInput!]
              NOT: ActedInSeriesAggregationWhereInput
              OR: [ActedInSeriesAggregationWhereInput!]
              episodes: IntScalarAggregationFilters
            }

            input ActedInSeriesCreateInput {
              episodes: Int!
            }

            input ActedInSeriesSort {
              episodes: SortDirection
            }

            input ActedInSeriesUpdateInput {
              episodes: IntScalarMutations
            }

            input ActedInSeriesWhere {
              AND: [ActedInSeriesWhere!]
              NOT: ActedInSeriesWhere
              OR: [ActedInSeriesWhere!]
              episodes: IntScalarFilters
            }

            interface Actor {
              actedIn: Production
              actedInConnection: ActorActedInConnection!
              directed(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              directedConnection(after: String, first: Int, sort: [ActorDirectedConnectionSort!], where: ActorDirectedConnectionWhere): ActorDirectedConnection!
              name: String!
            }

            type ActorActedInConnection {
              edges: [ActorActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorActedInConnectionWhere {
              AND: [ActorActedInConnectionWhere!]
              NOT: ActorActedInConnectionWhere
              OR: [ActorActedInConnectionWhere!]
              edge: ActorActedInEdgeWhere
              node: ProductionWhere
            }

            input ActorActedInEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Dog
              \\"\\"\\"
              ActedInMovie: ActedInMovieWhere
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Person
              \\"\\"\\"
              ActedInSeries: ActedInSeriesWhere
            }

            type ActorActedInRelationship {
              cursor: String!
              node: Production!
              properties: ActorActedInRelationshipProperties!
            }

            union ActorActedInRelationshipProperties = ActedInMovie | ActedInSeries

            type ActorAggregate {
              count: Count!
              node: ActorAggregateNode!
            }

            type ActorAggregateNode {
              name: StringAggregateSelection!
            }

            input ActorConnectInput {
              directed: [ActorDirectedConnectFieldInput!]
            }

            input ActorConnectWhere {
              node: ActorWhere!
            }

            input ActorCreateInput {
              Dog: DogCreateInput
              Person: PersonCreateInput
            }

            input ActorDeleteInput {
              directed: [ActorDirectedDeleteFieldInput!]
            }

            input ActorDirectedConnectFieldInput {
              connect: ProductionConnectInput
              edge: ActorDirectedEdgeCreateInput!
              where: ProductionConnectWhere
            }

            type ActorDirectedConnection {
              edges: [ActorDirectedRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ActorDirectedConnectionAggregateInput {
              AND: [ActorDirectedConnectionAggregateInput!]
              NOT: ActorDirectedConnectionAggregateInput
              OR: [ActorDirectedConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActorDirectedEdgeAggregationWhereInput
              node: ActorDirectedNodeAggregationWhereInput
            }

            input ActorDirectedConnectionFilters {
              \\"\\"\\"
              Filter Actors by aggregating results on related ActorDirectedConnections
              \\"\\"\\"
              aggregate: ActorDirectedConnectionAggregateInput
              \\"\\"\\"
              Return Actors where all of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              all: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return Actors where none of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              none: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return Actors where one of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              single: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return Actors where some of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              some: ActorDirectedConnectionWhere
            }

            input ActorDirectedConnectionSort {
              edge: ActorDirectedEdgeSort
              node: ProductionSort
            }

            input ActorDirectedConnectionWhere {
              AND: [ActorDirectedConnectionWhere!]
              NOT: ActorDirectedConnectionWhere
              OR: [ActorDirectedConnectionWhere!]
              edge: ActorDirectedEdgeWhere
              node: ProductionWhere
            }

            input ActorDirectedCreateFieldInput {
              edge: ActorDirectedEdgeCreateInput!
              node: ProductionCreateInput!
            }

            input ActorDirectedDeleteFieldInput {
              delete: ProductionDeleteInput
              where: ActorDirectedConnectionWhere
            }

            input ActorDirectedDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: ActorDirectedConnectionWhere
            }

            input ActorDirectedEdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Dog
              * Person
              \\"\\"\\"
              Directed: DirectedAggregationWhereInput
            }

            input ActorDirectedEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Dog
              * Person
              \\"\\"\\"
              Directed: DirectedCreateInput!
            }

            input ActorDirectedEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Dog
              * Person
              \\"\\"\\"
              Directed: DirectedSort
            }

            input ActorDirectedEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Dog
              * Person
              \\"\\"\\"
              Directed: DirectedUpdateInput
            }

            input ActorDirectedEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Dog
              * Person
              \\"\\"\\"
              Directed: DirectedWhere
            }

            input ActorDirectedNodeAggregationWhereInput {
              AND: [ActorDirectedNodeAggregationWhereInput!]
              NOT: ActorDirectedNodeAggregationWhereInput
              OR: [ActorDirectedNodeAggregationWhereInput!]
              title: StringScalarAggregationFilters
            }

            type ActorDirectedRelationship {
              cursor: String!
              node: Production!
              properties: ActorDirectedRelationshipProperties!
            }

            union ActorDirectedRelationshipProperties = Directed

            input ActorDirectedUpdateConnectionInput {
              edge: ActorDirectedEdgeUpdateInput
              node: ProductionUpdateInput
              where: ActorDirectedConnectionWhere
            }

            input ActorDirectedUpdateFieldInput {
              connect: [ActorDirectedConnectFieldInput!]
              create: [ActorDirectedCreateFieldInput!]
              delete: [ActorDirectedDeleteFieldInput!]
              disconnect: [ActorDirectedDisconnectFieldInput!]
              update: ActorDirectedUpdateConnectionInput
            }

            input ActorDisconnectInput {
              directed: [ActorDirectedDisconnectFieldInput!]
            }

            type ActorEdge {
              cursor: String!
              node: Actor!
            }

            enum ActorImplementation {
              Dog
              Person
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
              directed: [ActorDirectedUpdateFieldInput!]
              name: StringScalarMutations
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              actedIn: ProductionWhere
              actedInConnection: ActorActedInConnectionWhere
              directed: ProductionRelationshipFilters
              directedConnection: ActorDirectedConnectionFilters
              name: StringScalarFilters
              typename: [ActorImplementation!]
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

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.director
            * Series.director
            * Dog.directed
            * Person.directed
            \\"\\"\\"
            type Directed {
              year: Int!
            }

            input DirectedAggregationWhereInput {
              AND: [DirectedAggregationWhereInput!]
              NOT: DirectedAggregationWhereInput
              OR: [DirectedAggregationWhereInput!]
              year: IntScalarAggregationFilters
            }

            input DirectedCreateInput {
              year: Int!
            }

            input DirectedSort {
              year: SortDirection
            }

            input DirectedUpdateInput {
              year: IntScalarMutations
            }

            input DirectedWhere {
              AND: [DirectedWhere!]
              NOT: DirectedWhere
              OR: [DirectedWhere!]
              year: IntScalarFilters
            }

            type Dog implements Actor {
              actedIn: Production
              actedInConnection: ActorActedInConnection!
              directed(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              directedConnection(after: String, first: Int, sort: [ActorDirectedConnectionSort!], where: ActorDirectedConnectionWhere): ActorDirectedConnection!
              name: String!
            }

            input DogActedInCreateFieldInput {
              edge: ActedInMovieCreateInput!
              node: ProductionCreateInput!
            }

            input DogActedInFieldInput {
              create: DogActedInCreateFieldInput
            }

            type DogAggregate {
              count: Count!
              node: DogAggregateNode!
            }

            type DogAggregateNode {
              name: StringAggregateSelection!
            }

            input DogCreateInput {
              actedIn: DogActedInFieldInput
              directed: DogDirectedFieldInput
              name: String!
            }

            input DogDeleteInput {
              directed: [DogDirectedDeleteFieldInput!]
            }

            input DogDirectedConnectFieldInput {
              connect: ProductionConnectInput
              edge: DirectedCreateInput!
              where: ProductionConnectWhere
            }

            input DogDirectedConnectionAggregateInput {
              AND: [DogDirectedConnectionAggregateInput!]
              NOT: DogDirectedConnectionAggregateInput
              OR: [DogDirectedConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: DirectedAggregationWhereInput
              node: DogDirectedNodeAggregationWhereInput
            }

            input DogDirectedConnectionFilters {
              \\"\\"\\"Filter Dogs by aggregating results on related ActorDirectedConnections\\"\\"\\"
              aggregate: DogDirectedConnectionAggregateInput
              \\"\\"\\"
              Return Dogs where all of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              all: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return Dogs where none of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              none: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return Dogs where one of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              single: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return Dogs where some of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              some: ActorDirectedConnectionWhere
            }

            input DogDirectedCreateFieldInput {
              edge: DirectedCreateInput!
              node: ProductionCreateInput!
            }

            input DogDirectedDeleteFieldInput {
              delete: ProductionDeleteInput
              where: ActorDirectedConnectionWhere
            }

            input DogDirectedDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: ActorDirectedConnectionWhere
            }

            input DogDirectedFieldInput {
              connect: [DogDirectedConnectFieldInput!]
              create: [DogDirectedCreateFieldInput!]
            }

            input DogDirectedNodeAggregationWhereInput {
              AND: [DogDirectedNodeAggregationWhereInput!]
              NOT: DogDirectedNodeAggregationWhereInput
              OR: [DogDirectedNodeAggregationWhereInput!]
              title: StringScalarAggregationFilters
            }

            input DogDirectedUpdateConnectionInput {
              edge: DirectedUpdateInput
              node: ProductionUpdateInput
              where: ActorDirectedConnectionWhere
            }

            input DogDirectedUpdateFieldInput {
              connect: [DogDirectedConnectFieldInput!]
              create: [DogDirectedCreateFieldInput!]
              delete: [DogDirectedDeleteFieldInput!]
              disconnect: [DogDirectedDisconnectFieldInput!]
              update: DogDirectedUpdateConnectionInput
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
              directed: [DogDirectedUpdateFieldInput!]
              name: StringScalarMutations
            }

            input DogWhere {
              AND: [DogWhere!]
              NOT: DogWhere
              OR: [DogWhere!]
              actedIn: ProductionWhere
              actedInConnection: ActorActedInConnectionWhere
              directed: ProductionRelationshipFilters
              directedConnection: DogDirectedConnectionFilters
              name: StringScalarFilters
            }

            type DogsConnection {
              aggregate: DogAggregate!
              edges: [DogEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type Movie implements Production {
              actor(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorConnection(after: String, first: Int, sort: [ProductionActorConnectionSort!], where: ProductionActorConnectionWhere): ProductionActorConnection!
              director: Person
              directorConnection: ProductionDirectorConnection!
              title: String!
            }

            input MovieActorConnectFieldInput {
              connect: ActorConnectInput
              edge: ActedInMovieCreateInput!
              where: ActorConnectWhere
            }

            input MovieActorConnectionAggregateInput {
              AND: [MovieActorConnectionAggregateInput!]
              NOT: MovieActorConnectionAggregateInput
              OR: [MovieActorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInMovieAggregationWhereInput
              node: MovieActorNodeAggregationWhereInput
            }

            input MovieActorConnectionFilters {
              \\"\\"\\"
              Filter Movies by aggregating results on related ProductionActorConnections
              \\"\\"\\"
              aggregate: MovieActorConnectionAggregateInput
              \\"\\"\\"
              Return Movies where all of the related ProductionActorConnections match this filter
              \\"\\"\\"
              all: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related ProductionActorConnections match this filter
              \\"\\"\\"
              none: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related ProductionActorConnections match this filter
              \\"\\"\\"
              single: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related ProductionActorConnections match this filter
              \\"\\"\\"
              some: ProductionActorConnectionWhere
            }

            input MovieActorCreateFieldInput {
              edge: ActedInMovieCreateInput!
              node: ActorCreateInput!
            }

            input MovieActorDeleteFieldInput {
              delete: ActorDeleteInput
              where: ProductionActorConnectionWhere
            }

            input MovieActorDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: ProductionActorConnectionWhere
            }

            input MovieActorFieldInput {
              connect: [MovieActorConnectFieldInput!]
              create: [MovieActorCreateFieldInput!]
            }

            input MovieActorNodeAggregationWhereInput {
              AND: [MovieActorNodeAggregationWhereInput!]
              NOT: MovieActorNodeAggregationWhereInput
              OR: [MovieActorNodeAggregationWhereInput!]
              name: StringScalarAggregationFilters
            }

            input MovieActorUpdateConnectionInput {
              edge: ActedInMovieUpdateInput
              node: ActorUpdateInput
              where: ProductionActorConnectionWhere
            }

            input MovieActorUpdateFieldInput {
              connect: [MovieActorConnectFieldInput!]
              create: [MovieActorCreateFieldInput!]
              delete: [MovieActorDeleteFieldInput!]
              disconnect: [MovieActorDisconnectFieldInput!]
              update: MovieActorUpdateConnectionInput
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              title: StringAggregateSelection!
            }

            input MovieCreateInput {
              actor: MovieActorFieldInput
              director: MovieDirectorFieldInput
              title: String!
            }

            input MovieDeleteInput {
              actor: [MovieActorDeleteFieldInput!]
            }

            input MovieDirectorCreateFieldInput {
              edge: DirectedCreateInput!
              node: PersonCreateInput!
            }

            input MovieDirectorFieldInput {
              create: MovieDirectorCreateFieldInput
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
              actor: [MovieActorUpdateFieldInput!]
              title: StringScalarMutations
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actor: ActorRelationshipFilters
              actorConnection: MovieActorConnectionFilters
              director: PersonWhere
              directorConnection: ProductionDirectorConnectionWhere
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
              deleteDogs(delete: DogDeleteInput, where: DogWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              deleteSeries(delete: SeriesDeleteInput, where: SeriesWhere): DeleteInfo!
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
              actedIn: Production
              actedInConnection: ActorActedInConnection!
              directed(limit: Int, offset: Int, sort: [ProductionSort!], where: ProductionWhere): [Production!]!
              directedConnection(after: String, first: Int, sort: [ActorDirectedConnectionSort!], where: ActorDirectedConnectionWhere): ActorDirectedConnection!
              name: String!
            }

            input PersonActedInCreateFieldInput {
              edge: ActedInSeriesCreateInput!
              node: ProductionCreateInput!
            }

            input PersonActedInFieldInput {
              create: PersonActedInCreateFieldInput
            }

            type PersonAggregate {
              count: Count!
              node: PersonAggregateNode!
            }

            type PersonAggregateNode {
              name: StringAggregateSelection!
            }

            input PersonCreateInput {
              actedIn: PersonActedInFieldInput
              directed: PersonDirectedFieldInput
              name: String!
            }

            input PersonDeleteInput {
              directed: [PersonDirectedDeleteFieldInput!]
            }

            input PersonDirectedConnectFieldInput {
              connect: ProductionConnectInput
              edge: DirectedCreateInput!
              where: ProductionConnectWhere
            }

            input PersonDirectedConnectionAggregateInput {
              AND: [PersonDirectedConnectionAggregateInput!]
              NOT: PersonDirectedConnectionAggregateInput
              OR: [PersonDirectedConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: DirectedAggregationWhereInput
              node: PersonDirectedNodeAggregationWhereInput
            }

            input PersonDirectedConnectionFilters {
              \\"\\"\\"
              Filter People by aggregating results on related ActorDirectedConnections
              \\"\\"\\"
              aggregate: PersonDirectedConnectionAggregateInput
              \\"\\"\\"
              Return People where all of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              all: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return People where none of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              none: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return People where one of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              single: ActorDirectedConnectionWhere
              \\"\\"\\"
              Return People where some of the related ActorDirectedConnections match this filter
              \\"\\"\\"
              some: ActorDirectedConnectionWhere
            }

            input PersonDirectedCreateFieldInput {
              edge: DirectedCreateInput!
              node: ProductionCreateInput!
            }

            input PersonDirectedDeleteFieldInput {
              delete: ProductionDeleteInput
              where: ActorDirectedConnectionWhere
            }

            input PersonDirectedDisconnectFieldInput {
              disconnect: ProductionDisconnectInput
              where: ActorDirectedConnectionWhere
            }

            input PersonDirectedFieldInput {
              connect: [PersonDirectedConnectFieldInput!]
              create: [PersonDirectedCreateFieldInput!]
            }

            input PersonDirectedNodeAggregationWhereInput {
              AND: [PersonDirectedNodeAggregationWhereInput!]
              NOT: PersonDirectedNodeAggregationWhereInput
              OR: [PersonDirectedNodeAggregationWhereInput!]
              title: StringScalarAggregationFilters
            }

            input PersonDirectedUpdateConnectionInput {
              edge: DirectedUpdateInput
              node: ProductionUpdateInput
              where: ActorDirectedConnectionWhere
            }

            input PersonDirectedUpdateFieldInput {
              connect: [PersonDirectedConnectFieldInput!]
              create: [PersonDirectedCreateFieldInput!]
              delete: [PersonDirectedDeleteFieldInput!]
              disconnect: [PersonDirectedDisconnectFieldInput!]
              update: PersonDirectedUpdateConnectionInput
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
              directed: [PersonDirectedUpdateFieldInput!]
              name: StringScalarMutations
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              actedIn: ProductionWhere
              actedInConnection: ActorActedInConnectionWhere
              directed: ProductionRelationshipFilters
              directedConnection: PersonDirectedConnectionFilters
              name: StringScalarFilters
            }

            interface Production {
              actor(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorConnection(after: String, first: Int, sort: [ProductionActorConnectionSort!], where: ProductionActorConnectionWhere): ProductionActorConnection!
              director: Person
              directorConnection: ProductionDirectorConnection!
              title: String!
            }

            input ProductionActorConnectFieldInput {
              connect: ActorConnectInput
              edge: ProductionActorEdgeCreateInput!
              where: ActorConnectWhere
            }

            type ProductionActorConnection {
              edges: [ProductionActorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionActorConnectionAggregateInput {
              AND: [ProductionActorConnectionAggregateInput!]
              NOT: ProductionActorConnectionAggregateInput
              OR: [ProductionActorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ProductionActorEdgeAggregationWhereInput
              node: ProductionActorNodeAggregationWhereInput
            }

            input ProductionActorConnectionFilters {
              \\"\\"\\"
              Filter Productions by aggregating results on related ProductionActorConnections
              \\"\\"\\"
              aggregate: ProductionActorConnectionAggregateInput
              \\"\\"\\"
              Return Productions where all of the related ProductionActorConnections match this filter
              \\"\\"\\"
              all: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Productions where none of the related ProductionActorConnections match this filter
              \\"\\"\\"
              none: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Productions where one of the related ProductionActorConnections match this filter
              \\"\\"\\"
              single: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Productions where some of the related ProductionActorConnections match this filter
              \\"\\"\\"
              some: ProductionActorConnectionWhere
            }

            input ProductionActorConnectionSort {
              edge: ProductionActorEdgeSort
              node: ActorSort
            }

            input ProductionActorConnectionWhere {
              AND: [ProductionActorConnectionWhere!]
              NOT: ProductionActorConnectionWhere
              OR: [ProductionActorConnectionWhere!]
              edge: ProductionActorEdgeWhere
              node: ActorWhere
            }

            input ProductionActorCreateFieldInput {
              edge: ProductionActorEdgeCreateInput!
              node: ActorCreateInput!
            }

            input ProductionActorDeleteFieldInput {
              delete: ActorDeleteInput
              where: ProductionActorConnectionWhere
            }

            input ProductionActorDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: ProductionActorConnectionWhere
            }

            input ProductionActorEdgeAggregationWhereInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedInMovie: ActedInMovieAggregationWhereInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              ActedInSeries: ActedInSeriesAggregationWhereInput
            }

            input ProductionActorEdgeCreateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedInMovie: ActedInMovieCreateInput!
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              ActedInSeries: ActedInSeriesCreateInput!
            }

            input ProductionActorEdgeSort {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedInMovie: ActedInMovieSort
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              ActedInSeries: ActedInSeriesSort
            }

            input ProductionActorEdgeUpdateInput {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedInMovie: ActedInMovieUpdateInput
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              ActedInSeries: ActedInSeriesUpdateInput
            }

            input ProductionActorEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              \\"\\"\\"
              ActedInMovie: ActedInMovieWhere
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Series
              \\"\\"\\"
              ActedInSeries: ActedInSeriesWhere
            }

            input ProductionActorNodeAggregationWhereInput {
              AND: [ProductionActorNodeAggregationWhereInput!]
              NOT: ProductionActorNodeAggregationWhereInput
              OR: [ProductionActorNodeAggregationWhereInput!]
              name: StringScalarAggregationFilters
            }

            type ProductionActorRelationship {
              cursor: String!
              node: Actor!
              properties: ProductionActorRelationshipProperties!
            }

            union ProductionActorRelationshipProperties = ActedInMovie | ActedInSeries

            input ProductionActorUpdateConnectionInput {
              edge: ProductionActorEdgeUpdateInput
              node: ActorUpdateInput
              where: ProductionActorConnectionWhere
            }

            input ProductionActorUpdateFieldInput {
              connect: [ProductionActorConnectFieldInput!]
              create: [ProductionActorCreateFieldInput!]
              delete: [ProductionActorDeleteFieldInput!]
              disconnect: [ProductionActorDisconnectFieldInput!]
              update: ProductionActorUpdateConnectionInput
            }

            type ProductionAggregate {
              count: Count!
              node: ProductionAggregateNode!
            }

            type ProductionAggregateNode {
              title: StringAggregateSelection!
            }

            input ProductionConnectInput {
              actor: [ProductionActorConnectFieldInput!]
            }

            input ProductionConnectWhere {
              node: ProductionWhere!
            }

            input ProductionCreateInput {
              Movie: MovieCreateInput
              Series: SeriesCreateInput
            }

            input ProductionDeleteInput {
              actor: [ProductionActorDeleteFieldInput!]
            }

            type ProductionDirectorConnection {
              edges: [ProductionDirectorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input ProductionDirectorConnectionWhere {
              AND: [ProductionDirectorConnectionWhere!]
              NOT: ProductionDirectorConnectionWhere
              OR: [ProductionDirectorConnectionWhere!]
              edge: ProductionDirectorEdgeWhere
              node: PersonWhere
            }

            input ProductionDirectorEdgeWhere {
              \\"\\"\\"
              Relationship properties when source node is of type:
              * Movie
              * Series
              \\"\\"\\"
              Directed: DirectedWhere
            }

            type ProductionDirectorRelationship {
              cursor: String!
              node: Person!
              properties: ProductionDirectorRelationshipProperties!
            }

            union ProductionDirectorRelationshipProperties = Directed

            input ProductionDisconnectInput {
              actor: [ProductionActorDisconnectFieldInput!]
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
              title: SortDirection
            }

            input ProductionUpdateInput {
              actor: [ProductionActorUpdateFieldInput!]
              title: StringScalarMutations
            }

            input ProductionWhere {
              AND: [ProductionWhere!]
              NOT: ProductionWhere
              OR: [ProductionWhere!]
              actor: ActorRelationshipFilters
              actorConnection: ProductionActorConnectionFilters
              director: PersonWhere
              directorConnection: ProductionDirectorConnectionWhere
              title: StringScalarFilters
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
              dogs(limit: Int, offset: Int, sort: [DogSort!], where: DogWhere): [Dog!]!
              dogsConnection(after: String, first: Int, sort: [DogSort!], where: DogWhere): DogsConnection!
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
              actor(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorConnection(after: String, first: Int, sort: [ProductionActorConnectionSort!], where: ProductionActorConnectionWhere): ProductionActorConnection!
              director: Person
              directorConnection: ProductionDirectorConnection!
              title: String!
            }

            input SeriesActorConnectFieldInput {
              connect: ActorConnectInput
              edge: ActedInSeriesCreateInput!
              where: ActorConnectWhere
            }

            input SeriesActorConnectionAggregateInput {
              AND: [SeriesActorConnectionAggregateInput!]
              NOT: SeriesActorConnectionAggregateInput
              OR: [SeriesActorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInSeriesAggregationWhereInput
              node: SeriesActorNodeAggregationWhereInput
            }

            input SeriesActorConnectionFilters {
              \\"\\"\\"
              Filter Series by aggregating results on related ProductionActorConnections
              \\"\\"\\"
              aggregate: SeriesActorConnectionAggregateInput
              \\"\\"\\"
              Return Series where all of the related ProductionActorConnections match this filter
              \\"\\"\\"
              all: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Series where none of the related ProductionActorConnections match this filter
              \\"\\"\\"
              none: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Series where one of the related ProductionActorConnections match this filter
              \\"\\"\\"
              single: ProductionActorConnectionWhere
              \\"\\"\\"
              Return Series where some of the related ProductionActorConnections match this filter
              \\"\\"\\"
              some: ProductionActorConnectionWhere
            }

            input SeriesActorCreateFieldInput {
              edge: ActedInSeriesCreateInput!
              node: ActorCreateInput!
            }

            input SeriesActorDeleteFieldInput {
              delete: ActorDeleteInput
              where: ProductionActorConnectionWhere
            }

            input SeriesActorDisconnectFieldInput {
              disconnect: ActorDisconnectInput
              where: ProductionActorConnectionWhere
            }

            input SeriesActorFieldInput {
              connect: [SeriesActorConnectFieldInput!]
              create: [SeriesActorCreateFieldInput!]
            }

            input SeriesActorNodeAggregationWhereInput {
              AND: [SeriesActorNodeAggregationWhereInput!]
              NOT: SeriesActorNodeAggregationWhereInput
              OR: [SeriesActorNodeAggregationWhereInput!]
              name: StringScalarAggregationFilters
            }

            input SeriesActorUpdateConnectionInput {
              edge: ActedInSeriesUpdateInput
              node: ActorUpdateInput
              where: ProductionActorConnectionWhere
            }

            input SeriesActorUpdateFieldInput {
              connect: [SeriesActorConnectFieldInput!]
              create: [SeriesActorCreateFieldInput!]
              delete: [SeriesActorDeleteFieldInput!]
              disconnect: [SeriesActorDisconnectFieldInput!]
              update: SeriesActorUpdateConnectionInput
            }

            type SeriesAggregate {
              count: Count!
              node: SeriesAggregateNode!
            }

            type SeriesAggregateNode {
              title: StringAggregateSelection!
            }

            type SeriesConnection {
              aggregate: SeriesAggregate!
              edges: [SeriesEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input SeriesCreateInput {
              actor: SeriesActorFieldInput
              director: SeriesDirectorFieldInput
              title: String!
            }

            input SeriesDeleteInput {
              actor: [SeriesActorDeleteFieldInput!]
            }

            input SeriesDirectorCreateFieldInput {
              edge: DirectedCreateInput!
              node: PersonCreateInput!
            }

            input SeriesDirectorFieldInput {
              create: SeriesDirectorCreateFieldInput
            }

            type SeriesEdge {
              cursor: String!
              node: Series!
            }

            \\"\\"\\"
            Fields to sort Series by. The order in which sorts are applied is not guaranteed when specifying many fields in one SeriesSort object.
            \\"\\"\\"
            input SeriesSort {
              title: SortDirection
            }

            input SeriesUpdateInput {
              actor: [SeriesActorUpdateFieldInput!]
              title: StringScalarMutations
            }

            input SeriesWhere {
              AND: [SeriesWhere!]
              NOT: SeriesWhere
              OR: [SeriesWhere!]
              actor: ActorRelationshipFilters
              actorConnection: SeriesActorConnectionFilters
              director: PersonWhere
              directorConnection: ProductionDirectorConnectionWhere
              title: StringScalarFilters
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
