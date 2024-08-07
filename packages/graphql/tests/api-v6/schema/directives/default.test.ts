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

describe("@default on fields", () => {
    test("@default should add a default value in mutation inputs", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                id: ID! @default(value: "id")
                title: String @default(value: "title")
                year: Int @default(value: 2021)
                length: Float @default(value: 120.5)
                flag: Boolean @default(value: true)
                releasedDateTime: DateTime @default(value: "2021-01-01T00:00:00")
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

            input DateTimeWhere {
              AND: [DateTimeWhere!]
              NOT: DateTimeWhere
              OR: [DateTimeWhere!]
              equals: DateTime
              gt: DateTime
              gte: DateTime
              in: [DateTime!]
              lt: DateTime
              lte: DateTime
            }

            type DeleteInfo {
              nodesDeleted: Int!
              relationshipsDeleted: Int!
            }

            input FloatWhere {
              AND: [FloatWhere!]
              NOT: FloatWhere
              OR: [FloatWhere!]
              equals: Float
              gt: Float
              gte: Float
              in: [Float!]
              lt: Float
              lte: Float
            }

            input IDWhere {
              AND: [IDWhere!]
              NOT: IDWhere
              OR: [IDWhere!]
              contains: ID
              endsWith: ID
              equals: ID
              in: [ID!]
              startsWith: ID
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
              flag: Boolean
              id: ID!
              length: Float
              releasedDateTime: DateTime
              title: String
              year: Int
            }

            type MovieConnection {
              edges: [MovieEdge]
              pageInfo: PageInfo
            }

            input MovieConnectionSort {
              node: MovieSort
            }

            input MovieCreateInput {
              node: MovieCreateNode!
            }

            input MovieCreateNode {
              flag: Boolean = true
              id: ID! = \\"id\\"
              length: Float = 120.5
              releasedDateTime: DateTime = \\"2021-01-01T00:00:00.000Z\\"
              title: String = \\"title\\"
              year: Int = 2021
            }

            type MovieCreateResponse {
              info: CreateInfo
              movies: [Movie!]!
            }

            type MovieDeleteResponse {
              info: DeleteInfo
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
              flag: SortDirection
              id: SortDirection
              length: SortDirection
              releasedDateTime: SortDirection
              title: SortDirection
              year: SortDirection
            }

            input MovieWhere {
              AND: [MovieWhere!]
              NOT: MovieWhere
              OR: [MovieWhere!]
              flag: BooleanWhere
              id: IDWhere
              length: FloatWhere
              releasedDateTime: DateTimeWhere
              title: StringWhere
              year: IntWhere
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): MovieCreateResponse
              deleteMovies(where: MovieOperationWhere): MovieDeleteResponse
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

    test.todo("@default directive with relationship properties");
    test.todo("@default directive with user defined scalars");
});
