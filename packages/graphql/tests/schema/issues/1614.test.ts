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
import { lexicographicSortSchema } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/1614", () => {
    test("should include enumFields on relationships", async () => {
        const typeDefs = gql`
            enum CrewPositionType {
                BoomOperator
                Gaffer
                KeyGrip
            }

            type CrewPosition @relationshipProperties {
                position: CrewPositionType
            }

            type Movie @node {
                name: String!
            }

            type CrewMember @node {
                movies: [Movie!]! @relationship(type: "WORKED_ON", direction: OUT, properties: "CrewPosition")
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

            type CreateCrewMembersMutationResponse {
              crewMembers: [CrewMember!]!
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

            type CrewMember {
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [CrewMemberMoviesConnectionSort!], where: CrewMemberMoviesConnectionWhere): CrewMemberMoviesConnection!
            }

            type CrewMemberAggregate {
              count: Count!
            }

            input CrewMemberCreateInput {
              movies: CrewMemberMoviesFieldInput
            }

            input CrewMemberDeleteInput {
              movies: [CrewMemberMoviesDeleteFieldInput!]
            }

            type CrewMemberEdge {
              cursor: String!
              node: CrewMember!
            }

            type CrewMemberMovieMoviesAggregateSelection {
              count: CountConnection!
              node: CrewMemberMovieMoviesNodeAggregateSelection
            }

            type CrewMemberMovieMoviesNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input CrewMemberMoviesAggregateInput {
              AND: [CrewMemberMoviesAggregateInput!]
              NOT: CrewMemberMoviesAggregateInput
              OR: [CrewMemberMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: CrewMemberMoviesNodeAggregationWhereInput
            }

            input CrewMemberMoviesConnectFieldInput {
              edge: CrewPositionCreateInput
              where: MovieConnectWhere
            }

            type CrewMemberMoviesConnection {
              aggregate: CrewMemberMovieMoviesAggregateSelection!
              edges: [CrewMemberMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input CrewMemberMoviesConnectionAggregateInput {
              AND: [CrewMemberMoviesConnectionAggregateInput!]
              NOT: CrewMemberMoviesConnectionAggregateInput
              OR: [CrewMemberMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: CrewMemberMoviesNodeAggregationWhereInput
            }

            input CrewMemberMoviesConnectionFilters {
              \\"\\"\\"
              Filter CrewMembers by aggregating results on related CrewMemberMoviesConnections
              \\"\\"\\"
              aggregate: CrewMemberMoviesConnectionAggregateInput
              \\"\\"\\"
              Return CrewMembers where all of the related CrewMemberMoviesConnections match this filter
              \\"\\"\\"
              all: CrewMemberMoviesConnectionWhere
              \\"\\"\\"
              Return CrewMembers where none of the related CrewMemberMoviesConnections match this filter
              \\"\\"\\"
              none: CrewMemberMoviesConnectionWhere
              \\"\\"\\"
              Return CrewMembers where one of the related CrewMemberMoviesConnections match this filter
              \\"\\"\\"
              single: CrewMemberMoviesConnectionWhere
              \\"\\"\\"
              Return CrewMembers where some of the related CrewMemberMoviesConnections match this filter
              \\"\\"\\"
              some: CrewMemberMoviesConnectionWhere
            }

            input CrewMemberMoviesConnectionSort {
              edge: CrewPositionSort
              node: MovieSort
            }

            input CrewMemberMoviesConnectionWhere {
              AND: [CrewMemberMoviesConnectionWhere!]
              NOT: CrewMemberMoviesConnectionWhere
              OR: [CrewMemberMoviesConnectionWhere!]
              edge: CrewPositionWhere
              node: MovieWhere
            }

            input CrewMemberMoviesCreateFieldInput {
              edge: CrewPositionCreateInput
              node: MovieCreateInput!
            }

            input CrewMemberMoviesDeleteFieldInput {
              where: CrewMemberMoviesConnectionWhere
            }

            input CrewMemberMoviesDisconnectFieldInput {
              where: CrewMemberMoviesConnectionWhere
            }

            input CrewMemberMoviesFieldInput {
              connect: [CrewMemberMoviesConnectFieldInput!]
              create: [CrewMemberMoviesCreateFieldInput!]
            }

            input CrewMemberMoviesNodeAggregationWhereInput {
              AND: [CrewMemberMoviesNodeAggregationWhereInput!]
              NOT: CrewMemberMoviesNodeAggregationWhereInput
              OR: [CrewMemberMoviesNodeAggregationWhereInput!]
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

            type CrewMemberMoviesRelationship {
              cursor: String!
              node: Movie!
              properties: CrewPosition!
            }

            input CrewMemberMoviesUpdateConnectionInput {
              edge: CrewPositionUpdateInput
              node: MovieUpdateInput
              where: CrewMemberMoviesConnectionWhere
            }

            input CrewMemberMoviesUpdateFieldInput {
              connect: [CrewMemberMoviesConnectFieldInput!]
              create: [CrewMemberMoviesCreateFieldInput!]
              delete: [CrewMemberMoviesDeleteFieldInput!]
              disconnect: [CrewMemberMoviesDisconnectFieldInput!]
              update: CrewMemberMoviesUpdateConnectionInput
            }

            input CrewMemberUpdateInput {
              movies: [CrewMemberMoviesUpdateFieldInput!]
            }

            input CrewMemberWhere {
              AND: [CrewMemberWhere!]
              NOT: CrewMemberWhere
              OR: [CrewMemberWhere!]
              movies: MovieRelationshipFilters
              moviesAggregate: CrewMemberMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: CrewMemberMoviesConnectionFilters
              \\"\\"\\"
              Return CrewMembers where all of the related CrewMemberMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: CrewMemberMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return CrewMembers where none of the related CrewMemberMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: CrewMemberMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return CrewMembers where one of the related CrewMemberMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: CrewMemberMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return CrewMembers where some of the related CrewMemberMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: CrewMemberMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return CrewMembers where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return CrewMembers where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return CrewMembers where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return CrewMembers where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
            }

            type CrewMembersConnection {
              aggregate: CrewMemberAggregate!
              edges: [CrewMemberEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            \\"\\"\\"
            The edge properties for the following fields:
            * CrewMember.movies
            \\"\\"\\"
            type CrewPosition {
              position: CrewPositionType
            }

            input CrewPositionCreateInput {
              position: CrewPositionType
            }

            input CrewPositionSort {
              position: SortDirection
            }

            enum CrewPositionType {
              BoomOperator
              Gaffer
              KeyGrip
            }

            \\"\\"\\"CrewPositionType filters\\"\\"\\"
            input CrewPositionTypeEnumScalarFilters {
              eq: CrewPositionType
              in: [CrewPositionType!]
            }

            \\"\\"\\"CrewPositionType mutations\\"\\"\\"
            input CrewPositionTypeEnumScalarMutations {
              set: CrewPositionType
            }

            input CrewPositionUpdateInput {
              position: CrewPositionTypeEnumScalarMutations
              position_SET: CrewPositionType @deprecated(reason: \\"Please use the generic mutation 'position: { set: ... } }' instead.\\")
            }

            input CrewPositionWhere {
              AND: [CrewPositionWhere!]
              NOT: CrewPositionWhere
              OR: [CrewPositionWhere!]
              position: CrewPositionTypeEnumScalarFilters
              position_EQ: CrewPositionType @deprecated(reason: \\"Please use the relevant generic filter position: { eq: ... }\\")
              position_IN: [CrewPositionType] @deprecated(reason: \\"Please use the relevant generic filter position: { in: ... }\\")
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
              name: String!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              name: StringAggregateSelection!
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              name: String!
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
              name: SortDirection
            }

            input MovieUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createCrewMembers(input: [CrewMemberCreateInput!]!): CreateCrewMembersMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteCrewMembers(delete: CrewMemberDeleteInput, where: CrewMemberWhere): DeleteInfo!
              deleteMovies(where: MovieWhere): DeleteInfo!
              updateCrewMembers(update: CrewMemberUpdateInput, where: CrewMemberWhere): UpdateCrewMembersMutationResponse!
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
              crewMembers(limit: Int, offset: Int, where: CrewMemberWhere): [CrewMember!]!
              crewMembersConnection(after: String, first: Int, where: CrewMemberWhere): CrewMembersConnection!
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

            type UpdateCrewMembersMutationResponse {
              crewMembers: [CrewMember!]!
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

        // NOTE: are these checks relevant if the schema remains the same?
        // const schema = await neoSchema.getSchema();
        // expect(schema).toBeDefined();

        // const errors = validateSchema(schema);
        // expect(errors).toEqual([]);

        // const relationship = neoSchema["relationships"].find((r) => r.name === "CrewMemberMoviesRelationship");
        // expect(relationship).toBeDefined();
        // expect(relationship?.enumFields?.length).toBe(1);
        // expect(relationship?.properties).toBe("CrewPosition");

        // const enumField = relationship?.enumFields[0];
        // expect(enumField?.kind).toBe("Enum");
        // expect(enumField?.fieldName).toBe("position");
        // expect(enumField?.typeMeta?.name).toBe("CrewPositionType");
    });
});
