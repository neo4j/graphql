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
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getAuraSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
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
              edges: [ActorEdgeSort!]
            }

            type ActorEdge {
              cursor: String
              node: Actor
            }

            input ActorEdgeSort {
              node: ActorSort
            }

            input ActorEdgeWhere {
              AND: [ActorEdgeWhere!]
              NOT: ActorEdgeWhere
              OR: [ActorEdgeWhere!]
              node: ActorWhere
            }

            type ActorMoviesConnection {
              edges: [ActorMoviesEdge]
              pageInfo: PageInfo
            }

            input ActorMoviesConnectionSort {
              edges: [ActorMoviesEdgeSort!]
            }

            type ActorMoviesEdge {
              cursor: String
              node: Movie
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

            type ActorMoviesOperation {
              connection(sort: ActorMoviesConnectionSort): ActorMoviesConnection
            }

            input ActorMoviesOperationWhere {
              AND: [ActorMoviesOperationWhere!]
              NOT: ActorMoviesOperationWhere
              OR: [ActorMoviesOperationWhere!]
              edges: ActorMoviesEdgeWhere
            }

            type ActorOperation {
              connection(sort: ActorConnectionSort): ActorConnection
            }

            input ActorOperationWhere {
              AND: [ActorOperationWhere!]
              NOT: ActorOperationWhere
              OR: [ActorOperationWhere!]
              edges: ActorEdgeWhere
            }

            input ActorSort {
              name: SortDirection
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              name: StringWhere
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
              edges: [MovieActorsEdgeSort!]
            }

            type MovieActorsEdge {
              cursor: String
              node: Actor
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

            type MovieActorsOperation {
              connection(sort: MovieActorsConnectionSort): MovieActorsConnection
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
              edges: [MovieEdgeSort!]
            }

            type MovieEdge {
              cursor: String
              node: Movie
            }

            input MovieEdgeSort {
              node: MovieSort
            }

            input MovieEdgeWhere {
              AND: [MovieEdgeWhere!]
              NOT: MovieEdgeWhere
              OR: [MovieEdgeWhere!]
              node: MovieWhere
            }

            type MovieOperation {
              connection(sort: MovieConnectionSort): MovieConnection
            }

            input MovieOperationWhere {
              AND: [MovieOperationWhere!]
              NOT: MovieOperationWhere
              OR: [MovieOperationWhere!]
              edges: MovieEdgeWhere
            }

            input MovieSort {
              title: SortDirection
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              title: StringWhere
            }

            type PageInfo {
              hasNextPage: Boolean
              hasPreviousPage: Boolean
            }

            type Query {
              actors(where: ActorOperationWhere): ActorOperation
              movies(where: MovieOperationWhere): MovieOperation
            }

            enum SortDirection {
              ASC
              DESC
            }

            input StringWhere {
              AND: [StringWhere!]
              NOT: StringWhere
              OR: [StringWhere!]
              contains: String
              endsWith: String
              equals: String
              in: [String!]
              matches: String
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
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getAuraSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
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
              edges: [ActorEdgeSort!]
            }

            type ActorEdge {
              cursor: String
              node: Actor
            }

            input ActorEdgeSort {
              node: ActorSort
            }

            input ActorEdgeWhere {
              AND: [ActorEdgeWhere!]
              NOT: ActorEdgeWhere
              OR: [ActorEdgeWhere!]
              node: ActorWhere
            }

            type ActorMoviesConnection {
              edges: [ActorMoviesEdge]
              pageInfo: PageInfo
            }

            input ActorMoviesConnectionSort {
              edges: [ActorMoviesEdgeSort!]
            }

            type ActorMoviesEdge {
              cursor: String
              node: Movie
              properties: ActedIn
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

            type ActorMoviesOperation {
              connection(sort: ActorMoviesConnectionSort): ActorMoviesConnection
            }

            input ActorMoviesOperationWhere {
              AND: [ActorMoviesOperationWhere!]
              NOT: ActorMoviesOperationWhere
              OR: [ActorMoviesOperationWhere!]
              edges: ActorMoviesEdgeWhere
            }

            type ActorOperation {
              connection(sort: ActorConnectionSort): ActorConnection
            }

            input ActorOperationWhere {
              AND: [ActorOperationWhere!]
              NOT: ActorOperationWhere
              OR: [ActorOperationWhere!]
              edges: ActorEdgeWhere
            }

            input ActorSort {
              name: SortDirection
            }

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              name: StringWhere
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
              edges: [MovieActorsEdgeSort!]
            }

            type MovieActorsEdge {
              cursor: String
              node: Actor
              properties: ActedIn
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

            type MovieActorsOperation {
              connection(sort: MovieActorsConnectionSort): MovieActorsConnection
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
              edges: [MovieEdgeSort!]
            }

            type MovieEdge {
              cursor: String
              node: Movie
            }

            input MovieEdgeSort {
              node: MovieSort
            }

            input MovieEdgeWhere {
              AND: [MovieEdgeWhere!]
              NOT: MovieEdgeWhere
              OR: [MovieEdgeWhere!]
              node: MovieWhere
            }

            type MovieOperation {
              connection(sort: MovieConnectionSort): MovieConnection
            }

            input MovieOperationWhere {
              AND: [MovieOperationWhere!]
              NOT: MovieOperationWhere
              OR: [MovieOperationWhere!]
              edges: MovieEdgeWhere
            }

            input MovieSort {
              title: SortDirection
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              title: StringWhere
            }

            type PageInfo {
              hasNextPage: Boolean
              hasPreviousPage: Boolean
            }

            type Query {
              actors(where: ActorOperationWhere): ActorOperation
              movies(where: MovieOperationWhere): MovieOperation
            }

            enum SortDirection {
              ASC
              DESC
            }

            input StringWhere {
              AND: [StringWhere!]
              NOT: StringWhere
              OR: [StringWhere!]
              contains: String
              endsWith: String
              equals: String
              in: [String!]
              matches: String
              startsWith: String
            }"
        `);
    });
});
