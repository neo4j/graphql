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

describe("Simple Aura-API", () => {
    test("single type", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie {
                title: String
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getAuraSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
            }

            type Movie {
              title: String
            }

            type MovieConnection {
              edges: [MovieEdge]
              pageInfo: PageInfo
            }

            type MovieEdge {
              cursor: String
              node: Movie
            }

            type MovieOperation {
              connection: MovieConnection
            }

            type PageInfo {
              hasNextPage: Boolean
              hasPreviousPage: Boolean
            }

            type Query {
              movies: MovieOperation
            }"
        `);
    });

    test("multiple types", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie {
                title: String
            }
            type Actor {
                name: String
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(await neoSchema.getAuraSchema()));

        expect(printedSchema).toMatchInlineSnapshot(`
            "schema {
              query: Query
            }

            type Actor {
              name: String
            }

            type ActorConnection {
              edges: [ActorEdge]
              pageInfo: PageInfo
            }

            type ActorEdge {
              cursor: String
              node: Actor
            }

            type ActorOperation {
              connection: ActorConnection
            }

            type Movie {
              title: String
            }

            type MovieConnection {
              edges: [MovieEdge]
              pageInfo: PageInfo
            }

            type MovieEdge {
              cursor: String
              node: Movie
            }

            type MovieOperation {
              connection: MovieConnection
            }

            type PageInfo {
              hasNextPage: Boolean
              hasPreviousPage: Boolean
            }

            type Query {
              actors: ActorOperation
              movies: MovieOperation
            }"
        `);
    });
});
