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

describe("@query directive", () => {
    describe("on OBJECT", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie @query {
                    title: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();
            const queryFields = schema.getQueryType()?.getFields() as GraphQLFieldMap<any, any>;

            const movies = queryFields["movies"];
            const actors = queryFields["actors"];

            expect(movies).toBeDefined();
            expect(actors).toBeDefined();

            const moviesConnection = queryFields["moviesConnection"];
            const actorsConnection = queryFields["actorsConnection"];

            expect(moviesConnection).toBeDefined();
            expect(actorsConnection).toBeDefined();

            const moviesAggregate = queryFields["moviesAggregate"];
            const actorsAggregate = queryFields["actorsAggregate"];

            expect(moviesAggregate).toBeUndefined();
            expect(actorsAggregate).toBeDefined();
        });

        test("should enable aggregation", async () => {
            const typeDefs = gql`
                type Actor @query(aggregate: true) {
                    username: String!
                    password: String!
                }

                type Movie {
                    title: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const queryFields = schema.getQueryType()?.getFields() as GraphQLFieldMap<any, any>;

            const movies = queryFields["movies"];
            const actors = queryFields["actors"];

            expect(movies).toBeDefined();
            expect(actors).toBeDefined();

            const moviesConnection = queryFields["moviesConnection"];
            const actorsConnection = queryFields["actorsConnection"];

            expect(moviesConnection).toBeDefined();
            expect(actorsConnection).toBeDefined();

            const moviesAggregate = queryFields["moviesAggregate"];
            const actorsAggregate = queryFields["actorsAggregate"];

            expect(moviesAggregate).toBeDefined();
            expect(actorsAggregate).toBeDefined();
        });

        test("should disable read and aggregate for Actor", async () => {
            const typeDefs = gql`
                type Actor @query(read: false, aggregate: false) {
                    name: String
                }

                type Movie {
                    title: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const schema = await neoSchema.getSchema();
            const queryFields = schema.getQueryType()?.getFields() as GraphQLFieldMap<any, any>;

            const movies = queryFields["movies"];
            const actors = queryFields["actors"];

            expect(movies).toBeDefined();
            expect(actors).toBeUndefined();

            const moviesConnection = queryFields["moviesConnection"];
            const actorsConnection = queryFields["actorsConnection"];

            expect(moviesConnection).toBeDefined();
            expect(actorsConnection).toBeUndefined();

            const moviesAggregate = queryFields["moviesAggregate"];
            const actorsAggregate = queryFields["actorsAggregate"];

            expect(moviesAggregate).toBeDefined();
            expect(actorsAggregate).toBeUndefined();
        });

        test("should disable read and enable aggregate for Actor", async () => {
            const typeDefs = gql`
                type Actor @query(read: false, aggregate: true) {
                    name: String
                }

                type Movie {
                    title: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const schema = await neoSchema.getSchema();
            const queryFields = schema.getQueryType()?.getFields() as GraphQLFieldMap<any, any>;

            const movies = queryFields["movies"];
            const actors = queryFields["actors"];

            expect(movies).toBeDefined();
            expect(actors).toBeUndefined();

            const moviesConnection = queryFields["moviesConnection"];
            const actorsConnection = queryFields["actorsConnection"];

            expect(moviesConnection).toBeDefined();
            expect(actorsConnection).toBeUndefined();

            const moviesAggregate = queryFields["moviesAggregate"];
            const actorsAggregate = queryFields["actorsAggregate"];

            expect(moviesAggregate).toBeDefined();
            expect(actorsAggregate).toBeDefined();
        });
    });

    describe("on SCHEMA", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie {
                    title: String
                }
                extend schema @query
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();
            const queryFields = schema.getQueryType()?.getFields() as GraphQLFieldMap<any, any>;

            const movies = queryFields["movies"];
            const actors = queryFields["actors"];

            expect(movies).toBeDefined();
            expect(actors).toBeDefined();

            const moviesConnection = queryFields["moviesConnection"];
            const actorsConnection = queryFields["actorsConnection"];

            expect(moviesConnection).toBeDefined();
            expect(actorsConnection).toBeDefined();

            const moviesAggregate = queryFields["moviesAggregate"];
            const actorsAggregate = queryFields["actorsAggregate"];

            expect(moviesAggregate).toBeUndefined();
            expect(actorsAggregate).toBeUndefined();
        });

        test("should enable aggregation", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                }

                type Movie {
                    title: String
                }

                extend schema @query(aggregate: true)
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();

            const queryFields = schema.getQueryType()?.getFields() as GraphQLFieldMap<any, any>;

            const movies = queryFields["movies"];
            const actors = queryFields["actors"];

            expect(movies).toBeDefined();
            expect(actors).toBeDefined();

            const moviesConnection = queryFields["moviesConnection"];
            const actorsConnection = queryFields["actorsConnection"];

            expect(moviesConnection).toBeDefined();
            expect(actorsConnection).toBeDefined();

            const moviesAggregate = queryFields["moviesAggregate"];
            const actorsAggregate = queryFields["actorsAggregate"];

            expect(moviesAggregate).toBeDefined();
            expect(actorsAggregate).toBeDefined();
        });

        test("should disable read and aggregate", async () => {
            const typeDefs = gql`
                type Actor {
                    name: String
                }

                type Movie {
                    title: String
                }
                extend schema @query(read: false, aggregate: false)
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const schema = await neoSchema.getSchema();
            const queryFields = schema.getQueryType()?.getFields() as GraphQLFieldMap<any, any>;

            const movies = queryFields["movies"];
            const actors = queryFields["actors"];

            expect(movies).toBeUndefined();
            expect(actors).toBeUndefined();

            const moviesConnection = queryFields["moviesConnection"];
            const actorsConnection = queryFields["actorsConnection"];

            expect(moviesConnection).toBeUndefined();
            expect(actorsConnection).toBeUndefined();

            const moviesAggregate = queryFields["moviesAggregate"];
            const actorsAggregate = queryFields["actorsAggregate"];

            expect(moviesAggregate).toBeUndefined();
            expect(actorsAggregate).toBeUndefined();
        });

        test("should disable read and enable aggregate", async () => {
            const typeDefs = gql`
                type Actor {
                    name: String
                }

                type Movie {
                    title: String
                }

                extend schema @query(read: false, aggregate: true)
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const schema = await neoSchema.getSchema();
            const queryFields = schema.getQueryType()?.getFields() as GraphQLFieldMap<any, any>;

            const movies = queryFields["movies"];
            const actors = queryFields["actors"];

            expect(movies).toBeUndefined();
            expect(actors).toBeUndefined();

            const moviesConnection = queryFields["moviesConnection"];
            const actorsConnection = queryFields["actorsConnection"];

            expect(moviesConnection).toBeUndefined();
            expect(actorsConnection).toBeUndefined();

            const moviesAggregate = queryFields["moviesAggregate"];
            const actorsAggregate = queryFields["actorsAggregate"];

            expect(moviesAggregate).toBeDefined();
            expect(actorsAggregate).toBeDefined();
        });

        test("should throw an Error when is used in both schema on object", async () => {
            const typeDefs = gql`
                type Actor @query(read: true, aggregate: true) {
                    name: String
                }

                type Movie {
                    title: String
                }

                extend schema @query(read: false, aggregate: true)
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await expect(async () => {
                await neoSchema.getSchema();
            }).rejects.toIncludeSameMembers([
                new GraphQLError(
                    "Invalid directive usage: Directive @query can only be used in one location: either schema or type."
                ),
            ]);
        });
    });
});
