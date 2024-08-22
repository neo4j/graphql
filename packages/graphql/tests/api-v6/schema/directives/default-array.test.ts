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
import { Neo4jGraphQL } from "../../../../src";
import { raiseOnInvalidSchema } from "../../../utils/raise-on-invalid-schema";

describe("@default on array fields", () => {
    test("@default should add a default value in mutation inputs", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                id: [ID!]! @default(value: ["id"])
                title: [String!] @default(value: ["title"])
                year: [Int!] @default(value: [2021])
                length: [Float!] @default(value: [120.5])
                releasedDateTime: [DateTime!] @default(value: ["2021-01-01T00:00:00"])
                flags: [Boolean!] @default(value: [true, false])
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

            input BooleanWhere {
              AND: [BooleanWhere!]
              NOT: BooleanWhere
              OR: [BooleanWhere!]
              equals: Boolean
            }

            type CreateInfo {
              nodesCreated: Int!
              relationshipsCreated: Int!
            }

            \\"\\"\\"A date and time, represented as an ISO-8601 string\\"\\"\\"
            scalar DateTime

            input DateTimeListWhere {
              equals: [DateTime!]
            }

            input DateTimeUpdate {
              set: DateTime
            }

            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            type DeleteResponse {
              info: DeleteInfo
            }

            input FloatListWhere {
              equals: [Float!]
            }

            input FloatUpdate {
              set: Float
            }

            input IDListWhere {
              equals: [ID!]
            }

            input IDUpdate {
              set: ID
            }

            input IntListWhere {
              equals: [Int!]
            }

            input IntUpdate {
              set: Int
            }

            type Movie {
              flags: [Boolean!]
              id: [ID!]!
              length: [Float!]
              releasedDateTime: [DateTime!]
              title: [String!]
              year: [Int!]
            }

            type MovieConnection {
              edges: [MovieEdge]
              pageInfo: PageInfo
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
              flags: [Boolean!] = [true, false]
              id: [ID!]! = [\\"id\\"]
              length: [Float!] = [120.5]
              releasedDateTime: [DateTime!] = [\\"2021-01-01T00:00:00.000Z\\"]
              title: [String!] = [\\"title\\"]
              year: [Int!] = [2021]
            }

            type MovieCreateResponse {
              info: CreateInfo
              movies: [Movie!]!
            }

            input MovieDeleteInput {
              node: MovieDeleteNode
            }

            input MovieDeleteNode {
              _emptyInput: Boolean
            }

            type MovieEdge {
              cursor: String
              node: Movie
            }

            type MovieOperation {
              connection(after: String, first: Int): MovieConnection
            }

            input MovieOperationWhere {
              AND: [MovieOperationWhere!]
              NOT: MovieOperationWhere
              OR: [MovieOperationWhere!]
              node: MovieWhere
            }

            input MovieUpdateInput {
              node: MovieUpdateNode!
            }

            input MovieUpdateNode {
              flags: IntUpdate
              id: IDUpdate
              length: FloatUpdate
              releasedDateTime: DateTimeUpdate
              title: StringUpdate
              year: IntUpdate
            }

            type MovieUpdateResponse {
              info: MovieCreateInfo
              movies: [Movie!]!
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              flags: BooleanWhere
              id: IDListWhere
              length: FloatListWhere
              releasedDateTime: DateTimeListWhere
              title: StringListWhere
              year: IntListWhere
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): MovieCreateResponse
              deleteMovies(input: MovieDeleteInput, where: MovieOperationWhere): DeleteResponse
              updateMovies(input: MovieUpdateInput!, where: MovieOperationWhere): MovieUpdateResponse
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

            input StringListWhere {
              equals: [String!]
            }

            input StringUpdate {
              set: String
            }"
        `);
    });
    test.todo("@default directive with relationship properties");
    test.todo("@default directive with user defined scalars");
});
