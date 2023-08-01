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

import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import type { GraphQLFieldMap } from "graphql";
import { GraphQLError } from "graphql";

describe("@mutation directive", () => {
    describe("on OBJECT", () => {
        test("default arguments should enable CREATE, UPDATE, DELETE", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie @mutation {
                    title: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();
            const mutationFields = schema.getMutationType()?.getFields() as GraphQLFieldMap<any, any>;

            const createMovies = mutationFields["createMovies"];
            const createActors = mutationFields["createActors"];

            expect(createMovies).toBeDefined();
            expect(createActors).toBeDefined();

            const updateMovies = mutationFields["updateMovies"];
            const updateActors = mutationFields["updateActors"];

            expect(updateMovies).toBeDefined();
            expect(updateActors).toBeDefined();

            const deleteMovies = mutationFields["deleteMovies"];
            const deleteActors = mutationFields["deleteActors"];

            expect(deleteMovies).toBeDefined();
            expect(deleteActors).toBeDefined();
        });

        test("should disable CREATE", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie @mutation(operations: [UPDATE, DELETE]) {
                    title: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();
            const mutationFields = schema.getMutationType()?.getFields() as GraphQLFieldMap<any, any>;

            const createMovies = mutationFields["createMovies"];
            const createActors = mutationFields["createActors"];

            expect(createMovies).toBeUndefined();
            expect(createActors).toBeDefined();

            const updateMovies = mutationFields["updateMovies"];
            const updateActors = mutationFields["updateActors"];

            expect(updateMovies).toBeDefined();
            expect(updateActors).toBeDefined();

            const deleteMovies = mutationFields["deleteMovies"];
            const deleteActors = mutationFields["deleteActors"];

            expect(deleteMovies).toBeDefined();
            expect(deleteActors).toBeDefined();
        });

        test("should disable UPDATE", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie @mutation(operations: [CREATE, DELETE]) {
                    title: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const mutationFields = schema.getMutationType()?.getFields() as GraphQLFieldMap<any, any>;

            const createMovies = mutationFields["createMovies"];
            const createActors = mutationFields["createActors"];

            expect(createMovies).toBeDefined();
            expect(createActors).toBeDefined();

            const updateMovies = mutationFields["updateMovies"];
            const updateActors = mutationFields["updateActors"];

            expect(updateMovies).toBeUndefined();
            expect(updateActors).toBeDefined();

            const deleteMovies = mutationFields["deleteMovies"];
            const deleteActors = mutationFields["deleteActors"];

            expect(deleteMovies).toBeDefined();
            expect(deleteActors).toBeDefined();
        });

        test("should disable DELETE", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie @mutation(operations: [CREATE, UPDATE]) {
                    title: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const mutationFields = schema.getMutationType()?.getFields() as GraphQLFieldMap<any, any>;

            const createMovies = mutationFields["createMovies"];
            const createActors = mutationFields["createActors"];

            expect(createMovies).toBeDefined();
            expect(createActors).toBeDefined();

            const updateMovies = mutationFields["updateMovies"];
            const updateActors = mutationFields["updateActors"];

            expect(updateMovies).toBeDefined();
            expect(updateActors).toBeDefined();

            const deleteMovies = mutationFields["deleteMovies"];
            const deleteActors = mutationFields["deleteActors"];

            expect(deleteMovies).toBeUndefined();
            expect(deleteActors).toBeDefined();
        });

        test("should disable CREATE, DELETE, UPDATE", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie @mutation(operations: []) {
                    title: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const mutationFields = schema.getMutationType()?.getFields() as GraphQLFieldMap<any, any>;

            const createMovies = mutationFields["createMovies"];
            const createActors = mutationFields["createActors"];

            expect(createMovies).toBeUndefined();
            expect(createActors).toBeDefined();

            const updateMovies = mutationFields["updateMovies"];
            const updateActors = mutationFields["updateActors"];

            expect(updateMovies).toBeUndefined();
            expect(updateActors).toBeDefined();

            const deleteMovies = mutationFields["deleteMovies"];
            const deleteActors = mutationFields["deleteActors"];

            expect(deleteMovies).toBeUndefined();
            expect(deleteActors).toBeDefined();
        });

        test("should not throw an Error when is mixed with @query", async () => {
            const typeDefs = gql`
                type Actor {
                    name: String
                }

                type Movie @query(read: true) @mutation(operations: []) {
                    title: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const schema = await neoSchema.getSchema();
            expect(schema).toBeDefined();
        });
    });

    describe("on SCHEMA", () => {
        test("default arguments should enable CREATE, UPDATE, DELETE", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie {
                    title: String
                }
                extend schema @mutation
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();
            const mutationFields = schema.getMutationType()?.getFields() as GraphQLFieldMap<any, any>;

            const createMovies = mutationFields["createMovies"];
            const createActors = mutationFields["createActors"];

            expect(createMovies).toBeDefined();
            expect(createActors).toBeDefined();

            const updateMovies = mutationFields["updateMovies"];
            const updateActors = mutationFields["updateActors"];

            expect(updateMovies).toBeDefined();
            expect(updateActors).toBeDefined();

            const deleteMovies = mutationFields["deleteMovies"];
            const deleteActors = mutationFields["deleteActors"];

            expect(deleteMovies).toBeDefined();
            expect(deleteActors).toBeDefined();
        });

        test("should disable CREATE", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie {
                    title: String
                }
                extend schema @mutation(operations: [UPDATE, DELETE])
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();
            const mutationFields = schema.getMutationType()?.getFields() as GraphQLFieldMap<any, any>;

            const createMovies = mutationFields["createMovies"];
            const createActors = mutationFields["createActors"];

            expect(createMovies).toBeUndefined();
            expect(createActors).toBeUndefined();

            const updateMovies = mutationFields["updateMovies"];
            const updateActors = mutationFields["updateActors"];

            expect(updateMovies).toBeDefined();
            expect(updateActors).toBeDefined();

            const deleteMovies = mutationFields["deleteMovies"];
            const deleteActors = mutationFields["deleteActors"];

            expect(deleteMovies).toBeDefined();
            expect(deleteActors).toBeDefined();
        });

        test("should disable UPDATE", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie {
                    title: String
                }
                extend schema @mutation(operations: [CREATE, DELETE])
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const mutationFields = schema.getMutationType()?.getFields() as GraphQLFieldMap<any, any>;

            const createMovies = mutationFields["createMovies"];
            const createActors = mutationFields["createActors"];

            expect(createMovies).toBeDefined();
            expect(createActors).toBeDefined();

            const updateMovies = mutationFields["updateMovies"];
            const updateActors = mutationFields["updateActors"];

            expect(updateMovies).toBeUndefined();
            expect(updateActors).toBeUndefined();

            const deleteMovies = mutationFields["deleteMovies"];
            const deleteActors = mutationFields["deleteActors"];

            expect(deleteMovies).toBeDefined();
            expect(deleteActors).toBeDefined();
        });

        test("should disable DELETE", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie {
                    title: String
                }
                extend schema @mutation(operations: [CREATE, UPDATE])
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const mutationFields = schema.getMutationType()?.getFields() as GraphQLFieldMap<any, any>;

            const createMovies = mutationFields["createMovies"];
            const createActors = mutationFields["createActors"];

            expect(createMovies).toBeDefined();
            expect(createActors).toBeDefined();

            const updateMovies = mutationFields["updateMovies"];
            const updateActors = mutationFields["updateActors"];

            expect(updateMovies).toBeDefined();
            expect(updateActors).toBeDefined();

            const deleteMovies = mutationFields["deleteMovies"];
            const deleteActors = mutationFields["deleteActors"];

            expect(deleteMovies).toBeUndefined();
            expect(deleteActors).toBeUndefined();
        });

        test("should disable CREATE, DELETE, UPDATE", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie {
                    title: String
                }
                extend schema @mutation(operations: [])
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const mutationType = schema.getMutationType();
            expect(mutationType).toBeUndefined();
        });

        test("should throw an Error when is used in both schema on object", async () => {
            const typeDefs = gql`
                type Actor @mutation(operations: []) {
                    name: String
                }

                type Movie {
                    title: String
                }

                extend schema @mutation(operations: [])
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await expect(async () => {
                await neoSchema.getSchema();
            }).rejects.toIncludeSameMembers([
                new GraphQLError(
                    "Invalid directive usage: Directive @mutation can only be used in one location: either schema or type."
                ),
            ]);
        });

        test("should not throw an Error when is mixed with @query", async () => {
            const typeDefs = gql`
                type Actor {
                    name: String
                }

                type Movie {
                    title: String
                }

                extend schema @query(read: true) @mutation(operations: [])
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const schema = await neoSchema.getSchema();
            expect(schema).toBeDefined();
        });
    });
});
