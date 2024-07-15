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

describe("@unique", () => {
    test("@unique", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                dbId: ID! @unique(constraintName: "UniqueMovieDbId")
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

          type Movie {
            dbId: ID!
            title: String
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
            connection(after: String, first: Int, sort: MovieConnectionSort): MovieConnection
          }

          input MovieOperationWhere {
            AND: [MovieOperationWhere!]
            NOT: MovieOperationWhere
            OR: [MovieOperationWhere!]
            edges: MovieEdgeWhere
          }

          input MovieSort {
            dbId: SortDirection
            title: SortDirection
          }

          input MovieWhere {
            AND: [MovieWhere!]
            NOT: MovieWhere
            OR: [MovieWhere!]
            dbId: IDWhere
            title: StringWhere
          }

          type PageInfo {
            endCursor: String
            hasNextPage: Boolean
            hasPreviousPage: Boolean
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

    test("@unique applied multiple times with same constraint name", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                dbId: ID! @unique(constraintName: "UniqueMovieDbId")
                title: String @unique(constraintName: "UniqueMovieDbId")
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getAuraSchema();
        raiseOnInvalidSchema(schema);
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
        expect(printedSchema).toMatchInlineSnapshot(`
        "schema {
          query: Query
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

        type Movie {
          dbId: ID!
          title: String
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
          connection(after: String, first: Int, sort: MovieConnectionSort): MovieConnection
        }

        input MovieOperationWhere {
          AND: [MovieOperationWhere!]
          NOT: MovieOperationWhere
          OR: [MovieOperationWhere!]
          edges: MovieEdgeWhere
        }

        input MovieSort {
          dbId: SortDirection
          title: SortDirection
        }

        input MovieWhere {
          AND: [MovieWhere!]
          NOT: MovieWhere
          OR: [MovieWhere!]
          dbId: IDWhere
          title: StringWhere
        }

        type PageInfo {
          endCursor: String
          hasNextPage: Boolean
          hasPreviousPage: Boolean
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
