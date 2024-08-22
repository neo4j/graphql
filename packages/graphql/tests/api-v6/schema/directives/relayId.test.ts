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

describe("RelayId", () => {
    test("relayId in a field", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                dbId: ID! @relayId
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

            input GlobalIdWhere {
              equals: String
            }

            input IDUpdate {
              set: ID
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

            type Movie implements Node {
              dbId: ID!
              id: ID!
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
              nodesDelete: Int!
              relationshipsCreated: Int!
              relationshipsDeleted: Int!
            }

            input MovieCreateInput {
              node: MovieCreateNode!
            }

            input MovieCreateNode {
              dbId: ID!
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
              _emptyInput: Boolean
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
              dbId: SortDirection
              title: SortDirection
            }

            input MovieUpdateInput {
              node: MovieUpdateNode!
            }

            input MovieUpdateNode {
              dbId: IDUpdate
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
              dbId: IDWhere
              id: GlobalIdWhere
              title: StringWhere
            }

            type Mutation {
              createMovies(input: [MovieCreateInput!]!): MovieCreateResponse
              deleteMovies(input: MovieDeleteInput, where: MovieOperationWhere): DeleteResponse
              updateMovies(input: MovieUpdateInput!, where: MovieOperationWhere): MovieUpdateResponse
            }

            interface Node {
              id: ID!
            }

            type PageInfo {
              endCursor: String
              hasNextPage: Boolean!
              hasPreviousPage: Boolean!
              startCursor: String
            }

            type Query {
              movies(where: MovieOperationWhere): MovieOperation
              \\"\\"\\"Fetches an object given its ID\\"\\"\\"
              node(id: ID!): Node
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
