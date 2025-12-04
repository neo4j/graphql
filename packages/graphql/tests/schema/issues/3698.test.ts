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
import { validateSchema } from "graphql";
import { lexicographicSortSchema } from "graphql/utilities";
import { Neo4jGraphQL } from "../../../src";
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";

describe("https://github.com/neo4j/graphql/issues/3698", () => {
    test("Relationship not declared in interface", async () => {
        const typeDefs = /* GraphQL */ `
            interface IProduct {
                id: String!

                name: String!
                genre: [Genre!]!
                info: String!
            }

            type Movie implements IProduct @node {
                id: String!

                name: String!
                genre: [Genre!]! @relationship(type: "HAS_GENRE", direction: OUT)
                info: String! @customResolver(requires: "id name")
            }

            type Genre @node {
                name: String!
                product: [IProduct!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        const resolvers = {
            Movie: {
                info: ({ id, name }) => {
                    return `${id}, ${name}`;
                },
            },
        };
        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers, features: { subscriptions: new TestCDCEngine() } });

        const schema = await neoSchema.getSchema();
        const errors = validateSchema(schema);
        expect(errors).toHaveLength(0);

        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));

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

            type CreateGenresMutationResponse {
              genres: [Genre!]!
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

            type Genre {
              name: String!
              product(limit: Int, offset: Int, sort: [IProductSort!], where: IProductWhere): [IProduct!]!
              productConnection(after: String, first: Int, sort: [GenreProductConnectionSort!], where: GenreProductConnectionWhere): GenreProductConnection!
            }

            type GenreAggregate {
              count: Count!
              node: GenreAggregateNode!
            }

            type GenreAggregateNode {
              name: StringAggregateSelection!
            }

            input GenreConnectInput {
              product: [GenreProductConnectFieldInput!]
            }

            input GenreConnectWhere {
              node: GenreWhere!
            }

            input GenreCreateInput {
              name: String!
              product: GenreProductFieldInput
            }

            input GenreDeleteInput {
              product: [GenreProductDeleteFieldInput!]
            }

            input GenreDisconnectInput {
              product: [GenreProductDisconnectFieldInput!]
            }

            type GenreEdge {
              cursor: String!
              node: Genre!
            }

            type GenreIProductProductAggregateSelection {
              count: CountConnection!
              node: GenreIProductProductNodeAggregateSelection
            }

            type GenreIProductProductNodeAggregateSelection {
              id: StringAggregateSelection!
              info: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input GenreProductAggregateInput {
              AND: [GenreProductAggregateInput!]
              NOT: GenreProductAggregateInput
              OR: [GenreProductAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: GenreProductNodeAggregationWhereInput
            }

            input GenreProductConnectFieldInput {
              where: IProductConnectWhere
            }

            type GenreProductConnection {
              aggregate: GenreIProductProductAggregateSelection!
              edges: [GenreProductRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input GenreProductConnectionAggregateInput {
              AND: [GenreProductConnectionAggregateInput!]
              NOT: GenreProductConnectionAggregateInput
              OR: [GenreProductConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: GenreProductNodeAggregationWhereInput
            }

            input GenreProductConnectionFilters {
              \\"\\"\\"
              Filter Genres by aggregating results on related GenreProductConnections
              \\"\\"\\"
              aggregate: GenreProductConnectionAggregateInput
              \\"\\"\\"
              Return Genres where all of the related GenreProductConnections match this filter
              \\"\\"\\"
              all: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where none of the related GenreProductConnections match this filter
              \\"\\"\\"
              none: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where one of the related GenreProductConnections match this filter
              \\"\\"\\"
              single: GenreProductConnectionWhere
              \\"\\"\\"
              Return Genres where some of the related GenreProductConnections match this filter
              \\"\\"\\"
              some: GenreProductConnectionWhere
            }

            input GenreProductConnectionSort {
              node: IProductSort
            }

            input GenreProductConnectionWhere {
              AND: [GenreProductConnectionWhere!]
              NOT: GenreProductConnectionWhere
              OR: [GenreProductConnectionWhere!]
              node: IProductWhere
            }

            input GenreProductCreateFieldInput {
              node: IProductCreateInput!
            }

            input GenreProductDeleteFieldInput {
              where: GenreProductConnectionWhere
            }

            input GenreProductDisconnectFieldInput {
              where: GenreProductConnectionWhere
            }

            input GenreProductFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
            }

            input GenreProductNodeAggregationWhereInput {
              AND: [GenreProductNodeAggregationWhereInput!]
              NOT: GenreProductNodeAggregationWhereInput
              OR: [GenreProductNodeAggregationWhereInput!]
              id: StringScalarAggregationFilters
              id_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { averageLength: { eq: ... } } }' instead.\\")
              id_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { averageLength: { gt: ... } } }' instead.\\")
              id_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { averageLength: { gte: ... } } }' instead.\\")
              id_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { averageLength: { lt: ... } } }' instead.\\")
              id_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'id: { averageLength: { lte: ... } } }' instead.\\")
              id_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { longestLength: { eq: ... } } }' instead.\\")
              id_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { longestLength: { gt: ... } } }' instead.\\")
              id_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { longestLength: { gte: ... } } }' instead.\\")
              id_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { longestLength: { lt: ... } } }' instead.\\")
              id_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { longestLength: { lte: ... } } }' instead.\\")
              id_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { shortestLength: { eq: ... } } }' instead.\\")
              id_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { shortestLength: { gt: ... } } }' instead.\\")
              id_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { shortestLength: { gte: ... } } }' instead.\\")
              id_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { shortestLength: { lt: ... } } }' instead.\\")
              id_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'id: { shortestLength: { lte: ... } } }' instead.\\")
              info: StringScalarAggregationFilters
              info_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'info: { averageLength: { eq: ... } } }' instead.\\")
              info_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'info: { averageLength: { gt: ... } } }' instead.\\")
              info_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'info: { averageLength: { gte: ... } } }' instead.\\")
              info_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'info: { averageLength: { lt: ... } } }' instead.\\")
              info_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'info: { averageLength: { lte: ... } } }' instead.\\")
              info_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'info: { longestLength: { eq: ... } } }' instead.\\")
              info_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'info: { longestLength: { gt: ... } } }' instead.\\")
              info_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'info: { longestLength: { gte: ... } } }' instead.\\")
              info_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'info: { longestLength: { lt: ... } } }' instead.\\")
              info_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'info: { longestLength: { lte: ... } } }' instead.\\")
              info_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'info: { shortestLength: { eq: ... } } }' instead.\\")
              info_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'info: { shortestLength: { gt: ... } } }' instead.\\")
              info_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'info: { shortestLength: { gte: ... } } }' instead.\\")
              info_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'info: { shortestLength: { lt: ... } } }' instead.\\")
              info_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'info: { shortestLength: { lte: ... } } }' instead.\\")
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

            type GenreProductRelationship {
              cursor: String!
              node: IProduct!
            }

            input GenreProductUpdateConnectionInput {
              node: IProductUpdateInput
              where: GenreProductConnectionWhere
            }

            input GenreProductUpdateFieldInput {
              connect: [GenreProductConnectFieldInput!]
              create: [GenreProductCreateFieldInput!]
              delete: [GenreProductDeleteFieldInput!]
              disconnect: [GenreProductDisconnectFieldInput!]
              update: GenreProductUpdateConnectionInput
            }

            input GenreRelationshipFilters {
              \\"\\"\\"Filter type where all of the related Genres match this filter\\"\\"\\"
              all: GenreWhere
              \\"\\"\\"Filter type where none of the related Genres match this filter\\"\\"\\"
              none: GenreWhere
              \\"\\"\\"Filter type where one of the related Genres match this filter\\"\\"\\"
              single: GenreWhere
              \\"\\"\\"Filter type where some of the related Genres match this filter\\"\\"\\"
              some: GenreWhere
            }

            \\"\\"\\"
            Fields to sort Genres by. The order in which sorts are applied is not guaranteed when specifying many fields in one GenreSort object.
            \\"\\"\\"
            input GenreSort {
              name: SortDirection
            }

            input GenreUpdateInput {
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
              product: [GenreProductUpdateFieldInput!]
            }

            input GenreWhere {
              AND: [GenreWhere!]
              NOT: GenreWhere
              OR: [GenreWhere!]
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              product: IProductRelationshipFilters
              productAggregate: GenreProductAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the productConnection filter, please use { productConnection: { aggregate: {...} } } instead\\")
              productConnection: GenreProductConnectionFilters
              \\"\\"\\"
              Return Genres where all of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_ALL: GenreProductConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'productConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Genres where none of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_NONE: GenreProductConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'productConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Genres where one of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SINGLE: GenreProductConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'productConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Genres where some of the related GenreProductConnections match this filter
              \\"\\"\\"
              productConnection_SOME: GenreProductConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'productConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Genres where all of the related IProducts match this filter\\"\\"\\"
              product_ALL: IProductWhere @deprecated(reason: \\"Please use the relevant generic filter 'product: { all: ... }' instead.\\")
              \\"\\"\\"Return Genres where none of the related IProducts match this filter\\"\\"\\"
              product_NONE: IProductWhere @deprecated(reason: \\"Please use the relevant generic filter 'product: { none: ... }' instead.\\")
              \\"\\"\\"Return Genres where one of the related IProducts match this filter\\"\\"\\"
              product_SINGLE: IProductWhere @deprecated(reason: \\"Please use the relevant generic filter 'product: {  single: ... }' instead.\\")
              \\"\\"\\"Return Genres where some of the related IProducts match this filter\\"\\"\\"
              product_SOME: IProductWhere @deprecated(reason: \\"Please use the relevant generic filter 'product: {  some: ... }' instead.\\")
            }

            type GenresConnection {
              aggregate: GenreAggregate!
              edges: [GenreEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            interface IProduct {
              genre: [Genre!]!
              id: String!
              info: String!
              name: String!
            }

            type IProductAggregate {
              count: Count!
              node: IProductAggregateNode!
            }

            type IProductAggregateNode {
              id: StringAggregateSelection!
              info: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input IProductConnectWhere {
              node: IProductWhere!
            }

            input IProductCreateInput {
              Movie: MovieCreateInput
            }

            type IProductEdge {
              cursor: String!
              node: IProduct!
            }

            enum IProductImplementation {
              Movie
            }

            input IProductRelationshipFilters {
              \\"\\"\\"Filter type where all of the related IProducts match this filter\\"\\"\\"
              all: IProductWhere
              \\"\\"\\"Filter type where none of the related IProducts match this filter\\"\\"\\"
              none: IProductWhere
              \\"\\"\\"Filter type where one of the related IProducts match this filter\\"\\"\\"
              single: IProductWhere
              \\"\\"\\"Filter type where some of the related IProducts match this filter\\"\\"\\"
              some: IProductWhere
            }

            \\"\\"\\"
            Fields to sort IProducts by. The order in which sorts are applied is not guaranteed when specifying many fields in one IProductSort object.
            \\"\\"\\"
            input IProductSort {
              id: SortDirection
              info: SortDirection
              name: SortDirection
            }

            input IProductUpdateInput {
              id: StringScalarMutations
              id_SET: String @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              info: StringScalarMutations
              info_SET: String @deprecated(reason: \\"Please use the generic mutation 'info: { set: ... } }' instead.\\")
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input IProductWhere {
              AND: [IProductWhere!]
              NOT: IProductWhere
              OR: [IProductWhere!]
              id: StringScalarFilters
              id_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: String @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
              info: StringScalarFilters
              info_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter info: { contains: ... }\\")
              info_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter info: { endsWith: ... }\\")
              info_EQ: String @deprecated(reason: \\"Please use the relevant generic filter info: { eq: ... }\\")
              info_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter info: { in: ... }\\")
              info_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter info: { startsWith: ... }\\")
              name: StringScalarFilters
              name_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter name: { contains: ... }\\")
              name_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { endsWith: ... }\\")
              name_EQ: String @deprecated(reason: \\"Please use the relevant generic filter name: { eq: ... }\\")
              name_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter name: { in: ... }\\")
              name_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter name: { startsWith: ... }\\")
              typename: [IProductImplementation!]
            }

            type IProductsConnection {
              aggregate: IProductAggregate!
              edges: [IProductEdge!]!
              pageInfo: PageInfo!
              totalCount: Int!
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

            type Movie implements IProduct {
              genre(limit: Int, offset: Int, sort: [GenreSort!], where: GenreWhere): [Genre!]!
              genreConnection(after: String, first: Int, sort: [MovieGenreConnectionSort!], where: MovieGenreConnectionWhere): MovieGenreConnection!
              id: String!
              info: String!
              name: String!
            }

            type MovieAggregate {
              count: Count!
              node: MovieAggregateNode!
            }

            type MovieAggregateNode {
              id: StringAggregateSelection!
              name: StringAggregateSelection!
            }

            input MovieCreateInput {
              genre: MovieGenreFieldInput
              id: String!
              name: String!
            }

            input MovieDeleteInput {
              genre: [MovieGenreDeleteFieldInput!]
            }

            type MovieEdge {
              cursor: String!
              node: Movie!
            }

            input MovieGenreAggregateInput {
              AND: [MovieGenreAggregateInput!]
              NOT: MovieGenreAggregateInput
              OR: [MovieGenreAggregateInput!]
              count: IntScalarFilters
              count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
              count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
              count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
              count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
              count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
              node: MovieGenreNodeAggregationWhereInput
            }

            input MovieGenreConnectFieldInput {
              connect: [GenreConnectInput!]
              where: GenreConnectWhere
            }

            type MovieGenreConnection {
              aggregate: MovieGenreGenreAggregateSelection!
              edges: [MovieGenreRelationship!]!
              pageInfo: PageInfo!
              totalCount: Int!
            }

            input MovieGenreConnectionAggregateInput {
              AND: [MovieGenreConnectionAggregateInput!]
              NOT: MovieGenreConnectionAggregateInput
              OR: [MovieGenreConnectionAggregateInput!]
              count: ConnectionAggregationCountFilterInput
              node: MovieGenreNodeAggregationWhereInput
            }

            input MovieGenreConnectionFilters {
              \\"\\"\\"Filter Movies by aggregating results on related MovieGenreConnections\\"\\"\\"
              aggregate: MovieGenreConnectionAggregateInput
              \\"\\"\\"
              Return Movies where all of the related MovieGenreConnections match this filter
              \\"\\"\\"
              all: MovieGenreConnectionWhere
              \\"\\"\\"
              Return Movies where none of the related MovieGenreConnections match this filter
              \\"\\"\\"
              none: MovieGenreConnectionWhere
              \\"\\"\\"
              Return Movies where one of the related MovieGenreConnections match this filter
              \\"\\"\\"
              single: MovieGenreConnectionWhere
              \\"\\"\\"
              Return Movies where some of the related MovieGenreConnections match this filter
              \\"\\"\\"
              some: MovieGenreConnectionWhere
            }

            input MovieGenreConnectionSort {
              node: GenreSort
            }

            input MovieGenreConnectionWhere {
              AND: [MovieGenreConnectionWhere!]
              NOT: MovieGenreConnectionWhere
              OR: [MovieGenreConnectionWhere!]
              node: GenreWhere
            }

            input MovieGenreCreateFieldInput {
              node: GenreCreateInput!
            }

            input MovieGenreDeleteFieldInput {
              delete: GenreDeleteInput
              where: MovieGenreConnectionWhere
            }

            input MovieGenreDisconnectFieldInput {
              disconnect: GenreDisconnectInput
              where: MovieGenreConnectionWhere
            }

            input MovieGenreFieldInput {
              connect: [MovieGenreConnectFieldInput!]
              create: [MovieGenreCreateFieldInput!]
            }

            type MovieGenreGenreAggregateSelection {
              count: CountConnection!
              node: MovieGenreGenreNodeAggregateSelection
            }

            type MovieGenreGenreNodeAggregateSelection {
              name: StringAggregateSelection!
            }

            input MovieGenreNodeAggregationWhereInput {
              AND: [MovieGenreNodeAggregationWhereInput!]
              NOT: MovieGenreNodeAggregationWhereInput
              OR: [MovieGenreNodeAggregationWhereInput!]
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

            type MovieGenreRelationship {
              cursor: String!
              node: Genre!
            }

            input MovieGenreUpdateConnectionInput {
              node: GenreUpdateInput
              where: MovieGenreConnectionWhere
            }

            input MovieGenreUpdateFieldInput {
              connect: [MovieGenreConnectFieldInput!]
              create: [MovieGenreCreateFieldInput!]
              delete: [MovieGenreDeleteFieldInput!]
              disconnect: [MovieGenreDisconnectFieldInput!]
              update: MovieGenreUpdateConnectionInput
            }

            \\"\\"\\"
            Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
            \\"\\"\\"
            input MovieSort {
              id: SortDirection
              name: SortDirection
            }

            input MovieUpdateInput {
              genre: [MovieGenreUpdateFieldInput!]
              id: StringScalarMutations
              id_SET: String @deprecated(reason: \\"Please use the generic mutation 'id: { set: ... } }' instead.\\")
              name: StringScalarMutations
              name_SET: String @deprecated(reason: \\"Please use the generic mutation 'name: { set: ... } }' instead.\\")
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              genre: GenreRelationshipFilters
              genreAggregate: MovieGenreAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the genreConnection filter, please use { genreConnection: { aggregate: {...} } } instead\\")
              genreConnection: MovieGenreConnectionFilters
              \\"\\"\\"
              Return Movies where all of the related MovieGenreConnections match this filter
              \\"\\"\\"
              genreConnection_ALL: MovieGenreConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'genreConnection: { all: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where none of the related MovieGenreConnections match this filter
              \\"\\"\\"
              genreConnection_NONE: MovieGenreConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'genreConnection: { none: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where one of the related MovieGenreConnections match this filter
              \\"\\"\\"
              genreConnection_SINGLE: MovieGenreConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'genreConnection: { single: { node: ... } } }' instead.\\")
              \\"\\"\\"
              Return Movies where some of the related MovieGenreConnections match this filter
              \\"\\"\\"
              genreConnection_SOME: MovieGenreConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'genreConnection: { some: { node: ... } } }' instead.\\")
              \\"\\"\\"Return Movies where all of the related Genres match this filter\\"\\"\\"
              genre_ALL: GenreWhere @deprecated(reason: \\"Please use the relevant generic filter 'genre: { all: ... }' instead.\\")
              \\"\\"\\"Return Movies where none of the related Genres match this filter\\"\\"\\"
              genre_NONE: GenreWhere @deprecated(reason: \\"Please use the relevant generic filter 'genre: { none: ... }' instead.\\")
              \\"\\"\\"Return Movies where one of the related Genres match this filter\\"\\"\\"
              genre_SINGLE: GenreWhere @deprecated(reason: \\"Please use the relevant generic filter 'genre: {  single: ... }' instead.\\")
              \\"\\"\\"Return Movies where some of the related Genres match this filter\\"\\"\\"
              genre_SOME: GenreWhere @deprecated(reason: \\"Please use the relevant generic filter 'genre: {  some: ... }' instead.\\")
              id: StringScalarFilters
              id_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter id: { contains: ... }\\")
              id_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter id: { endsWith: ... }\\")
              id_EQ: String @deprecated(reason: \\"Please use the relevant generic filter id: { eq: ... }\\")
              id_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter id: { in: ... }\\")
              id_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter id: { startsWith: ... }\\")
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
              createGenres(input: [GenreCreateInput!]!): CreateGenresMutationResponse!
              createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
              deleteGenres(delete: GenreDeleteInput, where: GenreWhere): DeleteInfo!
              deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
              updateGenres(update: GenreUpdateInput, where: GenreWhere): UpdateGenresMutationResponse!
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
              genres(limit: Int, offset: Int, sort: [GenreSort!], where: GenreWhere): [Genre!]!
              genresConnection(after: String, first: Int, sort: [GenreSort!], where: GenreWhere): GenresConnection!
              iProducts(limit: Int, offset: Int, sort: [IProductSort!], where: IProductWhere): [IProduct!]!
              iProductsConnection(after: String, first: Int, sort: [IProductSort!], where: IProductWhere): IProductsConnection!
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

            type UpdateGenresMutationResponse {
              genres: [Genre!]!
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
