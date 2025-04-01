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

import type { GraphQLFieldMap, GraphQLObjectType } from "graphql";
import { GraphQLError } from "graphql";
import { Neo4jGraphQL } from "../../../src";

describe("@query directive", () => {
    describe("on OBJECT", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @node {
                    username: String!
                    password: String!
                }

                type Movie @query @node {
                    title: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();
            const { movies, actors, moviesConnection, actorsConnection } = schema
                .getQueryType()
                ?.getFields() as GraphQLFieldMap<any, any>;

            expect(movies).toBeDefined();
            expect(actors).toBeDefined();

            expect(moviesConnection).toBeDefined();
            expect(actorsConnection).toBeDefined();

            const moviesConnectionType = schema.getType("MoviesConnection") as GraphQLObjectType;
            expect(moviesConnectionType).toBeDefined();
            const { aggregate, edges } = moviesConnectionType.getFields();

            expect(aggregate).toBeUndefined();
            expect(edges).toBeDefined();
        });

        test("should enable aggregation", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @node {
                    username: String!
                    password: String!
                }

                type Movie @query(aggregate: true) @node {
                    title: String
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();
            const { movies, actors, moviesConnection, actorsConnection } = schema
                .getQueryType()
                ?.getFields() as GraphQLFieldMap<any, any>;

            expect(movies).toBeDefined();
            expect(actors).toBeDefined();

            expect(moviesConnection).toBeDefined();
            expect(actorsConnection).toBeDefined();

            const moviesConnectionType = schema.getType("MoviesConnection") as GraphQLObjectType;
            expect(moviesConnectionType).toBeDefined();
            const { aggregate, edges } = moviesConnectionType.getFields();

            expect(aggregate).toBeDefined();
            expect(edges).toBeDefined();
        });

        test("should disable read and aggregate for Actor", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @query(read: false, aggregate: false) @node {
                    name: String
                }

                type Movie @node {
                    title: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const schema = await neoSchema.getSchema();
            const { movies, actors, moviesConnection, actorsConnection } = schema
                .getQueryType()
                ?.getFields() as GraphQLFieldMap<any, any>;

            expect(movies).toBeDefined();
            expect(actors).toBeUndefined();

            expect(moviesConnection).toBeDefined();
            expect(actorsConnection).toBeUndefined();

            const actorsConnectionType = schema.getType("ActorsConnection") as GraphQLObjectType;
            expect(actorsConnectionType).toBeUndefined();
        });

        test("should disable read and enable aggregate for Actor", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @query(read: false, aggregate: true) @node {
                    name: String
                }

                type Movie @node {
                    title: String
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const schema = await neoSchema.getSchema();
            const { movies, actors, moviesConnection, actorsConnection } = schema
                .getQueryType()
                ?.getFields() as GraphQLFieldMap<any, any>;

            expect(movies).toBeDefined();
            expect(actors).toBeUndefined();

            expect(moviesConnection).toBeDefined();
            expect(actorsConnection).toBeDefined();

            const actorsConnectionType = schema.getType("ActorsConnection") as GraphQLObjectType;
            expect(actorsConnectionType).toBeDefined();
            const { aggregate, edges } = actorsConnectionType.getFields();

            expect(aggregate).toBeDefined();
            expect(edges).toBeUndefined();
        });
    });

    describe("on SCHEMA", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @node {
                    username: String!
                    password: String!
                }

                type Movie @node {
                    title: String
                }
                extend schema @query
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            const schema = await neoSchema.getSchema();
            const { movies, actors, moviesConnection, actorsConnection } = schema
                .getQueryType()
                ?.getFields() as GraphQLFieldMap<any, any>;

            expect(movies).toBeDefined();
            expect(actors).toBeDefined();

            expect(moviesConnection).toBeDefined();
            expect(actorsConnection).toBeDefined();

            const actorsConnectionType = schema.getType("ActorsConnection") as GraphQLObjectType;
            expect(actorsConnectionType).toBeDefined();
            const { aggregate, edges } = actorsConnectionType.getFields();

            expect(aggregate).toBeUndefined();
            expect(edges).toBeDefined();
        });

        test("should disable read and aggregate", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @node {
                    name: String
                }

                type Movie @node {
                    title: String
                }
                extend schema @query(read: false, aggregate: false)
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const schema = await neoSchema.getSchema();
            const { movies, actors, moviesConnection, actorsConnection } = schema
                .getQueryType()
                ?.getFields() as GraphQLFieldMap<any, any>;

            expect(movies).toBeUndefined();
            expect(actors).toBeUndefined();

            expect(moviesConnection).toBeUndefined();
            expect(actorsConnection).toBeUndefined();

            const actorsConnectionType = schema.getType("ActorsConnection") as GraphQLObjectType;
            expect(actorsConnectionType).toBeUndefined();
        });

        test("should throw an Error when is used in both schema on object", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @query(read: true, aggregate: true) @node {
                    name: String
                }

                type Movie @node {
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

        test("should not generate queries for interfaces and unions", async () => {
            const typeDefs = /* GraphQL */ `
                interface Production {
                    title: String!
                }

                type Movie implements Production @node {
                    title: String!
                }

                type Series implements Production @node {
                    title: String!
                }

                union Media = Movie | Series

                extend schema @query(read: false, aggregate: false)
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const schema = await neoSchema.getSchema();
            const { media, productions, productionsConnection, productionsAggregate } = schema
                .getQueryType()
                ?.getFields() as GraphQLFieldMap<any, any>;

            expect(media).toBeUndefined();
            expect(productions).toBeUndefined();
            expect(productionsConnection).toBeUndefined();
            expect(productionsAggregate).toBeUndefined();
        });
    });
});
