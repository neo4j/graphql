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
                nodes: [MovieNode]
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

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type Movie implements MovieNode {
              customQuery: [Movie]
              id: ID
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): MovieMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieNodeMoviesConnectionSort!], where: MovieNodeMoviesConnectionWhere): MovieNodeMoviesConnection!
              nodes: [MovieNode]
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
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

            type MovieMovieMoviesAggregationSelection {
              count: Int!
              node: MovieMovieMoviesNodeAggregateSelection
            }

            type MovieMovieMoviesNodeAggregateSelection {
              id: IDAggregateSelection!
            }

            input MovieMoviesAggregateInput {
              AND: [MovieMoviesAggregateInput!]
              NOT: MovieMoviesAggregateInput
              OR: [MovieMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieMoviesNodeAggregationWhereInput
            }

            input MovieMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            input MovieMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input MovieMoviesFieldInput {
              connect: [MovieMoviesConnectFieldInput!]
              create: [MovieMoviesCreateFieldInput!]
            }

            input MovieMoviesNodeAggregationWhereInput {
              AND: [MovieMoviesNodeAggregationWhereInput!]
              NOT: MovieMoviesNodeAggregationWhereInput
              OR: [MovieMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            input MovieMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input MovieMoviesUpdateFieldInput {
              connect: [MovieMoviesConnectFieldInput!]
              create: [MovieMoviesCreateFieldInput!]
              delete: [MovieNodeMoviesDeleteFieldInput!]
              disconnect: [MovieNodeMoviesDisconnectFieldInput!]
              update: MovieMoviesUpdateConnectionInput
              where: MovieNodeMoviesConnectionWhere
            }

            interface MovieNode {
              customQuery: [Movie]
              id: ID
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieNodeMoviesConnectionSort!], where: MovieNodeMoviesConnectionWhere): MovieNodeMoviesConnection!
            }

            type MovieNodeAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
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
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieNodeMoviesNodeAggregationWhereInput
            }

            type MovieNodeMoviesConnection {
              edges: [MovieNodeMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieNodeMoviesConnectionSort {
              node: MovieSort
            }

            input MovieNodeMoviesConnectionWhere {
              AND: [MovieNodeMoviesConnectionWhere!]
              NOT: MovieNodeMoviesConnectionWhere
              OR: [MovieNodeMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieNodeMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: MovieNodeMoviesConnectionWhere
            }

            input MovieNodeMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: MovieNodeMoviesConnectionWhere
            }

            input MovieNodeMoviesNodeAggregationWhereInput {
              AND: [MovieNodeMoviesNodeAggregationWhereInput!]
              NOT: MovieNodeMoviesNodeAggregationWhereInput
              OR: [MovieNodeMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type MovieNodeMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input MovieNodeOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieNodeSort objects to sort MovieNodes by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieNodeSort]
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
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: ID
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: MovieNodeMoviesAggregateInput
              moviesConnection: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return MovieNodes where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return MovieNodes where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: MovieNodeMoviesConnectionWhere
              moviesConnection_NOT: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return MovieNodes where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return MovieNodes where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: MovieNodeMoviesConnectionWhere
              \\"\\"\\"Return MovieNodes where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return MovieNodes where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return MovieNodes where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return MovieNodes where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
              typename_IN: [MovieNodeImplementation!]
            }

            type MovieNodesConnection {
              edges: [MovieNodeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort!]
            }

            input MovieRelationInput {
              movies: [MovieMoviesCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
            }

            input MovieUpdateInput {
              id: ID
              movies: [MovieMoviesUpdateFieldInput!]
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: ID
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: MovieMoviesAggregateInput
              moviesConnection: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Movies where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: MovieNodeMoviesConnectionWhere
              moviesConnection_NOT: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: MovieNodeMoviesConnectionWhere
              \\"\\"\\"Return Movies where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Movies where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Movies where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              updateMovies(connect: MovieConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: MovieRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: MovieDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: MovieDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              movieNodes(options: MovieNodeOptions, where: MovieNodeWhere): [MovieNode!]!
              movieNodesAggregate(where: MovieNodeWhere): MovieNodeAggregateSelection!
              movieNodesConnection(after: String, first: Int, sort: [MovieNodeSort], where: MovieNodeWhere): MovieNodesConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
                nodes: [MovieNode]
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

            \\"\\"\\"
            Information about the number of nodes and relationships created during a create mutation
            \\"\\"\\"
            type CreateInfo {
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type IDAggregateSelection {
              longest: ID
              shortest: ID
            }

            type Movie implements MovieNode {
              customQuery: [Movie]
              id: ID
              movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(directed: Boolean = true, where: MovieWhere): MovieMovieMoviesAggregationSelection
              moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieNodeMoviesConnectionSort!], where: MovieNodeMoviesConnectionWhere): MovieNodeMoviesConnection!
              nodes: [MovieNode]
            }

            type MovieAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
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

            type MovieMovieMoviesAggregationSelection {
              count: Int!
              node: MovieMovieMoviesNodeAggregateSelection
            }

            type MovieMovieMoviesNodeAggregateSelection {
              id: IDAggregateSelection!
            }

            input MovieMoviesAggregateInput {
              AND: [MovieMoviesAggregateInput!]
              NOT: MovieMoviesAggregateInput
              OR: [MovieMoviesAggregateInput!]
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieMoviesNodeAggregationWhereInput
            }

            input MovieMoviesConnectFieldInput {
              connect: [MovieConnectInput!]
              \\"\\"\\"
              Whether or not to overwrite any matching relationship with the new properties.
              \\"\\"\\"
              overwrite: Boolean! = true
              where: MovieConnectWhere
            }

            input MovieMoviesCreateFieldInput {
              node: MovieCreateInput!
            }

            input MovieMoviesFieldInput {
              connect: [MovieMoviesConnectFieldInput!]
              create: [MovieMoviesCreateFieldInput!]
            }

            input MovieMoviesNodeAggregationWhereInput {
              AND: [MovieMoviesNodeAggregationWhereInput!]
              NOT: MovieMoviesNodeAggregationWhereInput
              OR: [MovieMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            input MovieMoviesUpdateConnectionInput {
              node: MovieUpdateInput
            }

            input MovieMoviesUpdateFieldInput {
              connect: [MovieMoviesConnectFieldInput!]
              create: [MovieMoviesCreateFieldInput!]
              delete: [MovieNodeMoviesDeleteFieldInput!]
              disconnect: [MovieNodeMoviesDisconnectFieldInput!]
              update: MovieMoviesUpdateConnectionInput
              where: MovieNodeMoviesConnectionWhere
            }

            interface MovieNode @something(something: \\"test\\") {
              customQuery: [Movie]
              id: ID
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesConnection(after: String, first: Int, sort: [MovieNodeMoviesConnectionSort!], where: MovieNodeMoviesConnectionWhere): MovieNodeMoviesConnection!
            }

            type MovieNodeAggregateSelection {
              count: Int!
              id: IDAggregateSelection!
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
              count: Int
              count_GT: Int
              count_GTE: Int
              count_LT: Int
              count_LTE: Int
              node: MovieNodeMoviesNodeAggregationWhereInput
            }

            type MovieNodeMoviesConnection {
              edges: [MovieNodeMoviesRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieNodeMoviesConnectionSort {
              node: MovieSort
            }

            input MovieNodeMoviesConnectionWhere {
              AND: [MovieNodeMoviesConnectionWhere!]
              NOT: MovieNodeMoviesConnectionWhere
              OR: [MovieNodeMoviesConnectionWhere!]
              node: MovieWhere
              node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
            }

            input MovieNodeMoviesDeleteFieldInput {
              delete: MovieDeleteInput
              where: MovieNodeMoviesConnectionWhere
            }

            input MovieNodeMoviesDisconnectFieldInput {
              disconnect: MovieDisconnectInput
              where: MovieNodeMoviesConnectionWhere
            }

            input MovieNodeMoviesNodeAggregationWhereInput {
              AND: [MovieNodeMoviesNodeAggregationWhereInput!]
              NOT: MovieNodeMoviesNodeAggregationWhereInput
              OR: [MovieNodeMoviesNodeAggregationWhereInput!]
              id_EQUAL: ID @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
            }

            type MovieNodeMoviesRelationship {
              cursor: String!
              node: Movie!
            }

            input MovieNodeOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieNodeSort objects to sort MovieNodes by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieNodeSort]
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
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: ID
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: MovieNodeMoviesAggregateInput
              moviesConnection: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return MovieNodes where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return MovieNodes where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: MovieNodeMoviesConnectionWhere
              moviesConnection_NOT: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return MovieNodes where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return MovieNodes where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: MovieNodeMoviesConnectionWhere
              \\"\\"\\"Return MovieNodes where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return MovieNodes where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return MovieNodes where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return MovieNodes where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
              typename_IN: [MovieNodeImplementation!]
            }

            type MovieNodesConnection {
              edges: [MovieNodeEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieOptions {
              limit: Int
              offset: Int
              \\"\\"\\"
              Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
              \\"\\"\\"
              sort: [MovieSort!]
            }

            input MovieRelationInput {
              movies: [MovieMoviesCreateFieldInput!]
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
            }

            input MovieUpdateInput {
              id: ID
              movies: [MovieMoviesUpdateFieldInput!]
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              id: ID @deprecated(reason: \\"Please use the explicit _EQ version\\")
              id_CONTAINS: ID
              id_ENDS_WITH: ID
              id_EQ: ID
              id_IN: [ID]
              id_NOT: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_CONTAINS: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_ENDS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_IN: [ID] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_NOT_STARTS_WITH: ID @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
              id_STARTS_WITH: ID
              movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
              moviesAggregate: MovieMoviesAggregateInput
              moviesConnection: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
              \\"\\"\\"
              Return Movies where all of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_ALL: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_NONE: MovieNodeMoviesConnectionWhere
              moviesConnection_NOT: MovieNodeMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SINGLE: MovieNodeMoviesConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieNodeMoviesConnections match this filter
              \\"\\"\\"
              moviesConnection_SOME: MovieNodeMoviesConnectionWhere
              \\"\\"\\"Return Movies where all of the related Movies match this filter\\"\\"\\"
              movies_ALL: MovieWhere
              \\"\\"\\"Return Movies where none of the related Movies match this filter\\"\\"\\"
              movies_NONE: MovieWhere
              movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
              \\"\\"\\"Return Movies where one of the related Movies match this filter\\"\\"\\"
              movies_SINGLE: MovieWhere
              \\"\\"\\"Return Movies where some of the related Movies match this filter\\"\\"\\"
              movies_SOME: MovieWhere
            }

            type MoviesConnection {
              edges: [MovieEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              updateMovies(connect: MovieConnectInput @deprecated(reason: \\"Top level connect input argument in update is deprecated. Use the nested connect field in the relationship within the update argument\\"), create: MovieRelationInput @deprecated(reason: \\"Top level create input argument in update is deprecated. Use the nested create field in the relationship within the update argument\\"), delete: MovieDeleteInput @deprecated(reason: \\"Top level delete input argument in update is deprecated. Use the nested delete field in the relationship within the update argument\\"), disconnect: MovieDisconnectInput @deprecated(reason: \\"Top level disconnect input argument in update is deprecated. Use the nested disconnect field in the relationship within the update argument\\"), update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
            }

            \\"\\"\\"Pagination information (Relay)\\"\\"\\"
            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              movieNodes(options: MovieNodeOptions, where: MovieNodeWhere): [MovieNode!]!
              movieNodesAggregate(where: MovieNodeWhere): MovieNodeAggregateSelection!
              movieNodesConnection(after: String, first: Int, sort: [MovieNodeSort], where: MovieNodeWhere): MovieNodesConnection!
              movies(options: MovieOptions, where: MovieWhere): [Movie!]!
              moviesAggregate(where: MovieWhere): MovieAggregateSelection!
              moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
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
              bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
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
