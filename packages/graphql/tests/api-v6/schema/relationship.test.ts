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
import { raiseOnInvalidSchema } from "../../utils/raise-on-invalid-schema";

describe("Relationships", () => {
    test("Simple relationship without properties", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
            type Actor @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getAuraSchema();
        raiseOnInvalidSchema(schema);
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type Actor {
              movies(where: ActorMoviesOperationWhere): ActorMoviesOperation
              name: String
            }

            type ActorConnection {
              edges: [ActorEdge]
              pageInfo: PageInfo
            }

            input ActorConnectionSort {
              node: ActorSort
            }

            type ActorCreateInfo {
              nodesCreated: Int!
              nodesDelete: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            input ActorCreateInput {
              node: ActorCreateNode!
            }

            input ActorCreateNode {
              name: String
            }

            type ActorCreateResponse {
              actors: [Actor!]!
              info: CreateInfo
            }

            input ActorDeleteInput {
              node: ActorDeleteNode
            }

            input ActorDeleteNode {
              movies: ActorMoviesDeleteOperation
            }

            type ActorEdge {
              cursor: String
              node: Actor
            }

            type ActorMoviesConnection {
              edges: [ActorMoviesEdge]
              pageInfo: PageInfo
            }

            input ActorMoviesConnectionSort {
              edges: ActorMoviesEdgeSort
            }

            input ActorMoviesDeleteInput {
              input: MovieDeleteInput
              where: ActorMoviesOperationWhere
            }

            input ActorMoviesDeleteOperation {
              delete: ActorMoviesDeleteInput
            }

            type ActorMoviesEdge {
              cursor: String
              node: Movie
            }

            input ActorMoviesEdgeListWhere {
              AND: [ActorMoviesEdgeListWhere!]
              NOT: ActorMoviesEdgeListWhere
              OR: [ActorMoviesEdgeListWhere!]
              edges: ActorMoviesEdgeWhere
            }

            input ActorMoviesEdgeSort {
              node: MovieSort
            }

            input ActorMoviesEdgeWhere {
              AND: [ActorMoviesEdgeWhere!]
              NOT: ActorMoviesEdgeWhere
              OR: [ActorMoviesEdgeWhere!]
              node: MovieWhere
            }

            input ActorMoviesNestedOperationWhere {
              AND: [ActorMoviesNestedOperationWhere!]
              NOT: ActorMoviesNestedOperationWhere
              OR: [ActorMoviesNestedOperationWhere!]
              all: ActorMoviesEdgeListWhere
              none: ActorMoviesEdgeListWhere
              single: ActorMoviesEdgeListWhere
              some: ActorMoviesEdgeListWhere
            }

            type ActorMoviesOperation {
              connection(after: String, first: Int, sort: [ActorMoviesConnectionSort!]): ActorMoviesConnection
            }

            input ActorMoviesOperationWhere {
              AND: [ActorMoviesOperationWhere!]
              NOT: ActorMoviesOperationWhere
              OR: [ActorMoviesOperationWhere!]
              edges: ActorMoviesEdgeWhere
            }

            type ActorOperation {
              connection(after: String, first: Int, sort: [ActorConnectionSort!]): ActorConnection
            }

            input ActorOperationWhere {
              AND: [ActorOperationWhere!]
              NOT: ActorOperationWhere
              OR: [ActorOperationWhere!]
              node: ActorWhere
            }

            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              node: ActorUpdateNode!
            }

            input ActorUpdateNode {
              name: StringUpdate
            }

            type ActorUpdateResponse {
              actors: [Actor!]!
              info: ActorCreateInfo
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              movies: ActorMoviesNestedOperationWhere
              name: StringWhere
            }

            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type DeleteResponse {
              info: DeleteInfo
            }

            type Movie {
              actors(where: MovieActorsOperationWhere): MovieActorsOperation
              title: String
            }

            type MovieActorsConnection {
              edges: [MovieActorsEdge]
              pageInfo: PageInfo
            }

            input MovieActorsConnectionSort {
              edges: MovieActorsEdgeSort
            }

            input MovieActorsDeleteInput {
              input: ActorDeleteInput
              where: MovieActorsOperationWhere
            }

            input MovieActorsDeleteOperation {
              delete: MovieActorsDeleteInput
            }

            type MovieActorsEdge {
              cursor: String
              node: Actor
            }

            input MovieActorsEdgeListWhere {
              AND: [MovieActorsEdgeListWhere!]
              NOT: MovieActorsEdgeListWhere
              OR: [MovieActorsEdgeListWhere!]
              edges: MovieActorsEdgeWhere
            }

            input MovieActorsEdgeSort {
              node: ActorSort
            }

            input MovieActorsEdgeWhere {
              AND: [MovieActorsEdgeWhere!]
              NOT: MovieActorsEdgeWhere
              OR: [MovieActorsEdgeWhere!]
              node: ActorWhere
            }

            input MovieActorsNestedOperationWhere {
              AND: [MovieActorsNestedOperationWhere!]
              NOT: MovieActorsNestedOperationWhere
              OR: [MovieActorsNestedOperationWhere!]
              all: MovieActorsEdgeListWhere
              none: MovieActorsEdgeListWhere
              single: MovieActorsEdgeListWhere
              some: MovieActorsEdgeListWhere
            }

            type MovieActorsOperation {
              connection(after: String, first: Int, sort: [MovieActorsConnectionSort!]): MovieActorsConnection
            }

            input MovieActorsOperationWhere {
              AND: [MovieActorsOperationWhere!]
              NOT: MovieActorsOperationWhere
              OR: [MovieActorsOperationWhere!]
              edges: MovieActorsEdgeWhere
            }

            type MovieConnection {
              edges: [MovieEdge]
              pageInfo: PageInfo
            }

            input MovieConnectionSort {
              node: MovieSort
            }

            type MovieCreateInfo {
              nodesCreated: Int!
              nodesDelete: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            input MovieCreateInput {
              node: MovieCreateNode!
            }

            input MovieCreateNode {
              title: String
            }

            type MovieCreateResponse {
              info: CreateInfo
              movies: [Movie!]!
            }

            input MovieDeleteInput {
              node: MovieDeleteNode
            }

            input MovieDeleteNode {
              actors: MovieActorsDeleteOperation
            }

            type MovieEdge {
              cursor: String
              node: Movie
            }

            type MovieOperation {
              connection(after: String, first: Int, sort: [MovieConnectionSort!]): MovieConnection
            }

            input MovieOperationWhere {
              AND: [MovieOperationWhere!]
              NOT: MovieOperationWhere
              OR: [MovieOperationWhere!]
              node: MovieWhere
            }

            input MovieSort {
              title: SortDirection
            }

            input MovieUpdateInput {
              node: MovieUpdateNode!
            }

            input MovieUpdateNode {
              title: StringUpdate
            }

            type MovieUpdateResponse {
              info: MovieCreateInfo
              movies: [Movie!]!
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: MovieActorsNestedOperationWhere
              title: StringWhere
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): ActorCreateResponse
              createMovies(input: [MovieCreateInput!]!): MovieCreateResponse
              deleteActors(input: ActorDeleteInput, where: ActorOperationWhere): DeleteResponse
              deleteMovies(input: MovieDeleteInput, where: MovieOperationWhere): DeleteResponse
              updateActors(input: ActorUpdateInput!, where: ActorOperationWhere): ActorUpdateResponse
              updateMovies(input: MovieUpdateInput!, where: MovieOperationWhere): MovieUpdateResponse
            }

            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              actors(where: ActorOperationWhere): ActorOperation
              movies(where: MovieOperationWhere): MovieOperation
            }

            enum SortDirection {
              ASC
              DESC
            }

            input StringUpdate {
              set: String
            }

            input StringWhere {
              AND: [StringWhere!]
              NOT: StringWhere
              OR: [StringWhere!]
              contains: String
              endsWith: String
              equals: String
              in: [String!]
              startsWith: String
            }"
        `);
    });

    test("Simple relationship with properties", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type Actor @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                year: Int
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getAuraSchema();
        raiseOnInvalidSchema(schema);
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
              mutation: Mutation
            }

            type ActedIn {
              year: Int
            }

            input ActedInSort {
              year: SortDirection
            }

            input ActedInWhere {
              AND: [ActedInWhere!]
              NOT: ActedInWhere
              OR: [ActedInWhere!]
              year: IntWhere
            }

            type Actor {
              movies(where: ActorMoviesOperationWhere): ActorMoviesOperation
              name: String
            }

            type ActorConnection {
              edges: [ActorEdge]
              pageInfo: PageInfo
            }

            input ActorConnectionSort {
              node: ActorSort
            }

            type ActorCreateInfo {
              nodesCreated: Int!
              nodesDelete: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            input ActorCreateInput {
              node: ActorCreateNode!
            }

            input ActorCreateNode {
              name: String
            }

            type ActorCreateResponse {
              actors: [Actor!]!
              info: CreateInfo
            }

            input ActorDeleteInput {
              node: ActorDeleteNode
            }

            input ActorDeleteNode {
              movies: ActorMoviesDeleteOperation
            }

            type ActorEdge {
              cursor: String
              node: Actor
            }

            type ActorMoviesConnection {
              edges: [ActorMoviesEdge]
              pageInfo: PageInfo
            }

            input ActorMoviesConnectionSort {
              edges: ActorMoviesEdgeSort
            }

            input ActorMoviesDeleteInput {
              input: MovieDeleteInput
              where: ActorMoviesOperationWhere
            }

            input ActorMoviesDeleteOperation {
              delete: ActorMoviesDeleteInput
            }

            type ActorMoviesEdge {
              cursor: String
              node: Movie
              properties: ActedIn
            }

            input ActorMoviesEdgeListWhere {
              AND: [ActorMoviesEdgeListWhere!]
              NOT: ActorMoviesEdgeListWhere
              OR: [ActorMoviesEdgeListWhere!]
              edges: ActorMoviesEdgeWhere
            }

            input ActorMoviesEdgeSort {
              node: MovieSort
              properties: ActedInSort
            }

            input ActorMoviesEdgeWhere {
              AND: [ActorMoviesEdgeWhere!]
              NOT: ActorMoviesEdgeWhere
              OR: [ActorMoviesEdgeWhere!]
              node: MovieWhere
              properties: ActedInWhere
            }

            input ActorMoviesNestedOperationWhere {
              AND: [ActorMoviesNestedOperationWhere!]
              NOT: ActorMoviesNestedOperationWhere
              OR: [ActorMoviesNestedOperationWhere!]
              all: ActorMoviesEdgeListWhere
              none: ActorMoviesEdgeListWhere
              single: ActorMoviesEdgeListWhere
              some: ActorMoviesEdgeListWhere
            }

            type ActorMoviesOperation {
              connection(after: String, first: Int, sort: [ActorMoviesConnectionSort!]): ActorMoviesConnection
            }

            input ActorMoviesOperationWhere {
              AND: [ActorMoviesOperationWhere!]
              NOT: ActorMoviesOperationWhere
              OR: [ActorMoviesOperationWhere!]
              edges: ActorMoviesEdgeWhere
            }

            type ActorOperation {
              connection(after: String, first: Int, sort: [ActorConnectionSort!]): ActorConnection
            }

            input ActorOperationWhere {
              AND: [ActorOperationWhere!]
              NOT: ActorOperationWhere
              OR: [ActorOperationWhere!]
              node: ActorWhere
            }

            input ActorSort {
              name: SortDirection
            }

            input ActorUpdateInput {
              node: ActorUpdateNode!
            }

            input ActorUpdateNode {
              name: StringUpdate
            }

            type ActorUpdateResponse {
              actors: [Actor!]!
              info: ActorCreateInfo
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              movies: ActorMoviesNestedOperationWhere
              name: StringWhere
            }

            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type DeleteResponse {
              info: DeleteInfo
            }

            input IntWhere {
              AND: [IntWhere!]
              NOT: IntWhere
              OR: [IntWhere!]
              equals: Int
              gt: Int
              gte: Int
              in: [Int!]
              lt: Int
              lte: Int
            }

            type Movie {
              actors(where: MovieActorsOperationWhere): MovieActorsOperation
              title: String
            }

            type MovieActorsConnection {
              edges: [MovieActorsEdge]
              pageInfo: PageInfo
            }

            input MovieActorsConnectionSort {
              edges: MovieActorsEdgeSort
            }

            input MovieActorsDeleteInput {
              input: ActorDeleteInput
              where: MovieActorsOperationWhere
            }

            input MovieActorsDeleteOperation {
              delete: MovieActorsDeleteInput
            }

            type MovieActorsEdge {
              cursor: String
              node: Actor
              properties: ActedIn
            }

            input MovieActorsEdgeListWhere {
              AND: [MovieActorsEdgeListWhere!]
              NOT: MovieActorsEdgeListWhere
              OR: [MovieActorsEdgeListWhere!]
              edges: MovieActorsEdgeWhere
            }

            input MovieActorsEdgeSort {
              node: ActorSort
              properties: ActedInSort
            }

            input MovieActorsEdgeWhere {
              AND: [MovieActorsEdgeWhere!]
              NOT: MovieActorsEdgeWhere
              OR: [MovieActorsEdgeWhere!]
              node: ActorWhere
              properties: ActedInWhere
            }

            input MovieActorsNestedOperationWhere {
              AND: [MovieActorsNestedOperationWhere!]
              NOT: MovieActorsNestedOperationWhere
              OR: [MovieActorsNestedOperationWhere!]
              all: MovieActorsEdgeListWhere
              none: MovieActorsEdgeListWhere
              single: MovieActorsEdgeListWhere
              some: MovieActorsEdgeListWhere
            }

            type MovieActorsOperation {
              connection(after: String, first: Int, sort: [MovieActorsConnectionSort!]): MovieActorsConnection
            }

            input MovieActorsOperationWhere {
              AND: [MovieActorsOperationWhere!]
              NOT: MovieActorsOperationWhere
              OR: [MovieActorsOperationWhere!]
              edges: MovieActorsEdgeWhere
            }

            type MovieConnection {
              edges: [MovieEdge]
              pageInfo: PageInfo
            }

            input MovieConnectionSort {
              node: MovieSort
            }

            type MovieCreateInfo {
              nodesCreated: Int!
              nodesDelete: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            input MovieCreateInput {
              node: MovieCreateNode!
            }

            input MovieCreateNode {
              title: String
            }

            type MovieCreateResponse {
              info: CreateInfo
              movies: [Movie!]!
            }

            input MovieDeleteInput {
              node: MovieDeleteNode
            }

            input MovieDeleteNode {
              actors: MovieActorsDeleteOperation
            }

            type MovieEdge {
              cursor: String
              node: Movie
            }

            type MovieOperation {
              connection(after: String, first: Int, sort: [MovieConnectionSort!]): MovieConnection
            }

            input MovieOperationWhere {
              AND: [MovieOperationWhere!]
              NOT: MovieOperationWhere
              OR: [MovieOperationWhere!]
              node: MovieWhere
            }

            input MovieSort {
              title: SortDirection
            }

            input MovieUpdateInput {
              node: MovieUpdateNode!
            }

            input MovieUpdateNode {
              title: StringUpdate
            }

            type MovieUpdateResponse {
              info: MovieCreateInfo
              movies: [Movie!]!
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              actors: MovieActorsNestedOperationWhere
              title: StringWhere
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): ActorCreateResponse
              createMovies(input: [MovieCreateInput!]!): MovieCreateResponse
              deleteActors(input: ActorDeleteInput, where: ActorOperationWhere): DeleteResponse
              deleteMovies(input: MovieDeleteInput, where: MovieOperationWhere): DeleteResponse
              updateActors(input: ActorUpdateInput!, where: ActorOperationWhere): ActorUpdateResponse
              updateMovies(input: MovieUpdateInput!, where: MovieOperationWhere): MovieUpdateResponse
            }

            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              actors(where: ActorOperationWhere): ActorOperation
              movies(where: MovieOperationWhere): MovieOperation
            }

            enum SortDirection {
              ASC
              DESC
            }

            input StringUpdate {
              set: String
            }

            input StringWhere {
              AND: [StringWhere!]
              NOT: StringWhere
              OR: [StringWhere!]
              contains: String
              endsWith: String
              equals: String
              in: [String!]
              startsWith: String
            }"
        `);
    });
});
