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

describe("single item relationships to an Union type", () => {
    test("1-1 relationship", async () => {
        const typeDefs = gql`
            union Actor = Dog | Person
            union Director = Person | AI

            type Movie @node {
                title: String!
                actor: Actor @relationship(type: "ACTED_IN", direction: IN)
                director: Director! @relationship(type: "DIRECTED", direction: IN)
            }

            type Person @node {
                name: String!
            }

            type Dog @node {
                nickName: String!
            }

            type AI @node {
                model: String!
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

            type AI {
              model: String!
            }

            type AIAggregate {
              count: Count!
              node: AIAggregateNode!
            }

            type AIAggregateNode {
              model: StringAggregateSelection!
            }

            input AICreateInput {
              model: String!
            }

            type AIEdge {
              cursor: String!
              node: AI!
            }

            \\"\\"\\"
            Fields to sort Ais by. The order in which sorts are applied is not guaranteed when specifying many fields in one AISort object.
            \\"\\"\\"
            input AISort {
              model: SortDirection
            }

            input AIUpdateInput {
              model: StringScalarMutations
            }

            input AIWhere {
              AND: [AIWhere!]
              NOT: AIWhere
              OR: [AIWhere!]
              model: StringScalarFilters
            }

            union Actor = Dog | Person

            input ActorWhere {
              Dog: DogWhere
              Person: PersonWhere
            }

            type AisConnection {
              aggregate: AIAggregate!
              edges: [AIEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Count {
              nodes: Int!
            }

            type CreateAisMutationResponse {
              ais: [AI!]!
              info: CreateInfo!
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            union Director = AI | Person

            input DirectorWhere {
              AI: AIWhere
              Person: PersonWhere
            }

            type Dog {
              nickName: String!
            }

            type DogAggregate {
              count: Count!
              node: DogAggregateNode!
            }

            type DogAggregateNode {
              nickName: StringAggregateSelection!
            }

            input DogCreateInput {
              nickName: String!
            }

            type DogEdge {
              cursor: String!
              node: Dog!
            }

            \\"\\"\\"
            Fields to sort Dogs by. The order in which sorts are applied is not guaranteed when specifying many fields in one DogSort object.
            \\"\\"\\"
            input DogSort {
              nickName: SortDirection
            }

            input DogUpdateInput {
              nickName: StringScalarMutations
            }

            input DogWhere {
              AND: [DogWhere!]
              NOT: DogWhere
              OR: [DogWhere!]
              nickName: StringScalarFilters
            }

            type DogsConnection {
              aggregate: DogAggregate!
              edges: [DogEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Movie {
              actor: Actor
              actorConnection: MovieActorConnection!
              director: Director!
              directorConnection: MovieDirectorConnection!
              title: String!
            }

            type MovieActorConnection {
              edges: [MovieActorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type MovieDirectorRelationship {
              cursor: String!
              node: Director!
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
              createAis(input: [AICreateInput!]!): CreateAisMutationResponse!
              createDogs(input: [DogCreateInput!]!): CreateDogsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              deleteAis(where: AIWhere): DeleteInfo!
              deleteDogs(where: DogWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              deletePeople(where: PersonWhere): DeleteInfo!
              updateAis(update: AIUpdateInput, where: AIWhere): UpdateAisMutationResponse!
              updateDogs(update: DogUpdateInput, where: DogWhere): UpdateDogsMutationResponse!
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
              actors(limit: Int, offset: Int, where: ActorWhere): [Actor!]!
              ais(limit: Int, offset: Int, sort: [AISort!], where: AIWhere): [AI!]!
              aisConnection(after: String, first: Int, sort: [AISort!], where: AIWhere): AisConnection!
              directors(limit: Int, offset: Int, where: DirectorWhere): [Director!]!
              dogs(limit: Int, offset: Int, sort: [DogSort!], where: DogWhere): [Dog!]!
              dogsConnection(after: String, first: Int, sort: [DogSort!], where: DogWhere): DogsConnection!
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

            type UpdateAisMutationResponse {
              ais: [AI!]!
              info: UpdateInfo!
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
            }"
        `);
    });
    test("1-* relationship", async () => {
        const typeDefs = gql`
            union Actor = Dog | Person
            union Director = Person | AI

            type Movie @node {
                title: String!
                actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                director: Director! @relationship(type: "DIRECTED", direction: IN)
            }

            type Person @node {
                name: String!
                actedIn: Movie! @relationship(type: "ACTED_IN", direction: OUT)
                directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type Dog @node {
                nickName: String!
                actedIn: Movie! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type AI @node {
                model: String!
                directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT)
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

            type AI {
              directed(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              directedConnection(after: String, first: Int, sort: [AIDirectedConnectionSort!], where: AIDirectedConnectionWhere): AIDirectedConnection!
              model: String!
            }

            type AIAggregate {
              count: Count!
              node: AIAggregateNode!
            }

            type AIAggregateNode {
              model: StringAggregateSelection!
            }

            input AICreateInput {
              directed: AIDirectedFieldInput
              model: String!
            }

            input AIDeleteInput {
              directed: [AIDirectedDeleteFieldInput!]
            }

            input AIDirectedConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            type AIDirectedConnection {
              aggregate: AIMovieDirectedAggregateSelection!
              edges: [AIDirectedRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input AIDirectedConnectionAggregateInput {
              AND: [AIDirectedConnectionAggregateInput!]
              NOT: AIDirectedConnectionAggregateInput
              OR: [AIDirectedConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: AIDirectedNodeAggregationWhereInput
            }

            input AIDirectedConnectionFilters {
              \\"\\"\\"Filter AIS by aggregating results on related AIDirectedConnections\\"\\"\\"
              aggregate: AIDirectedConnectionAggregateInput
              \\"\\"\\"
              Return AIS where all of the related AIDirectedConnections match this filter
              \\"\\"\\"
              all: AIDirectedConnectionWhere
              \\"\\"\\"
              Return AIS where none of the related AIDirectedConnections match this filter
              \\"\\"\\"
              none: AIDirectedConnectionWhere
              \\"\\"\\"
              Return AIS where one of the related AIDirectedConnections match this filter
              \\"\\"\\"
              single: AIDirectedConnectionWhere
              \\"\\"\\"
              Return AIS where some of the related AIDirectedConnections match this filter
              \\"\\"\\"
              some: AIDirectedConnectionWhere
            }

            input AIDirectedConnectionSort {
              node: MovieSort
            }

            input AIDirectedConnectionWhere {
              AND: [AIDirectedConnectionWhere!]
              NOT: AIDirectedConnectionWhere
              OR: [AIDirectedConnectionWhere!]
              node: MovieWhere
            }

            input AIDirectedCreateFieldInput {
              node: MovieCreateInput!
            }

            input AIDirectedDeleteFieldInput {
              delete: MovieDeleteInput
              where: AIDirectedConnectionWhere
            }

            input AIDirectedDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: AIDirectedConnectionWhere
            }

            input AIDirectedFieldInput {
              connect: [AIDirectedConnectFieldInput!]
              create: [AIDirectedCreateFieldInput!]
            }

            input AIDirectedNodeAggregationWhereInput {
              AND: [AIDirectedNodeAggregationWhereInput!]
              NOT: AIDirectedNodeAggregationWhereInput
              OR: [AIDirectedNodeAggregationWhereInput!]
              title: StringScalarAggregationFilters
            }

            type AIDirectedRelationship {
              cursor: String!
              node: Movie!
            }

            input AIDirectedUpdateConnectionInput {
              node: MovieUpdateInput
              where: AIDirectedConnectionWhere
            }

            input AIDirectedUpdateFieldInput {
              connect: [AIDirectedConnectFieldInput!]
              create: [AIDirectedCreateFieldInput!]
              delete: [AIDirectedDeleteFieldInput!]
              disconnect: [AIDirectedDisconnectFieldInput!]
              update: AIDirectedUpdateConnectionInput
            }

            type AIEdge {
              cursor: String!
              node: AI!
            }

            type AIMovieDirectedAggregateSelection {
              count: CountConnection!
              node: AIMovieDirectedNodeAggregateSelection
            }

            type AIMovieDirectedNodeAggregateSelection {
              title: StringAggregateSelection!
            }

            \\"\\"\\"
            Fields to sort Ais by. The order in which sorts are applied is not guaranteed when specifying many fields in one AISort object.
            \\"\\"\\"
            input AISort {
              model: SortDirection
            }

            input AIUpdateInput {
              directed: [AIDirectedUpdateFieldInput!]
              model: StringScalarMutations
            }

            input AIWhere {
              AND: [AIWhere!]
              NOT: AIWhere
              OR: [AIWhere!]
              directed: MovieRelationshipFilters
              directedConnection: AIDirectedConnectionFilters
              model: StringScalarFilters
            }

            union Actor = Dog | Person

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

            input ActorWhere {
              Dog: DogWhere
              Person: PersonWhere
            }

            type AisConnection {
              aggregate: AIAggregate!
              edges: [AIEdge!]!
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

            type CreateAisMutationResponse {
              ais: [AI!]!
              info: CreateInfo!
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

            \\"\\"\\"
            Information about the number of nodes and relationships deleted during a delete mutation
            \\"\\"\\"
            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            union Director = AI | Person

            input DirectorWhere {
              AI: AIWhere
              Person: PersonWhere
            }

            type Dog {
              actedIn: Movie!
              actedInConnection: DogActedInConnection!
              nickName: String!
            }

            type DogActedInConnection {
              edges: [DogActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type DogActedInRelationship {
              cursor: String!
              node: Movie!
            }

            type DogAggregate {
              count: Count!
              node: DogAggregateNode!
            }

            type DogAggregateNode {
              nickName: StringAggregateSelection!
            }

            input DogConnectWhere {
              node: DogWhere!
            }

            input DogCreateInput {
              nickName: String!
            }

            type DogEdge {
              cursor: String!
              node: Dog!
            }

            \\"\\"\\"
            Fields to sort Dogs by. The order in which sorts are applied is not guaranteed when specifying many fields in one DogSort object.
            \\"\\"\\"
            input DogSort {
              nickName: SortDirection
            }

            input DogUpdateInput {
              nickName: StringScalarMutations
            }

            input DogWhere {
              AND: [DogWhere!]
              NOT: DogWhere
              OR: [DogWhere!]
              nickName: StringScalarFilters
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

            type Movie {
              actor(limit: Int, offset: Int, where: ActorWhere): [Actor!]!
              actorConnection(after: String, first: Int, where: MovieActorConnectionWhere): MovieActorConnection!
              director: Director!
              directorConnection: MovieDirectorConnection!
              title: String!
            }

            input MovieActorConnectInput {
              Dog: [MovieActorDogConnectFieldInput!]
              Person: [MovieActorPersonConnectFieldInput!]
            }

            type MovieActorConnection {
              edges: [MovieActorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorConnectionFilters {
              \\"\\"\\"
              Return Movies where all of the related MovieActorConnections match this filter
              \\"\\"\\"
              all: MovieActorConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieActorConnections match this filter
              \\"\\"\\"
              none: MovieActorConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieActorConnections match this filter
              \\"\\"\\"
              single: MovieActorConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieActorConnections match this filter
              \\"\\"\\"
              some: MovieActorConnectionWhere
            }

            input MovieActorConnectionWhere {
              Dog: MovieActorDogConnectionWhere
              Person: MovieActorPersonConnectionWhere
            }

            input MovieActorCreateInput {
              Dog: MovieActorDogFieldInput
              Person: MovieActorPersonFieldInput
            }

            input MovieActorDeleteInput {
              Dog: [MovieActorDogDeleteFieldInput!]
              Person: [MovieActorPersonDeleteFieldInput!]
            }

            input MovieActorDisconnectInput {
              Dog: [MovieActorDogDisconnectFieldInput!]
              Person: [MovieActorPersonDisconnectFieldInput!]
            }

            input MovieActorDogConnectFieldInput {
              where: DogConnectWhere
            }

            input MovieActorDogConnectionWhere {
              AND: [MovieActorDogConnectionWhere!]
              NOT: MovieActorDogConnectionWhere
              OR: [MovieActorDogConnectionWhere!]
              node: DogWhere
            }

            input MovieActorDogCreateFieldInput {
              node: DogCreateInput!
            }

            input MovieActorDogDeleteFieldInput {
              where: MovieActorDogConnectionWhere
            }

            input MovieActorDogDisconnectFieldInput {
              where: MovieActorDogConnectionWhere
            }

            input MovieActorDogFieldInput {
              connect: [MovieActorDogConnectFieldInput!]
              create: [MovieActorDogCreateFieldInput!]
            }

            input MovieActorDogUpdateConnectionInput {
              node: DogUpdateInput
              where: MovieActorDogConnectionWhere
            }

            input MovieActorDogUpdateFieldInput {
              connect: [MovieActorDogConnectFieldInput!]
              create: [MovieActorDogCreateFieldInput!]
              delete: [MovieActorDogDeleteFieldInput!]
              disconnect: [MovieActorDogDisconnectFieldInput!]
              update: MovieActorDogUpdateConnectionInput
            }

            input MovieActorPersonConnectFieldInput {
              connect: [PersonConnectInput!]
              where: PersonConnectWhere
            }

            input MovieActorPersonConnectionWhere {
              AND: [MovieActorPersonConnectionWhere!]
              NOT: MovieActorPersonConnectionWhere
              OR: [MovieActorPersonConnectionWhere!]
              node: PersonWhere
            }

            input MovieActorPersonCreateFieldInput {
              node: PersonCreateInput!
            }

            input MovieActorPersonDeleteFieldInput {
              delete: PersonDeleteInput
              where: MovieActorPersonConnectionWhere
            }

            input MovieActorPersonDisconnectFieldInput {
              disconnect: PersonDisconnectInput
              where: MovieActorPersonConnectionWhere
            }

            input MovieActorPersonFieldInput {
              connect: [MovieActorPersonConnectFieldInput!]
              create: [MovieActorPersonCreateFieldInput!]
            }

            input MovieActorPersonUpdateConnectionInput {
              node: PersonUpdateInput
              where: MovieActorPersonConnectionWhere
            }

            input MovieActorPersonUpdateFieldInput {
              connect: [MovieActorPersonConnectFieldInput!]
              create: [MovieActorPersonCreateFieldInput!]
              delete: [MovieActorPersonDeleteFieldInput!]
              disconnect: [MovieActorPersonDisconnectFieldInput!]
              update: MovieActorPersonUpdateConnectionInput
            }

            type MovieActorRelationship {
              cursor: String!
              node: Actor!
            }

            input MovieActorUpdateInput {
              Dog: [MovieActorDogUpdateFieldInput!]
              Person: [MovieActorPersonUpdateFieldInput!]
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              title: StringAggregateSelection!
            }

            input MovieConnectInput {
              actor: MovieActorConnectInput
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actor: MovieActorCreateInput
              title: String!
            }

            input MovieDeleteInput {
              actor: MovieActorDeleteInput
            }

            type MovieDirectorConnection {
              edges: [MovieDirectorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type MovieDirectorRelationship {
              cursor: String!
              node: Director!
            }

            input MovieDisconnectInput {
              actor: MovieActorDisconnectInput
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
              actor: MovieActorUpdateInput
              title: StringScalarMutations
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actor: ActorRelationshipFilters
              actorConnection: MovieActorConnectionFilters
              title: StringScalarFilters
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createAis(input: [AICreateInput!]!): CreateAisMutationResponse!
              createDogs(input: [DogCreateInput!]!): CreateDogsMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              deleteAis(delete: AIDeleteInput, where: AIWhere): DeleteInfo!
              deleteDogs(where: DogWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
              updateAis(update: AIUpdateInput, where: AIWhere): UpdateAisMutationResponse!
              updateDogs(update: DogUpdateInput, where: DogWhere): UpdateDogsMutationResponse!
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
              actedIn: Movie!
              actedInConnection: PersonActedInConnection!
              directed(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              directedConnection(after: String, first: Int, sort: [PersonDirectedConnectionSort!], where: PersonDirectedConnectionWhere): PersonDirectedConnection!
              name: String!
            }

            type PersonActedInConnection {
              edges: [PersonActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type PersonActedInRelationship {
              cursor: String!
              node: Movie!
            }

            type PersonAggregate {
              count: Count!
              node: PersonAggregateNode!
            }

            type PersonAggregateNode {
              name: StringAggregateSelection!
            }

            input PersonConnectInput {
              directed: [PersonDirectedConnectFieldInput!]
            }

            input PersonConnectWhere {
              node: PersonWhere!
            }

            input PersonCreateInput {
              directed: PersonDirectedFieldInput
              name: String!
            }

            input PersonDeleteInput {
              directed: [PersonDirectedDeleteFieldInput!]
            }

            input PersonDirectedConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            type PersonDirectedConnection {
              aggregate: PersonMovieDirectedAggregateSelection!
              edges: [PersonDirectedRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              Filter People by aggregating results on related PersonDirectedConnections
              \\"\\"\\"
              aggregate: PersonDirectedConnectionAggregateInput
              \\"\\"\\"
              Return People where all of the related PersonDirectedConnections match this filter
              \\"\\"\\"
              all: PersonDirectedConnectionWhere
              \\"\\"\\"
              Return People where none of the related PersonDirectedConnections match this filter
              \\"\\"\\"
              none: PersonDirectedConnectionWhere
              \\"\\"\\"
              Return People where one of the related PersonDirectedConnections match this filter
              \\"\\"\\"
              single: PersonDirectedConnectionWhere
              \\"\\"\\"
              Return People where some of the related PersonDirectedConnections match this filter
              \\"\\"\\"
              some: PersonDirectedConnectionWhere
            }

            input PersonDirectedConnectionSort {
              node: MovieSort
            }

            input PersonDirectedConnectionWhere {
              AND: [PersonDirectedConnectionWhere!]
              NOT: PersonDirectedConnectionWhere
              OR: [PersonDirectedConnectionWhere!]
              node: MovieWhere
            }

            input PersonDirectedCreateFieldInput {
              node: MovieCreateInput!
            }

            input PersonDirectedDeleteFieldInput {
              delete: MovieDeleteInput
              where: PersonDirectedConnectionWhere
            }

            input PersonDirectedDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: PersonDirectedConnectionWhere
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

            type PersonDirectedRelationship {
              cursor: String!
              node: Movie!
            }

            input PersonDirectedUpdateConnectionInput {
              node: MovieUpdateInput
              where: PersonDirectedConnectionWhere
            }

            input PersonDirectedUpdateFieldInput {
              connect: [PersonDirectedConnectFieldInput!]
              create: [PersonDirectedCreateFieldInput!]
              delete: [PersonDirectedDeleteFieldInput!]
              disconnect: [PersonDirectedDisconnectFieldInput!]
              update: PersonDirectedUpdateConnectionInput
            }

            input PersonDisconnectInput {
              directed: [PersonDirectedDisconnectFieldInput!]
            }

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            type PersonMovieDirectedAggregateSelection {
              count: CountConnection!
              node: PersonMovieDirectedNodeAggregateSelection
            }

            type PersonMovieDirectedNodeAggregateSelection {
              title: StringAggregateSelection!
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
              directed: MovieRelationshipFilters
              directedConnection: PersonDirectedConnectionFilters
              name: StringScalarFilters
            }

            type Query {
              actors(limit: Int, offset: Int, where: ActorWhere): [Actor!]!
              ais(limit: Int, offset: Int, sort: [AISort!], where: AIWhere): [AI!]!
              aisConnection(after: String, first: Int, sort: [AISort!], where: AIWhere): AisConnection!
              directors(limit: Int, offset: Int, where: DirectorWhere): [Director!]!
              dogs(limit: Int, offset: Int, sort: [DogSort!], where: DogWhere): [Dog!]!
              dogsConnection(after: String, first: Int, sort: [DogSort!], where: DogWhere): DogsConnection!
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

            type UpdateAisMutationResponse {
              ais: [AI!]!
              info: UpdateInfo!
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
            }"
        `);
    });
});
