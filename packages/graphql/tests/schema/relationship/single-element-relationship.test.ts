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

describe("single item relationships", () => {
    test("1-1 relationship", async () => {
        const typeDefs = gql`
            type Movie @node {
                title: String!
                actor: Person @relationship(type: "ACTED_IN", direction: IN)
                director: Person! @relationship(type: "DIRECTED", direction: IN)
            }

            type Person @node {
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
              actor: Person
              actorConnection: MovieActorConnection!
              director: Person!
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
              node: PersonWhere
            }

            type MovieActorRelationship {
              cursor: String!
              node: Person!
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
              actor: PersonWhere
              actorConnection: MovieActorConnectionWhere
              director: PersonWhere
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
            type Movie @node {
                title: String!
                director: Person! @relationship(type: "DIRECTED", direction: IN)
            }

            type Person @node {
                name: String!
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
              director: Person!
              directorConnection: MovieDirectorConnection!
              title: String!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              title: StringAggregateSelection!
            }

            input MovieConnectWhere {
              node: MovieWhere!
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
              title: StringScalarMutations
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              director: PersonWhere
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
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              deleteMovies(where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
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
              directed(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              directedConnection(after: String, first: Int, sort: [PersonDirectedConnectionSort!], where: PersonDirectedConnectionWhere): PersonDirectedConnection!
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
              directed: PersonDirectedFieldInput
              name: String!
            }

            input PersonDeleteInput {
              directed: [PersonDirectedDeleteFieldInput!]
            }

            input PersonDirectedConnectFieldInput {
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
              where: PersonDirectedConnectionWhere
            }

            input PersonDirectedDisconnectFieldInput {
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

    test("1-* relationship with edge properties", async () => {
        const typeDefs = gql`
            type Movie @node {
                title: String!
                director: Person! @relationship(type: "DIRECTED", direction: IN, properties: "DirectedProps")
            }

            type Person @node {
                name: String!
                directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT, properties: "DirectedProps")
            }

            type DirectedProps @relationshipProperties {
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

            \\"\\"\\"
            The edge properties for the following fields:
            * Movie.director
            * Person.directed
            \\"\\"\\"
            type DirectedProps {
              year: Int!
            }

            input DirectedPropsAggregationWhereInput {
              AND: [DirectedPropsAggregationWhereInput!]
              NOT: DirectedPropsAggregationWhereInput
              OR: [DirectedPropsAggregationWhereInput!]
              year: IntScalarAggregationFilters
            }

            input DirectedPropsCreateInput {
              year: Int!
            }

            input DirectedPropsSort {
              year: SortDirection
            }

            input DirectedPropsUpdateInput {
              year: IntScalarMutations
            }

            input DirectedPropsWhere {
              AND: [DirectedPropsWhere!]
              NOT: DirectedPropsWhere
              OR: [DirectedPropsWhere!]
              year: IntScalarFilters
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
              director: Person!
              directorConnection: MovieDirectorConnection!
              title: String!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              title: StringAggregateSelection!
            }

            input MovieConnectWhere {
              node: MovieWhere!
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
              edge: DirectedPropsWhere
              node: PersonWhere
            }

            type MovieDirectorRelationship {
              cursor: String!
              node: Person!
              properties: DirectedProps!
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
              title: StringScalarMutations
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              director: PersonWhere
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
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              createPeople(input: [PersonCreateInput!]!): CreatePeopleMutationResponse!
              deleteMovies(where: MovieWhere): DeleteInfo!
              deletePeople(delete: PersonDeleteInput, where: PersonWhere): DeleteInfo!
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
              directed(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              directedConnection(after: String, first: Int, sort: [PersonDirectedConnectionSort!], where: PersonDirectedConnectionWhere): PersonDirectedConnection!
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
              directed: PersonDirectedFieldInput
              name: String!
            }

            input PersonDeleteInput {
              directed: [PersonDirectedDeleteFieldInput!]
            }

            input PersonDirectedConnectFieldInput {
              edge: DirectedPropsCreateInput!
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
              edge: DirectedPropsAggregationWhereInput
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
              edge: DirectedPropsSort
              node: MovieSort
            }

            input PersonDirectedConnectionWhere {
              AND: [PersonDirectedConnectionWhere!]
              NOT: PersonDirectedConnectionWhere
              OR: [PersonDirectedConnectionWhere!]
              edge: DirectedPropsWhere
              node: MovieWhere
            }

            input PersonDirectedCreateFieldInput {
              edge: DirectedPropsCreateInput!
              node: MovieCreateInput!
            }

            input PersonDirectedDeleteFieldInput {
              where: PersonDirectedConnectionWhere
            }

            input PersonDirectedDisconnectFieldInput {
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
              properties: DirectedProps!
            }

            input PersonDirectedUpdateConnectionInput {
              edge: DirectedPropsUpdateInput
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

            type PersonEdge {
              cursor: String!
              node: Person!
            }

            type PersonMovieDirectedAggregateSelection {
              count: CountConnection!
              edge: PersonMovieDirectedEdgeAggregateSelection
              node: PersonMovieDirectedNodeAggregateSelection
            }

            type PersonMovieDirectedEdgeAggregateSelection {
              year: IntAggregateSelection!
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
