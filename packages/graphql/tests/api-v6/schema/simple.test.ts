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

describe("Simple Aura-API", () => {
    test("single type", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
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

            type Movie {
              title: String
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
              relationshipsCreated: Int!
            }

            input MovieCreateInput {
              node: MovieCreateNode!
            }

            input MovieCreateNode {
              title: String
            }

            type MovieCreateResponse {
              info: MovieCreateInfo
              movies: [Movie!]!
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

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              title: StringWhere
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): MovieCreateResponse
            }

            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
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
              startsWith: String
            }"
        `);
    });

    test("multiple types", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
            }
            type Actor @node {
                name: String
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
              relationshipsCreated: Int!
            }

            input ActorCreateInput {
              node: ActorCreateNode!
            }

            input ActorCreateNode {
              name: String
            }

            type ActorCreateResponse {
              actors: [Actor!]!
              info: ActorCreateInfo
            }

            type ActorEdge {
              cursor: String
              node: Actor
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

            input ActorWhere {
              AND: [ActorWhere!]
              NOT: ActorWhere
              OR: [ActorWhere!]
              name: StringWhere
            }

            type Movie {
              title: String
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
              relationshipsCreated: Int!
            }

            input MovieCreateInput {
              node: MovieCreateNode!
            }

            input MovieCreateNode {
              title: String
            }

            type MovieCreateResponse {
              info: MovieCreateInfo
              movies: [Movie!]!
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

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              title: StringWhere
            }

            type Mutation {
              createActors(input: [ActorCreateInput!]!): ActorCreateResponse
              createMovies(input: [MovieCreateInput!]!): MovieCreateResponse
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

    test("should ignore types without the @node directive", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
            }
            type AnotherNode {
                name: String
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

            type Movie {
              title: String
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
              relationshipsCreated: Int!
            }

            input MovieCreateInput {
              node: MovieCreateNode!
            }

            input MovieCreateNode {
              title: String
            }

            type MovieCreateResponse {
              info: MovieCreateInfo
              movies: [Movie!]!
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

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              title: StringWhere
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): MovieCreateResponse
            }

            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
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
              startsWith: String
            }"
        `);
    });
});
