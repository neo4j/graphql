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
              movies: ActorMoviesOperation
              name: String
            }

            type ActorConnection {
              edges: [ActorEdge]
              pageInfo: PageInfo
            }

            input ActorConnectionSort {
              edges: ActorEdgeSort
            }

            type ActorEdge {
              cursor: String
              node: Actor
            }

            input ActorEdgeSort {
              node: ActorSort
            }

            type ActorMoviesConnection {
              edges: [ActorMoviesEdge]
              pageInfo: PageInfo
            }

            type ActorMoviesEdge {
              cursor: String
              node: Movie
            }

            type ActorMoviesOperation {
              connection: ActorMoviesConnection
            }

            type ActorOperation {
              connection(sort: [ActorConnectionSort!]): ActorConnection
            }

            input ActorSort {
              name: SortDirection
            }

            type Movie {
              actors: MovieActorsOperation
              title: String
            }

            type MovieActorsConnection {
              edges: [MovieActorsEdge]
              pageInfo: PageInfo
            }

            type MovieActorsEdge {
              cursor: String
              node: Actor
            }

            type MovieActorsOperation {
              connection: MovieActorsConnection
            }

            type MovieConnection {
              edges: [MovieEdge]
              pageInfo: PageInfo
            }

            input MovieConnectionSort {
              edges: MovieEdgeSort
            }

            type MovieEdge {
              cursor: String
              node: Movie
            }

            input MovieEdgeSort {
              node: MovieSort
            }

            type MovieOperation {
              connection(sort: [MovieConnectionSort!]): MovieConnection
            }

            input MovieSort {
              title: SortDirection
            }

            type PageInfo {
              hasNextPage: Boolean
              hasPreviousPage: Boolean
            }

            type Query {
              actors: ActorOperation
              movies: MovieOperation
            }

            enum SortDirection {
              ASC
              DESC
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

            type Actor {
              movies: ActorMoviesOperation
              name: String
            }

            type ActorConnection {
              edges: [ActorEdge]
              pageInfo: PageInfo
            }

            input ActorConnectionSort {
              edges: ActorEdgeSort
            }

            type ActorEdge {
              cursor: String
              node: Actor
            }

            input ActorEdgeSort {
              node: ActorSort
            }

            type ActorMoviesConnection {
              edges: [ActorMoviesEdge]
              pageInfo: PageInfo
            }

            type ActorMoviesEdge {
              cursor: String
              node: Movie
              properties: ActedIn
            }

            type ActorMoviesOperation {
              connection: ActorMoviesConnection
            }

            type ActorOperation {
              connection(sort: [ActorConnectionSort!]): ActorConnection
            }

            input ActorSort {
              name: SortDirection
            }

            type Movie {
              actors: MovieActorsOperation
              title: String
            }

            type MovieActorsConnection {
              edges: [MovieActorsEdge]
              pageInfo: PageInfo
            }

            type MovieActorsEdge {
              cursor: String
              node: Actor
              properties: ActedIn
            }

            type MovieActorsOperation {
              connection: MovieActorsConnection
            }

            type MovieConnection {
              edges: [MovieEdge]
              pageInfo: PageInfo
            }

            input MovieConnectionSort {
              edges: MovieEdgeSort
            }

            type MovieEdge {
              cursor: String
              node: Movie
            }

            input MovieEdgeSort {
              node: MovieSort
            }

            type MovieOperation {
              connection(sort: [MovieConnectionSort!]): MovieConnection
            }

            input MovieSort {
              title: SortDirection
            }

            type PageInfo {
              hasNextPage: Boolean
              hasPreviousPage: Boolean
            }

            type Query {
              actors: ActorOperation
              movies: MovieOperation
            }

            enum SortDirection {
              ASC
              DESC
            }"
        `);
    });
});
