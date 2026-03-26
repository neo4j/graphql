/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { printSchemaWithDirectives } from "@graphql-tools/utils";
import { gql } from "graphql-tag";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../../src";

describe("single item relationships to an Interface type", () => {
    test("1-1 relationship", async () => {
        const typeDefs = gql`
            interface Actor {
                name: String!
            }
            interface Director {
                years: Int!
            }

            type Movie @node {
                title: String!
                actor: Actor @relationship(type: "ACTED_IN", direction: IN)
                director: Director @relationship(type: "DIRECTED", direction: IN)
            }

            type Dog implements Actor @node {
                name: String!
            }

            type Person implements Actor & Director @node {
                name: String!
                years: Int!
            }

            type AI implements Director @node {
                model: String!
                years: Int!
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

            type AI implements Director {
              model: String!
              years: Int!
            }

            type AIAggregate {
              count: Count!
              node: AIAggregateNode!
            }

            type AIAggregateNode {
              model: StringAggregateSelection!
              years: IntAggregateSelection!
            }

            input AICreateInput {
              model: String!
              years: Int!
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
              years: SortDirection
            }

            input AIUpdateInput {
              model: StringScalarMutations
              years: IntScalarMutations
            }

            input AIWhere {
              AND: [AIWhere!]
              NOT: AIWhere
              OR: [AIWhere!]
              model: StringScalarFilters
              years: IntScalarFilters
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

            interface Director {
              years: Int!
            }

            type DirectorAggregate {
              count: Count!
              node: DirectorAggregateNode!
            }

            type DirectorAggregateNode {
              years: IntAggregateSelection!
            }

            input DirectorCreateInput {
              AI: AICreateInput
              Person: PersonCreateInput
            }

            type DirectorEdge {
              cursor: String!
              node: Director!
            }

            enum DirectorImplementation {
              AI
              Person
            }

            \\"\\"\\"
            Fields to sort Directors by. The order in which sorts are applied is not guaranteed when specifying many fields in one DirectorSort object.
            \\"\\"\\"
            input DirectorSort {
              years: SortDirection
            }

            input DirectorWhere {
              AND: [DirectorWhere!]
              NOT: DirectorWhere
              OR: [DirectorWhere!]
              typename: [DirectorImplementation!]
              years: IntScalarFilters
            }

            type DirectorsConnection {
              aggregate: DirectorAggregate!
              edges: [DirectorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
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

            type Movie {
              actor: Actor
              actorConnection: MovieActorConnection!
              director: Director
              directorConnection: MovieDirectorConnection!
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

            input MovieActorCreateFieldInput {
              node: ActorCreateInput!
            }

            input MovieActorDeleteFieldInput {
              where: MovieActorConnectionWhere
            }

            input MovieActorFieldInput {
              create: MovieActorCreateFieldInput
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
              actor: MovieActorFieldInput
              director: MovieDirectorFieldInput
              title: String!
            }

            input MovieDeleteInput {
              actor: MovieActorDeleteFieldInput
              director: MovieDirectorDeleteFieldInput
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
              node: DirectorWhere
            }

            input MovieDirectorCreateFieldInput {
              node: DirectorCreateInput!
            }

            input MovieDirectorDeleteFieldInput {
              where: MovieDirectorConnectionWhere
            }

            input MovieDirectorFieldInput {
              create: MovieDirectorCreateFieldInput
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
              actor: ActorWhere
              actorConnection: MovieActorConnectionWhere
              director: DirectorWhere
              directorConnection: MovieDirectorConnectionWhere
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
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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

            type Person implements Actor & Director {
              name: String!
              years: Int!
            }

            type PersonAggregate {
              count: Count!
              node: PersonAggregateNode!
            }

            type PersonAggregateNode {
              name: StringAggregateSelection!
              years: IntAggregateSelection!
            }

            input PersonCreateInput {
              name: String!
              years: Int!
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
              years: SortDirection
            }

            input PersonUpdateInput {
              name: StringScalarMutations
              years: IntScalarMutations
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              name: StringScalarFilters
              years: IntScalarFilters
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              ais(limit: Int, offset: Int, sort: [AISort!], where: AIWhere): [AI!]!
              aisConnection(after: String, first: Int, sort: [AISort!], where: AIWhere): AisConnection!
              directors(limit: Int, offset: Int, sort: [DirectorSort!], where: DirectorWhere): [Director!]!
              directorsConnection(after: String, first: Int, sort: [DirectorSort!], where: DirectorWhere): DirectorsConnection!
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
            interface Actor {
                name: String!
            }
            interface Director {
                years: Int!
            }

            type Movie @node {
                title: String!
                actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                director: Director @relationship(type: "DIRECTED", direction: IN)
            }

            type Dog implements Actor @node {
                name: String!
                actedIn: Movie @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Person implements Actor & Director @node {
                name: String!
                years: Int!
                actedIn: Movie @relationship(type: "ACTED_IN", direction: OUT)
            }

            type AI implements Director @node {
                model: String!
                years: Int!
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

            type AI implements Director {
              directed(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              directedConnection(after: String, first: Int, sort: [AIDirectedConnectionSort!], where: AIDirectedConnectionWhere): AIDirectedConnection!
              model: String!
              years: Int!
            }

            type AIAggregate {
              count: Count!
              node: AIAggregateNode!
            }

            type AIAggregateNode {
              model: StringAggregateSelection!
              years: IntAggregateSelection!
            }

            input AICreateInput {
              directed: AIDirectedFieldInput
              model: String!
              years: Int!
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
              years: SortDirection
            }

            input AIUpdateInput {
              directed: [AIDirectedUpdateFieldInput!]
              model: StringScalarMutations
              years: IntScalarMutations
            }

            input AIWhere {
              AND: [AIWhere!]
              NOT: AIWhere
              OR: [AIWhere!]
              directed: MovieRelationshipFilters
              directedConnection: AIDirectedConnectionFilters
              model: StringScalarFilters
              years: IntScalarFilters
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

            input ActorConnectWhere {
              node: ActorWhere!
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

            interface Director {
              years: Int!
            }

            type DirectorAggregate {
              count: Count!
              node: DirectorAggregateNode!
            }

            type DirectorAggregateNode {
              years: IntAggregateSelection!
            }

            input DirectorCreateInput {
              AI: AICreateInput
              Person: PersonCreateInput
            }

            type DirectorEdge {
              cursor: String!
              node: Director!
            }

            enum DirectorImplementation {
              AI
              Person
            }

            \\"\\"\\"
            Fields to sort Directors by. The order in which sorts are applied is not guaranteed when specifying many fields in one DirectorSort object.
            \\"\\"\\"
            input DirectorSort {
              years: SortDirection
            }

            input DirectorWhere {
              AND: [DirectorWhere!]
              NOT: DirectorWhere
              OR: [DirectorWhere!]
              typename: [DirectorImplementation!]
              years: IntScalarFilters
            }

            type DirectorsConnection {
              aggregate: DirectorAggregate!
              edges: [DirectorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Dog implements Actor {
              actedIn: Movie
              actedInConnection: DogActedInConnection!
              name: String!
            }

            type DogActedInConnection {
              edges: [DogActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input DogActedInConnectionWhere {
              AND: [DogActedInConnectionWhere!]
              NOT: DogActedInConnectionWhere
              OR: [DogActedInConnectionWhere!]
              node: MovieWhere
            }

            input DogActedInCreateFieldInput {
              node: MovieCreateInput!
            }

            input DogActedInDeleteFieldInput {
              delete: MovieDeleteInput
              where: DogActedInConnectionWhere
            }

            input DogActedInFieldInput {
              create: DogActedInCreateFieldInput
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
              name: StringAggregateSelection!
            }

            input DogCreateInput {
              actedIn: DogActedInFieldInput
              name: String!
            }

            input DogDeleteInput {
              actedIn: DogActedInDeleteFieldInput
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
              actedIn: MovieWhere
              actedInConnection: DogActedInConnectionWhere
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

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
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

            type Movie {
              actor(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorConnection(after: String, first: Int, sort: [MovieActorConnectionSort!], where: MovieActorConnectionWhere): MovieActorConnection!
              director: Director
              directorConnection: MovieDirectorConnection!
              title: String!
            }

            type MovieActorActorAggregateSelection {
              count: CountConnection!
              node: MovieActorActorNodeAggregateSelection
            }

            type MovieActorActorNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieActorConnectFieldInput {
              where: ActorConnectWhere
            }

            type MovieActorConnection {
              aggregate: MovieActorActorAggregateSelection!
              edges: [MovieActorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorConnectionAggregateInput {
              AND: [MovieActorConnectionAggregateInput!]
              NOT: MovieActorConnectionAggregateInput
              OR: [MovieActorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: MovieActorNodeAggregationWhereInput
            }

            input MovieActorConnectionFilters {
              \\"\\"\\"Filter Movies by aggregating results on related MovieActorConnections\\"\\"\\"
              aggregate: MovieActorConnectionAggregateInput
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

            input MovieActorConnectionSort {
              node: ActorSort
            }

            input MovieActorConnectionWhere {
              AND: [MovieActorConnectionWhere!]
              NOT: MovieActorConnectionWhere
              OR: [MovieActorConnectionWhere!]
              node: ActorWhere
            }

            input MovieActorCreateFieldInput {
              node: ActorCreateInput!
            }

            input MovieActorDeleteFieldInput {
              where: MovieActorConnectionWhere
            }

            input MovieActorDisconnectFieldInput {
              where: MovieActorConnectionWhere
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

            type MovieActorRelationship {
              cursor: String!
              node: Actor!
            }

            input MovieActorUpdateConnectionInput {
              node: ActorUpdateInput
              where: MovieActorConnectionWhere
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

            input MovieConnectInput {
              actor: [MovieActorConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actor: MovieActorFieldInput
              director: MovieDirectorFieldInput
              title: String!
            }

            input MovieDeleteInput {
              actor: [MovieActorDeleteFieldInput!]
              director: MovieDirectorDeleteFieldInput
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
              node: DirectorWhere
            }

            input MovieDirectorCreateFieldInput {
              node: DirectorCreateInput!
            }

            input MovieDirectorDeleteFieldInput {
              where: MovieDirectorConnectionWhere
            }

            input MovieDirectorFieldInput {
              create: MovieDirectorCreateFieldInput
            }

            type MovieDirectorRelationship {
              cursor: String!
              node: Director!
            }

            input MovieDisconnectInput {
              actor: [MovieActorDisconnectFieldInput!]
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
              actor: [MovieActorUpdateFieldInput!]
              title: StringScalarMutations
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actor: ActorRelationshipFilters
              actorConnection: MovieActorConnectionFilters
              director: DirectorWhere
              directorConnection: MovieDirectorConnectionWhere
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
              deleteDogs(delete: DogDeleteInput, where: DogWhere): DeleteInfo!
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

            type Person implements Actor & Director {
              actedIn: Movie
              actedInConnection: PersonActedInConnection!
              name: String!
              years: Int!
            }

            type PersonActedInConnection {
              edges: [PersonActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonActedInConnectionWhere {
              AND: [PersonActedInConnectionWhere!]
              NOT: PersonActedInConnectionWhere
              OR: [PersonActedInConnectionWhere!]
              node: MovieWhere
            }

            input PersonActedInCreateFieldInput {
              node: MovieCreateInput!
            }

            input PersonActedInDeleteFieldInput {
              delete: MovieDeleteInput
              where: PersonActedInConnectionWhere
            }

            input PersonActedInFieldInput {
              create: PersonActedInCreateFieldInput
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
              years: IntAggregateSelection!
            }

            input PersonCreateInput {
              actedIn: PersonActedInFieldInput
              name: String!
              years: Int!
            }

            input PersonDeleteInput {
              actedIn: PersonActedInDeleteFieldInput
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
              years: SortDirection
            }

            input PersonUpdateInput {
              name: StringScalarMutations
              years: IntScalarMutations
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              actedIn: MovieWhere
              actedInConnection: PersonActedInConnectionWhere
              name: StringScalarFilters
              years: IntScalarFilters
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              ais(limit: Int, offset: Int, sort: [AISort!], where: AIWhere): [AI!]!
              aisConnection(after: String, first: Int, sort: [AISort!], where: AIWhere): AisConnection!
              directors(limit: Int, offset: Int, sort: [DirectorSort!], where: DirectorWhere): [Director!]!
              directorsConnection(after: String, first: Int, sort: [DirectorSort!], where: DirectorWhere): DirectorsConnection!
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

    test("1-* relationship with edge properties", async () => {
        const typeDefs = gql`
            interface Actor {
                name: String!
            }
            interface Director {
                years: Int!
            }

            type Movie @node {
                title: String!
                actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                director: Director @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
            }

            type Dog implements Actor @node {
                name: String!
                actedIn: Movie @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Person implements Actor & Director @node {
                name: String!
                years: Int!
                actedIn: Movie @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type AI implements Director @node {
                model: String!
                years: Int!
                directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT, properties: "Directed")
            }

            type ActedIn @relationshipProperties {
                scenes: Int!
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

            type AI implements Director {
              directed(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              directedConnection(after: String, first: Int, sort: [AIDirectedConnectionSort!], where: AIDirectedConnectionWhere): AIDirectedConnection!
              model: String!
              years: Int!
            }

            type AIAggregate {
              count: Count!
              node: AIAggregateNode!
            }

            type AIAggregateNode {
              model: StringAggregateSelection!
              years: IntAggregateSelection!
            }

            input AICreateInput {
              directed: AIDirectedFieldInput
              model: String!
              years: Int!
            }

            input AIDeleteInput {
              directed: [AIDirectedDeleteFieldInput!]
            }

            input AIDirectedConnectFieldInput {
              connect: [MovieConnectInput!]
              edge: DirectedCreateInput!
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
              edge: DirectedAggregationWhereInput
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
              edge: DirectedSort
              node: MovieSort
            }

            input AIDirectedConnectionWhere {
              AND: [AIDirectedConnectionWhere!]
              NOT: AIDirectedConnectionWhere
              OR: [AIDirectedConnectionWhere!]
              edge: DirectedWhere
              node: MovieWhere
            }

            input AIDirectedCreateFieldInput {
              edge: DirectedCreateInput!
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
              properties: Directed!
            }

            input AIDirectedUpdateConnectionInput {
              edge: DirectedUpdateInput
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
              edge: AIMovieDirectedEdgeAggregateSelection
              node: AIMovieDirectedNodeAggregateSelection
            }

            type AIMovieDirectedEdgeAggregateSelection {
              year: IntAggregateSelection!
            }

            type AIMovieDirectedNodeAggregateSelection {
              title: StringAggregateSelection!
            }

            \\"\\"\\"
            Fields to sort Ais by. The order in which sorts are applied is not guaranteed when specifying many fields in one AISort object.
            \\"\\"\\"
            input AISort {
              model: SortDirection
              years: SortDirection
            }

            input AIUpdateInput {
              directed: [AIDirectedUpdateFieldInput!]
              model: StringScalarMutations
              years: IntScalarMutations
            }

            input AIWhere {
              AND: [AIWhere!]
              NOT: AIWhere
              OR: [AIWhere!]
              directed: MovieRelationshipFilters
              directedConnection: AIDirectedConnectionFilters
              model: StringScalarFilters
              years: IntScalarFilters
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.actor
            * Dog.actedIn
            * Person.actedIn
            \\"\\"\\"
            type ActedIn {
              scenes: Int!
            }

            input ActedInAggregationWhereInput {
              AND: [ActedInAggregationWhereInput!]
              NOT: ActedInAggregationWhereInput
              OR: [ActedInAggregationWhereInput!]
              scenes: IntScalarAggregationFilters
            }

            input ActedInCreateInput {
              scenes: Int!
            }

            input ActedInSort {
              scenes: SortDirection
            }

            input ActedInUpdateInput {
              scenes: IntScalarMutations
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              scenes: IntScalarFilters
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

            input ActorConnectWhere {
              node: ActorWhere!
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

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.director
            * AI.directed
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

            interface Director {
              years: Int!
            }

            type DirectorAggregate {
              count: Count!
              node: DirectorAggregateNode!
            }

            type DirectorAggregateNode {
              years: IntAggregateSelection!
            }

            input DirectorCreateInput {
              AI: AICreateInput
              Person: PersonCreateInput
            }

            type DirectorEdge {
              cursor: String!
              node: Director!
            }

            enum DirectorImplementation {
              AI
              Person
            }

            \\"\\"\\"
            Fields to sort Directors by. The order in which sorts are applied is not guaranteed when specifying many fields in one DirectorSort object.
            \\"\\"\\"
            input DirectorSort {
              years: SortDirection
            }

            input DirectorWhere {
              AND: [DirectorWhere!]
              NOT: DirectorWhere
              OR: [DirectorWhere!]
              typename: [DirectorImplementation!]
              years: IntScalarFilters
            }

            type DirectorsConnection {
              aggregate: DirectorAggregate!
              edges: [DirectorEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Dog implements Actor {
              actedIn: Movie
              actedInConnection: DogActedInConnection!
              name: String!
            }

            type DogActedInConnection {
              edges: [DogActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input DogActedInConnectionWhere {
              AND: [DogActedInConnectionWhere!]
              NOT: DogActedInConnectionWhere
              OR: [DogActedInConnectionWhere!]
              edge: ActedInWhere
              node: MovieWhere
            }

            input DogActedInCreateFieldInput {
              edge: ActedInCreateInput!
              node: MovieCreateInput!
            }

            input DogActedInDeleteFieldInput {
              delete: MovieDeleteInput
              where: DogActedInConnectionWhere
            }

            input DogActedInFieldInput {
              create: DogActedInCreateFieldInput
            }

            type DogActedInRelationship {
              cursor: String!
              node: Movie!
              properties: ActedIn!
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
              name: String!
            }

            input DogDeleteInput {
              actedIn: DogActedInDeleteFieldInput
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
              actedIn: MovieWhere
              actedInConnection: DogActedInConnectionWhere
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

            type IntAggregateSelection {
              average: Float
              max: Int
              min: Int
              sum: Int
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

            type Movie {
              actor(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorConnection(after: String, first: Int, sort: [MovieActorConnectionSort!], where: MovieActorConnectionWhere): MovieActorConnection!
              director: Director
              directorConnection: MovieDirectorConnection!
              title: String!
            }

            type MovieActorActorAggregateSelection {
              count: CountConnection!
              edge: MovieActorActorEdgeAggregateSelection
              node: MovieActorActorNodeAggregateSelection
            }

            type MovieActorActorEdgeAggregateSelection {
              scenes: IntAggregateSelection!
            }

            type MovieActorActorNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieActorConnectFieldInput {
              edge: ActedInCreateInput!
              where: ActorConnectWhere
            }

            type MovieActorConnection {
              aggregate: MovieActorActorAggregateSelection!
              edges: [MovieActorRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieActorConnectionAggregateInput {
              AND: [MovieActorConnectionAggregateInput!]
              NOT: MovieActorConnectionAggregateInput
              OR: [MovieActorConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              edge: ActedInAggregationWhereInput
              node: MovieActorNodeAggregationWhereInput
            }

            input MovieActorConnectionFilters {
              \\"\\"\\"Filter Movies by aggregating results on related MovieActorConnections\\"\\"\\"
              aggregate: MovieActorConnectionAggregateInput
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

            input MovieActorConnectionSort {
              edge: ActedInSort
              node: ActorSort
            }

            input MovieActorConnectionWhere {
              AND: [MovieActorConnectionWhere!]
              NOT: MovieActorConnectionWhere
              OR: [MovieActorConnectionWhere!]
              edge: ActedInWhere
              node: ActorWhere
            }

            input MovieActorCreateFieldInput {
              edge: ActedInCreateInput!
              node: ActorCreateInput!
            }

            input MovieActorDeleteFieldInput {
              where: MovieActorConnectionWhere
            }

            input MovieActorDisconnectFieldInput {
              where: MovieActorConnectionWhere
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

            type MovieActorRelationship {
              cursor: String!
              node: Actor!
              properties: ActedIn!
            }

            input MovieActorUpdateConnectionInput {
              edge: ActedInUpdateInput
              node: ActorUpdateInput
              where: MovieActorConnectionWhere
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

            input MovieConnectInput {
              actor: [MovieActorConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              actor: MovieActorFieldInput
              director: MovieDirectorFieldInput
              title: String!
            }

            input MovieDeleteInput {
              actor: [MovieActorDeleteFieldInput!]
              director: MovieDirectorDeleteFieldInput
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
              edge: DirectedWhere
              node: DirectorWhere
            }

            input MovieDirectorCreateFieldInput {
              edge: DirectedCreateInput!
              node: DirectorCreateInput!
            }

            input MovieDirectorDeleteFieldInput {
              where: MovieDirectorConnectionWhere
            }

            input MovieDirectorFieldInput {
              create: MovieDirectorCreateFieldInput
            }

            type MovieDirectorRelationship {
              cursor: String!
              node: Director!
              properties: Directed!
            }

            input MovieDisconnectInput {
              actor: [MovieActorDisconnectFieldInput!]
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
              actor: [MovieActorUpdateFieldInput!]
              title: StringScalarMutations
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actor: ActorRelationshipFilters
              actorConnection: MovieActorConnectionFilters
              director: DirectorWhere
              directorConnection: MovieDirectorConnectionWhere
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
              deleteDogs(delete: DogDeleteInput, where: DogWhere): DeleteInfo!
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

            type Person implements Actor & Director {
              actedIn: Movie
              actedInConnection: PersonActedInConnection!
              name: String!
              years: Int!
            }

            type PersonActedInConnection {
              edges: [PersonActedInRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input PersonActedInConnectionWhere {
              AND: [PersonActedInConnectionWhere!]
              NOT: PersonActedInConnectionWhere
              OR: [PersonActedInConnectionWhere!]
              edge: ActedInWhere
              node: MovieWhere
            }

            input PersonActedInCreateFieldInput {
              edge: ActedInCreateInput!
              node: MovieCreateInput!
            }

            input PersonActedInDeleteFieldInput {
              delete: MovieDeleteInput
              where: PersonActedInConnectionWhere
            }

            input PersonActedInFieldInput {
              create: PersonActedInCreateFieldInput
            }

            type PersonActedInRelationship {
              cursor: String!
              node: Movie!
              properties: ActedIn!
            }

            type PersonAggregate {
              count: Count!
              node: PersonAggregateNode!
            }

            type PersonAggregateNode {
              name: StringAggregateSelection!
              years: IntAggregateSelection!
            }

            input PersonCreateInput {
              actedIn: PersonActedInFieldInput
              name: String!
              years: Int!
            }

            input PersonDeleteInput {
              actedIn: PersonActedInDeleteFieldInput
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
              years: SortDirection
            }

            input PersonUpdateInput {
              name: StringScalarMutations
              years: IntScalarMutations
            }

            input PersonWhere {
              AND: [PersonWhere!]
              NOT: PersonWhere
              OR: [PersonWhere!]
              actedIn: MovieWhere
              actedInConnection: PersonActedInConnectionWhere
              name: StringScalarFilters
              years: IntScalarFilters
            }

            type Query {
              actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
              actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
              ais(limit: Int, offset: Int, sort: [AISort!], where: AIWhere): [AI!]!
              aisConnection(after: String, first: Int, sort: [AISort!], where: AIWhere): AisConnection!
              directors(limit: Int, offset: Int, sort: [DirectorSort!], where: DirectorWhere): [Director!]!
              directorsConnection(after: String, first: Int, sort: [DirectorSort!], where: DirectorWhere): DirectorsConnection!
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
