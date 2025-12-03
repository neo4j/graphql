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
import { Neo4jGraphQL } from "../../src";

describe("Interfaces", () => {
    test("Interfaces", async () => {
        const typeDefs = gql`
            interface MovieNode {
                id: ID
                movies: [Movie!]! @declareRelationship
                customQuery: [Movie]
            }

            type Movie implements MovieNode @node {
                id: ID
                nodes: [MovieNode!]
                movies: [Movie!]! @relationship(type: "HAS_MOVIE", direction: OUT)
                customQuery: [Movie]
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN m
                        """
                        columnName: "m"
                    )
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

            type Movie implements MovieNode {
              customQuery: [Movie]
              id: ID
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieNodeMoviesConnectionSort!], where: MovieNodeMoviesConnectionWhere): MovieNodeMoviesConnection!
              nodes: [MovieNode!]
            }

            type MovieAggregate {
              count: Count!
            }

            input MovieConnectInput {
              movies: [MovieMoviesConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              id: ID
              movies: MovieMoviesFieldInput
            }

            input MovieDeleteInput {
              movies: [MovieNodeMoviesDeleteFieldInput!]
            }

            input MovieDisconnectInput {
              movies: [MovieNodeMoviesDisconnectFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieMoviesAggregateInput {
              AND: [MovieMoviesAggregateInput!]
              NOT: MovieMoviesAggregateInput
              OR: [MovieMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
            }

            input MovieMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            input MovieMoviesConnectionAggregateInput {
              AND: [MovieMoviesConnectionAggregateInput!]
              NOT: MovieMoviesConnectionAggregateInput
              OR: [MovieMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
            }

            input MovieMoviesConnectionFilters {
              \\"\\"\\"
              Filter Movies by aggregating results on related MovieNodeMoviesConnections
              \\"\\"\\"
              aggregate: MovieMoviesConnectionAggregateInput
              \\"\\"\\"
              Return Movies where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              all: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              none: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              single: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              some: MovieNodeMoviesConnectionWhere
            }

            input MovieMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input MovieMoviesFieldInput {
              connect: [MovieMoviesConnectFieldInput!]
              create: [MovieMoviesCreateFieldInput!]
            }

            input MovieMoviesUpdateConnectionInput {
              node: MovieUpdateInput
              where: MovieNodeMoviesConnectionWhere
            }

            input MovieMoviesUpdateFieldInput {
              connect: [MovieMoviesConnectFieldInput!]
              create: [MovieMoviesCreateFieldInput!]
              delete: [MovieNodeMoviesDeleteFieldInput!]
              disconnect: [MovieNodeMoviesDisconnectFieldInput!]
              update: MovieMoviesUpdateConnectionInput
            }

            interface MovieNode {
              customQuery: [Movie]
              id: ID
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieNodeMoviesConnectionSort!], where: MovieNodeMoviesConnectionWhere): MovieNodeMoviesConnection!
            }

            type MovieNodeAggregate {
              count: Count!
            }

            type MovieNodeEdge {
              cursor: String!
              node: MovieNode!
            }

            enum MovieNodeImplementation {
              Movie
            }

            input MovieNodeMoviesAggregateInput {
              AND: [MovieNodeMoviesAggregateInput!]
              NOT: MovieNodeMoviesAggregateInput
              OR: [MovieNodeMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
            }

            type MovieNodeMoviesConnection {
              edges: [MovieNodeMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieNodeMoviesConnectionAggregateInput {
              AND: [MovieNodeMoviesConnectionAggregateInput!]
              NOT: MovieNodeMoviesConnectionAggregateInput
              OR: [MovieNodeMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
            }

            input MovieNodeMoviesConnectionFilters {
              \\"\\"\\"
              Filter MovieNodes by aggregating results on related MovieNodeMoviesConnections
              \\"\\"\\"
              aggregate: MovieNodeMoviesConnectionAggregateInput
              \\"\\"\\"
              Return MovieNodes where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              all: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return MovieNodes where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              none: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return MovieNodes where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              single: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return MovieNodes where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              some: MovieNodeMoviesConnectionWhere
            }

            input MovieNodeMoviesConnectionSort {
              node: MovieSort
            }

            input MovieNodeMoviesConnectionWhere {
              AND: [MovieNodeMoviesConnectionWhere!]
              NOT: MovieNodeMoviesConnectionWhere
              OR: [MovieNodeMoviesConnectionWhere!]
              node: MovieWhere
            }

            input MovieNodeMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: MovieNodeMoviesConnectionWhere
            }

            input MovieNodeMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: MovieNodeMoviesConnectionWhere
            }

            type MovieNodeMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort MovieNodes by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieNodeSort object.
            \\"\\"\\"
            input MovieNodeSort {
              id: SortDirection
            }

            input MovieNodeWhere {
              AND: [MovieNodeWhere!]
              NOT: MovieNodeWhere
              OR: [MovieNodeWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              movies: MovieRelationshipFilters
              moviesAggregate: MovieNodeMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: MovieNodeMoviesConnectionFilters
              \\"\\"\\"
              Return MovieNodes where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return MovieNodes where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return MovieNodes where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return MovieNodes where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return MovieNodes where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return MovieNodes where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return MovieNodes where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return MovieNodes where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
              typename: [MovieNodeImplementation!]
            }

            type MovieNodesConnection {
              aggregate: MovieNodeAggregate!
              edges: [MovieNodeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              id: SortDirection
            }

            input MovieUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              movies: [MovieMoviesUpdateFieldInput!]
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              customQuery: MovieRelationshipFilters
              customQuery_ALL: MovieWhere
              customQuery_NONE: MovieWhere
              customQuery_SINGLE: MovieWhere
              customQuery_SOME: MovieWhere
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              movies: MovieRelationshipFilters
              moviesAggregate: MovieMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: MovieMoviesConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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
              movieNodes(limit: Int, offset: Int, sort: [MovieNodeSort!], where: MovieNodeWhere): [MovieNode!]!
              movieNodesConnection(after: String, first: Int, sort: [MovieNodeSort!], where: MovieNodeWhere): MovieNodesConnection!
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
    test("Interface with directive", async () => {
        const typeDefs = gql`
            directive @something(something: String) on INTERFACE

            interface MovieNode @something(something: "test") {
                id: ID
                movies: [Movie!]! @declareRelationship
                customQuery: [Movie]
            }

            type Movie implements MovieNode @node {
                id: ID
                nodes: [MovieNode!]
                movies: [Movie!]! @relationship(type: "HAS_MOVIE", direction: OUT)
                customQuery: [Movie]
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN m
                        """
                        columnName: "m"
                    )
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            directive @something(something: String) on INTERFACE

            input ConnectionAggregationCountFilterInput {
              edges: IntScalarFilters
              nodes: IntScalarFilters
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

            type Movie implements MovieNode {
              customQuery: [Movie]
              id: ID
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieNodeMoviesConnectionSort!], where: MovieNodeMoviesConnectionWhere): MovieNodeMoviesConnection!
              nodes: [MovieNode!]
            }

            type MovieAggregate {
              count: Count!
            }

            input MovieConnectInput {
              movies: [MovieMoviesConnectFieldInput!]
            }

            input MovieConnectWhere {
              node: MovieWhere!
            }

            input MovieCreateInput {
              id: ID
              movies: MovieMoviesFieldInput
            }

            input MovieDeleteInput {
              movies: [MovieNodeMoviesDeleteFieldInput!]
            }

            input MovieDisconnectInput {
              movies: [MovieNodeMoviesDisconnectFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieMoviesAggregateInput {
              AND: [MovieMoviesAggregateInput!]
              NOT: MovieMoviesAggregateInput
              OR: [MovieMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
            }

            input MovieMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              where: MovieConnectWhere
            }

            input MovieMoviesConnectionAggregateInput {
              AND: [MovieMoviesConnectionAggregateInput!]
              NOT: MovieMoviesConnectionAggregateInput
              OR: [MovieMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
            }

            input MovieMoviesConnectionFilters {
              \\"\\"\\"
              Filter Movies by aggregating results on related MovieNodeMoviesConnections
              \\"\\"\\"
              aggregate: MovieMoviesConnectionAggregateInput
              \\"\\"\\"
              Return Movies where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              all: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              none: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              single: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              some: MovieNodeMoviesConnectionWhere
            }

            input MovieMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input MovieMoviesFieldInput {
              connect: [MovieMoviesConnectFieldInput!]
              create: [MovieMoviesCreateFieldInput!]
            }

            input MovieMoviesUpdateConnectionInput {
              node: MovieUpdateInput
              where: MovieNodeMoviesConnectionWhere
            }

            input MovieMoviesUpdateFieldInput {
              connect: [MovieMoviesConnectFieldInput!]
              create: [MovieMoviesCreateFieldInput!]
              delete: [MovieNodeMoviesDeleteFieldInput!]
              disconnect: [MovieNodeMoviesDisconnectFieldInput!]
              update: MovieMoviesUpdateConnectionInput
            }

            interface MovieNode @something(something: \\"test\\") {
              customQuery: [Movie]
              id: ID
              movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieNodeMoviesConnectionSort!], where: MovieNodeMoviesConnectionWhere): MovieNodeMoviesConnection!
            }

            type MovieNodeAggregate {
              count: Count!
            }

            type MovieNodeEdge {
              cursor: String!
              node: MovieNode!
            }

            enum MovieNodeImplementation {
              Movie
            }

            input MovieNodeMoviesAggregateInput {
              AND: [MovieNodeMoviesAggregateInput!]
              NOT: MovieNodeMoviesAggregateInput
              OR: [MovieNodeMoviesAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
            }

            type MovieNodeMoviesConnection {
              edges: [MovieNodeMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieNodeMoviesConnectionAggregateInput {
              AND: [MovieNodeMoviesConnectionAggregateInput!]
              NOT: MovieNodeMoviesConnectionAggregateInput
              OR: [MovieNodeMoviesConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
            }

            input MovieNodeMoviesConnectionFilters {
              \\"\\"\\"
              Filter MovieNodes by aggregating results on related MovieNodeMoviesConnections
              \\"\\"\\"
              aggregate: MovieNodeMoviesConnectionAggregateInput
              \\"\\"\\"
              Return MovieNodes where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              all: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return MovieNodes where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              none: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return MovieNodes where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              single: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return MovieNodes where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              some: MovieNodeMoviesConnectionWhere
            }

            input MovieNodeMoviesConnectionSort {
              node: MovieSort
            }

            input MovieNodeMoviesConnectionWhere {
              AND: [MovieNodeMoviesConnectionWhere!]
              NOT: MovieNodeMoviesConnectionWhere
              OR: [MovieNodeMoviesConnectionWhere!]
              node: MovieWhere
            }

            input MovieNodeMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: MovieNodeMoviesConnectionWhere
            }

            input MovieNodeMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: MovieNodeMoviesConnectionWhere
            }

            type MovieNodeMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            \\"\\"\\"
            Fields to sort MovieNodes by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieNodeSort object.
            \\"\\"\\"
            input MovieNodeSort {
              id: SortDirection
            }

            input MovieNodeWhere {
              AND: [MovieNodeWhere!]
              NOT: MovieNodeWhere
              OR: [MovieNodeWhere!]
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              movies: MovieRelationshipFilters
              moviesAggregate: MovieNodeMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: MovieNodeMoviesConnectionFilters
              \\"\\"\\"
              Return MovieNodes where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return MovieNodes where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return MovieNodes where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return MovieNodes where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return MovieNodes where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return MovieNodes where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return MovieNodes where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return MovieNodes where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
              typename: [MovieNodeImplementation!]
            }

            type MovieNodesConnection {
              aggregate: MovieNodeAggregate!
              edges: [MovieNodeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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
              id: SortDirection
            }

            input MovieUpdateInput {
              id: IDScalarMutations
              id_SET: ID @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              movies: [MovieMoviesUpdateFieldInput!]
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              customQuery: MovieRelationshipFilters
              customQuery_ALL: MovieWhere
              customQuery_NONE: MovieWhere
              customQuery_SINGLE: MovieWhere
              customQuery_SOME: MovieWhere
              id: IDScalarFilters
              id_CONTAINS: ID @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: ID @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [ID] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: ID @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              movies: MovieRelationshipFilters
              moviesAggregate: MovieMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
              moviesConnection: MovieMoviesConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
            }

            type MoviesConnection {
              aggregate: MovieAggregate!
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
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
              movieNodes(limit: Int, offset: Int, sort: [MovieNodeSort!], where: MovieNodeWhere): [MovieNode!]!
              movieNodesConnection(after: String, first: Int, sort: [MovieNodeSort!], where: MovieNodeWhere): MovieNodesConnection!
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
