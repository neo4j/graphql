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
import type { GraphQLInputObjectType } from "graphql";
import { lexicographicSortSchema } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { TestSubscriptionsEngine } from "../../utils/TestSubscriptionsEngine";

describe("@filterable directive", () => {
    let plugin: TestSubscriptionsEngine;

    beforeAll(() => {
        plugin = new TestSubscriptionsEngine();
    });

    describe("on SCALAR", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String @filterable
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();
            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;

            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const title = movieWhereFields["title"];
            const title_IN = movieWhereFields["title_IN"];
            const title_CONTAINS = movieWhereFields["title_CONTAINS"];
            const title_STARTS_WITH = movieWhereFields["title_STARTS_WITH"];
            const title_ENDS_WITH = movieWhereFields["title_ENDS_WITH"];

            const titleFilters = [title, title_IN, title_CONTAINS, title_STARTS_WITH, title_ENDS_WITH];

            for (const scalarFilter of titleFilters) {
                expect(scalarFilter).toBeDefined();
            }

            const movieSubscriptionWhereType = schema.getType("MovieSubscriptionWhere") as GraphQLInputObjectType;

            expect(movieSubscriptionWhereType).toBeDefined();

            const movieSubscriptionWhereFields = movieSubscriptionWhereType.getFields();

            const subscriptionTitle = movieSubscriptionWhereFields["title"];
            const subscriptionTitle_IN = movieSubscriptionWhereFields["title_IN"];
            const subscriptionTitle_CONTAINS = movieSubscriptionWhereFields["title_CONTAINS"];
            const subscriptionTitle_STARTS_WITH = movieSubscriptionWhereFields["title_STARTS_WITH"];
            const subscriptionTitle_ENDS_WITH = movieSubscriptionWhereFields["title_ENDS_WITH"];

            const subscriptionTitleFilters = [
                subscriptionTitle,
                subscriptionTitle_IN,
                subscriptionTitle_CONTAINS,
                subscriptionTitle_STARTS_WITH,
                subscriptionTitle_ENDS_WITH,
            ];

            for (const scalarFilter of subscriptionTitleFilters) {
                expect(scalarFilter).toBeDefined();
            }

            const aggregationWhereInput = schema.getType(
                "ActorMoviesNodeAggregationWhereInput"
            ) as GraphQLInputObjectType;

            expect(aggregationWhereInput).toBeUndefined();
        });

        test("enable value and aggregation filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String @filterable(byValue: true, byAggregate: true)
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();
            const title = movieWhereFields["title"];
            const title_IN = movieWhereFields["title_IN"];
            const title_CONTAINS = movieWhereFields["title_CONTAINS"];
            const title_STARTS_WITH = movieWhereFields["title_STARTS_WITH"];
            const title_ENDS_WITH = movieWhereFields["title_ENDS_WITH"];

            const titleFilters = [title, title_IN, title_CONTAINS, title_STARTS_WITH, title_ENDS_WITH];

            for (const scalarFilter of titleFilters) {
                expect(scalarFilter).toBeDefined();
            }

            const movieSubscriptionWhereType = schema.getType("MovieSubscriptionWhere") as GraphQLInputObjectType;

            expect(movieSubscriptionWhereType).toBeDefined();

            const movieSubscriptionWhereFields = movieSubscriptionWhereType.getFields();

            const subscriptionTitle = movieSubscriptionWhereFields["title"];
            const subscriptionTitle_IN = movieSubscriptionWhereFields["title_IN"];
            const subscriptionTitle_CONTAINS = movieSubscriptionWhereFields["title_CONTAINS"];
            const subscriptionTitle_STARTS_WITH = movieSubscriptionWhereFields["title_STARTS_WITH"];
            const subscriptionTitle_ENDS_WITH = movieSubscriptionWhereFields["title_ENDS_WITH"];

            const subscriptionTitleFilters = [
                subscriptionTitle,
                subscriptionTitle_IN,
                subscriptionTitle_CONTAINS,
                subscriptionTitle_STARTS_WITH,
                subscriptionTitle_ENDS_WITH,
            ];

            for (const scalarFilter of subscriptionTitleFilters) {
                expect(scalarFilter).toBeDefined();
            }

            const aggregationWhereInput = schema.getType(
                "ActorMoviesNodeAggregationWhereInput"
            ) as GraphQLInputObjectType;

            expect(aggregationWhereInput).toBeDefined();
            const aggregationWhereInputFields = aggregationWhereInput.getFields();

            const title_AVERAGE_LENGTH_EQUAL = aggregationWhereInputFields["title_AVERAGE_LENGTH_EQUAL"];
            const title_LONGEST_LENGTH_EQUAL = aggregationWhereInputFields["title_LONGEST_LENGTH_EQUAL"];
            const title_SHORTEST_LENGTH_EQUAL = aggregationWhereInputFields["title_SHORTEST_LENGTH_EQUAL"];
            const title_AVERAGE_LENGTH_GT = aggregationWhereInputFields["title_AVERAGE_LENGTH_GT"];
            const title_LONGEST_LENGTH_GT = aggregationWhereInputFields["title_LONGEST_LENGTH_GT"];
            const title_SHORTEST_LENGTH_GT = aggregationWhereInputFields["title_SHORTEST_LENGTH_GT"];
            const title_AVERAGE_LENGTH_GTE = aggregationWhereInputFields["title_AVERAGE_LENGTH_GTE"];
            const title_LONGEST_LENGTH_GTE = aggregationWhereInputFields["title_LONGEST_LENGTH_GTE"];
            const title_SHORTEST_LENGTH_GTE = aggregationWhereInputFields["title_SHORTEST_LENGTH_GTE"];
            const title_AVERAGE_LENGTH_LT = aggregationWhereInputFields["title_AVERAGE_LENGTH_LT"];
            const title_LONGEST_LENGTH_LT = aggregationWhereInputFields["title_LONGEST_LENGTH_LT"];
            const title_SHORTEST_LENGTH_LT = aggregationWhereInputFields["title_SHORTEST_LENGTH_LT"];
            const title_AVERAGE_LENGTH_LTE = aggregationWhereInputFields["title_AVERAGE_LENGTH_LTE"];
            const title_LONGEST_LENGTH_LTE = aggregationWhereInputFields["title_LONGEST_LENGTH_LTE"];
            const title_SHORTEST_LENGTH_LTE = aggregationWhereInputFields["title_SHORTEST_LENGTH_LTE"];

            const aggregationFilters = [
                title_AVERAGE_LENGTH_EQUAL,
                title_LONGEST_LENGTH_EQUAL,
                title_SHORTEST_LENGTH_EQUAL,
                title_AVERAGE_LENGTH_GT,
                title_LONGEST_LENGTH_GT,
                title_SHORTEST_LENGTH_GT,
                title_AVERAGE_LENGTH_GTE,
                title_LONGEST_LENGTH_GTE,
                title_SHORTEST_LENGTH_GTE,
                title_AVERAGE_LENGTH_LT,
                title_LONGEST_LENGTH_LT,
                title_SHORTEST_LENGTH_LT,
                title_AVERAGE_LENGTH_LTE,
                title_LONGEST_LENGTH_LTE,
                title_SHORTEST_LENGTH_LTE,
            ];

            for (const aggregationFilter of aggregationFilters) {
                expect(aggregationFilter).toBeDefined();
            }
        });

        test("enable only aggregation filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String @filterable(byValue: false, byAggregate: true)
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const title = movieWhereFields["title"];
            const title_IN = movieWhereFields["title_IN"];
            const title_CONTAINS = movieWhereFields["title_CONTAINS"];
            const title_STARTS_WITH = movieWhereFields["title_STARTS_WITH"];
            const title_ENDS_WITH = movieWhereFields["title_ENDS_WITH"];

            const titleFilters = [title, title_IN, title_CONTAINS, title_STARTS_WITH, title_ENDS_WITH];

            for (const scalarFilter of titleFilters) {
                expect(scalarFilter).toBeUndefined();
            }

            const movieSubscriptionWhereType = schema.getType("MovieSubscriptionWhere") as GraphQLInputObjectType;

            expect(movieSubscriptionWhereType).toBeUndefined(); // is completely removed as does not contains any filterable fields

            const aggregationWhereInput = schema.getType(
                "ActorMoviesNodeAggregationWhereInput"
            ) as GraphQLInputObjectType;

            expect(aggregationWhereInput).toBeDefined();
            const aggregationWhereInputFields = aggregationWhereInput.getFields();

            const title_AVERAGE_LENGTH_EQUAL = aggregationWhereInputFields["title_AVERAGE_LENGTH_EQUAL"];
            const title_LONGEST_LENGTH_EQUAL = aggregationWhereInputFields["title_LONGEST_LENGTH_EQUAL"];
            const title_SHORTEST_LENGTH_EQUAL = aggregationWhereInputFields["title_SHORTEST_LENGTH_EQUAL"];
            const title_AVERAGE_LENGTH_GT = aggregationWhereInputFields["title_AVERAGE_LENGTH_GT"];
            const title_LONGEST_LENGTH_GT = aggregationWhereInputFields["title_LONGEST_LENGTH_GT"];
            const title_SHORTEST_LENGTH_GT = aggregationWhereInputFields["title_SHORTEST_LENGTH_GT"];
            const title_AVERAGE_LENGTH_GTE = aggregationWhereInputFields["title_AVERAGE_LENGTH_GTE"];
            const title_LONGEST_LENGTH_GTE = aggregationWhereInputFields["title_LONGEST_LENGTH_GTE"];
            const title_SHORTEST_LENGTH_GTE = aggregationWhereInputFields["title_SHORTEST_LENGTH_GTE"];
            const title_AVERAGE_LENGTH_LT = aggregationWhereInputFields["title_AVERAGE_LENGTH_LT"];
            const title_LONGEST_LENGTH_LT = aggregationWhereInputFields["title_LONGEST_LENGTH_LT"];
            const title_SHORTEST_LENGTH_LT = aggregationWhereInputFields["title_SHORTEST_LENGTH_LT"];
            const title_AVERAGE_LENGTH_LTE = aggregationWhereInputFields["title_AVERAGE_LENGTH_LTE"];
            const title_LONGEST_LENGTH_LTE = aggregationWhereInputFields["title_LONGEST_LENGTH_LTE"];
            const title_SHORTEST_LENGTH_LTE = aggregationWhereInputFields["title_SHORTEST_LENGTH_LTE"];

            const aggregationFilters = [
                title_AVERAGE_LENGTH_EQUAL,
                title_LONGEST_LENGTH_EQUAL,
                title_SHORTEST_LENGTH_EQUAL,
                title_AVERAGE_LENGTH_GT,
                title_LONGEST_LENGTH_GT,
                title_SHORTEST_LENGTH_GT,
                title_AVERAGE_LENGTH_GTE,
                title_LONGEST_LENGTH_GTE,
                title_SHORTEST_LENGTH_GTE,
                title_AVERAGE_LENGTH_LT,
                title_LONGEST_LENGTH_LT,
                title_SHORTEST_LENGTH_LT,
                title_AVERAGE_LENGTH_LTE,
                title_LONGEST_LENGTH_LTE,
                title_SHORTEST_LENGTH_LTE,
            ];

            for (const aggregationFilter of aggregationFilters) {
                expect(aggregationFilter).toBeDefined();
            }
        });
    });

    describe("on RELATIONSHIP FIELD", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
                actorsConnection,
                actorsConnectionALL,
                actorsConnectionNONE,
                actorsConnectionSINGLE,
                actorsConnectionSOME,
            ];

            for (const relationshipFilter of actorsConnectionFilters) {
                expect(relationshipFilter).toBeDefined();
            }

            const actorsAggregate = movieWhereFields["actorsAggregate"];
            expect(actorsAggregate).toBeUndefined();
        });

        test("enable value and aggregation filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String
                    actors: [Actor!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
                actorsConnection,
                actorsConnectionALL,
                actorsConnectionNONE,
                actorsConnectionSINGLE,
                actorsConnectionSOME,
            ];

            for (const relationshipFilter of actorsConnectionFilters) {
                expect(relationshipFilter).toBeDefined();
            }

            const actorsAggregate = movieWhereFields["actorsAggregate"];
            expect(actorsAggregate).toBeDefined();
        });

        test("enable only aggregation filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String
                    actors: [Actor!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: false, byAggregate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
                actorsConnection,
                actorsConnectionALL,
                actorsConnectionNONE,
                actorsConnectionSINGLE,
                actorsConnectionSOME,
            ];

            for (const relationshipFilter of actorsConnectionFilters) {
                expect(relationshipFilter).toBeUndefined();
            }

            const actorsAggregate = movieWhereFields["actorsAggregate"];
            expect(actorsAggregate).toBeDefined();
        });

        test("enable only value filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie {
                    title: String
                    actors: [Actor!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
                actorsConnection,
                actorsConnectionALL,
                actorsConnectionNONE,
                actorsConnectionSINGLE,
                actorsConnectionSOME,
            ];

            for (const relationshipFilter of actorsConnectionFilters) {
                expect(relationshipFilter).toBeDefined();
            }

            const actorsAggregate = movieWhereFields["actorsAggregate"];
            expect(actorsAggregate).toBeUndefined();
        });
    });

    describe("on INTERFACE RELATIONSHIP FIELD, (aggregation are not generated for abstract types)", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = gql`
                type Actor implements Person {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                interface Person {
                    username: String!
                }

                type Movie {
                    title: String
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
                actorsConnection,
                actorsConnectionALL,
                actorsConnectionNONE,
                actorsConnectionSINGLE,
                actorsConnectionSOME,
            ];

            for (const relationshipFilter of actorsConnectionFilters) {
                expect(relationshipFilter).toBeDefined();
            }

            const actorsAggregate = movieWhereFields["actorsAggregate"];
            expect(actorsAggregate).toBeUndefined();
        });

        test("enable value and aggregation filters", async () => {
            const typeDefs = gql`
                type Actor implements Person {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                interface Person {
                    username: String!
                }

                type Movie {
                    title: String
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
                actorsConnection,
                actorsConnectionALL,
                actorsConnectionNONE,
                actorsConnectionSINGLE,
                actorsConnectionSOME,
            ];

            for (const relationshipFilter of actorsConnectionFilters) {
                expect(relationshipFilter).toBeDefined();
            }

            const actorsAggregate = movieWhereFields["actorsAggregate"];
            expect(actorsAggregate).toBeDefined();
        });

        test("enable only value filters", async () => {
            const typeDefs = gql`
                type Actor implements Person {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                interface Person {
                    username: String!
                }

                type Movie {
                    title: String
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
                actorsConnection,
                actorsConnectionALL,
                actorsConnectionNONE,
                actorsConnectionSINGLE,
                actorsConnectionSOME,
            ];

            for (const relationshipFilter of actorsConnectionFilters) {
                expect(relationshipFilter).toBeDefined();
            }

            const actorsAggregate = movieWhereFields["actorsAggregate"];
            expect(actorsAggregate).toBeUndefined();
        });

        test("disable value filters", async () => {
            const typeDefs = gql`
                type Actor implements Person {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                interface Person {
                    username: String!
                }

                type Movie {
                    title: String
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: false, byAggregate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
                actorsConnection,
                actorsConnectionALL,
                actorsConnectionNONE,
                actorsConnectionSINGLE,
                actorsConnectionSOME,
            ];

            for (const relationshipFilter of actorsConnectionFilters) {
                expect(relationshipFilter).toBeUndefined();
            }

            const actorsAggregate = movieWhereFields["actorsAggregate"];
            expect(actorsAggregate).toBeUndefined();
        });
    });

    describe("on UNION RELATIONSHIP FIELD, (aggregation are no generated for abstract types)", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Appearance {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                union Person = Actor | Appearance

                type Movie {
                    title: String
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
                actorsConnection,
                actorsConnectionALL,
                actorsConnectionNONE,
                actorsConnectionSINGLE,
                actorsConnectionSOME,
            ];

            for (const relationshipFilter of actorsConnectionFilters) {
                expect(relationshipFilter).toBeDefined();
            }

            const actorsAggregate = movieWhereFields["actorsAggregate"];
            expect(actorsAggregate).toBeUndefined();
        });

        test("enable value and aggregation filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Appearance {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                union Person = Actor | Appearance

                type Movie {
                    title: String
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
                actorsConnection,
                actorsConnectionALL,
                actorsConnectionNONE,
                actorsConnectionSINGLE,
                actorsConnectionSOME,
            ];

            for (const relationshipFilter of actorsConnectionFilters) {
                expect(relationshipFilter).toBeDefined();
            }

            const actorsAggregate = movieWhereFields["actorsAggregate"];
            expect(actorsAggregate).toBeUndefined();
        });

        test("enable only value filters", async () => {
            const typeDefs = gql`
                type Actor {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Appearance {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                union Person = Actor | Appearance

                type Movie {
                    title: String
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: plugin,
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
                actorsConnection,
                actorsConnectionALL,
                actorsConnectionNONE,
                actorsConnectionSINGLE,
                actorsConnectionSOME,
            ];

            for (const relationshipFilter of actorsConnectionFilters) {
                expect(relationshipFilter).toBeDefined();
            }

            const actorsAggregate = movieWhereFields["actorsAggregate"];
            expect(actorsAggregate).toBeUndefined();
        });
    });

    describe("snapshot tests", () => {
        describe("on SCALAR", () => {
            test("default arguments should disable aggregation", async () => {
                const typeDefs = gql`
                    type Actor {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie {
                        title: String @filterable
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      createdRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      deletedRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    input ActorRelationshipsSubscriptionWhere {
                      movies: ActorMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregationSelection {
                      count: Int!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input MovieActorsAggregateInput {
                      AND: [MovieActorsAggregateInput!]
                      NOT: MovieActorsAggregateInput
                      OR: [MovieActorsAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnectedRelationship {
                      node: ActorEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsDeleteFieldInput {
                      delete: ActorDeleteInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsDisconnectFieldInput {
                      disconnect: ActorDisconnectInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                    }

                    input MovieActorsNodeAggregationWhereInput {
                      AND: [MovieActorsNodeAggregationWhereInput!]
                      NOT: MovieActorsNodeAggregationWhereInput
                      OR: [MovieActorsNodeAggregationWhereInput!]
                      password_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LENGTH_EQUAL: Float
                      password_AVERAGE_LENGTH_GT: Float
                      password_AVERAGE_LENGTH_GTE: Float
                      password_AVERAGE_LENGTH_LT: Float
                      password_AVERAGE_LENGTH_LTE: Float
                      password_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LENGTH_EQUAL: Int
                      password_LONGEST_LENGTH_GT: Int
                      password_LONGEST_LENGTH_GTE: Int
                      password_LONGEST_LENGTH_LT: Int
                      password_LONGEST_LENGTH_LTE: Int
                      password_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int
                      password_SHORTEST_LENGTH_GT: Int
                      password_SHORTEST_LENGTH_GTE: Int
                      password_SHORTEST_LENGTH_LT: Int
                      password_SHORTEST_LENGTH_LTE: Int
                      password_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LENGTH_EQUAL: Float
                      username_AVERAGE_LENGTH_GT: Float
                      username_AVERAGE_LENGTH_GTE: Float
                      username_AVERAGE_LENGTH_LT: Float
                      username_AVERAGE_LENGTH_LTE: Float
                      username_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LENGTH_EQUAL: Int
                      username_LONGEST_LENGTH_GT: Int
                      username_LONGEST_LENGTH_GTE: Int
                      username_LONGEST_LENGTH_LT: Int
                      username_LONGEST_LENGTH_LTE: Int
                      username_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int
                      username_SHORTEST_LENGTH_GT: Int
                      username_SHORTEST_LENGTH_GTE: Int
                      username_SHORTEST_LENGTH_LT: Int
                      username_SHORTEST_LENGTH_LTE: Int
                      username_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      node: ActorSubscriptionWhere
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsAggregate: MovieActorsAggregateInput
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere
                      actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });

            test("enable value and aggregation filters", async () => {
                const typeDefs = gql`
                    type Actor {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie {
                        title: String @filterable(byValue: true, byAggregate: true)
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      createdRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      deletedRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    input ActorRelationshipsSubscriptionWhere {
                      movies: ActorMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregationSelection {
                      count: Int!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input MovieActorsAggregateInput {
                      AND: [MovieActorsAggregateInput!]
                      NOT: MovieActorsAggregateInput
                      OR: [MovieActorsAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnectedRelationship {
                      node: ActorEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsDeleteFieldInput {
                      delete: ActorDeleteInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsDisconnectFieldInput {
                      disconnect: ActorDisconnectInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                    }

                    input MovieActorsNodeAggregationWhereInput {
                      AND: [MovieActorsNodeAggregationWhereInput!]
                      NOT: MovieActorsNodeAggregationWhereInput
                      OR: [MovieActorsNodeAggregationWhereInput!]
                      password_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LENGTH_EQUAL: Float
                      password_AVERAGE_LENGTH_GT: Float
                      password_AVERAGE_LENGTH_GTE: Float
                      password_AVERAGE_LENGTH_LT: Float
                      password_AVERAGE_LENGTH_LTE: Float
                      password_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LENGTH_EQUAL: Int
                      password_LONGEST_LENGTH_GT: Int
                      password_LONGEST_LENGTH_GTE: Int
                      password_LONGEST_LENGTH_LT: Int
                      password_LONGEST_LENGTH_LTE: Int
                      password_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int
                      password_SHORTEST_LENGTH_GT: Int
                      password_SHORTEST_LENGTH_GTE: Int
                      password_SHORTEST_LENGTH_LT: Int
                      password_SHORTEST_LENGTH_LTE: Int
                      password_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LENGTH_EQUAL: Float
                      username_AVERAGE_LENGTH_GT: Float
                      username_AVERAGE_LENGTH_GTE: Float
                      username_AVERAGE_LENGTH_LT: Float
                      username_AVERAGE_LENGTH_LTE: Float
                      username_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LENGTH_EQUAL: Int
                      username_LONGEST_LENGTH_GT: Int
                      username_LONGEST_LENGTH_GTE: Int
                      username_LONGEST_LENGTH_LT: Int
                      username_LONGEST_LENGTH_LTE: Int
                      username_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int
                      username_SHORTEST_LENGTH_GT: Int
                      username_SHORTEST_LENGTH_GTE: Int
                      username_SHORTEST_LENGTH_LT: Int
                      username_SHORTEST_LENGTH_LTE: Int
                      username_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      node: ActorSubscriptionWhere
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsAggregate: MovieActorsAggregateInput
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere
                      actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });

            test("enable only aggregation filters", async () => {
                const typeDefs = gql`
                    type Actor {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie {
                        title: String @filterable(byValue: false, byAggregate: true)
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregationSelection {
                      count: Int!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input MovieActorsAggregateInput {
                      AND: [MovieActorsAggregateInput!]
                      NOT: MovieActorsAggregateInput
                      OR: [MovieActorsAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnectedRelationship {
                      node: ActorEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsDeleteFieldInput {
                      delete: ActorDeleteInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsDisconnectFieldInput {
                      disconnect: ActorDisconnectInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                    }

                    input MovieActorsNodeAggregationWhereInput {
                      AND: [MovieActorsNodeAggregationWhereInput!]
                      NOT: MovieActorsNodeAggregationWhereInput
                      OR: [MovieActorsNodeAggregationWhereInput!]
                      password_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LENGTH_EQUAL: Float
                      password_AVERAGE_LENGTH_GT: Float
                      password_AVERAGE_LENGTH_GTE: Float
                      password_AVERAGE_LENGTH_LT: Float
                      password_AVERAGE_LENGTH_LTE: Float
                      password_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LENGTH_EQUAL: Int
                      password_LONGEST_LENGTH_GT: Int
                      password_LONGEST_LENGTH_GTE: Int
                      password_LONGEST_LENGTH_LT: Int
                      password_LONGEST_LENGTH_LTE: Int
                      password_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int
                      password_SHORTEST_LENGTH_GT: Int
                      password_SHORTEST_LENGTH_GTE: Int
                      password_SHORTEST_LENGTH_LT: Int
                      password_SHORTEST_LENGTH_LTE: Int
                      password_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LENGTH_EQUAL: Float
                      username_AVERAGE_LENGTH_GT: Float
                      username_AVERAGE_LENGTH_GTE: Float
                      username_AVERAGE_LENGTH_LT: Float
                      username_AVERAGE_LENGTH_LTE: Float
                      username_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LENGTH_EQUAL: Int
                      username_LONGEST_LENGTH_GT: Int
                      username_LONGEST_LENGTH_GTE: Int
                      username_LONGEST_LENGTH_LT: Int
                      username_LONGEST_LENGTH_LTE: Int
                      username_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int
                      username_SHORTEST_LENGTH_GT: Int
                      username_SHORTEST_LENGTH_GTE: Int
                      username_SHORTEST_LENGTH_LT: Int
                      username_SHORTEST_LENGTH_LTE: Int
                      username_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      node: ActorSubscriptionWhere
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsAggregate: MovieActorsAggregateInput
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere
                      actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated: MovieCreatedEvent!
                      movieDeleted: MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated: MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });
        });

        describe("on RELATIONSHIP FIELD", () => {
            test("default arguments should disable aggregation", async () => {
                const typeDefs = gql`
                    type Actor {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie {
                        title: String
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      createdRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      deletedRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    input ActorRelationshipsSubscriptionWhere {
                      movies: ActorMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregationSelection {
                      count: Int!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnectedRelationship {
                      node: ActorEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsDeleteFieldInput {
                      delete: ActorDeleteInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsDisconnectFieldInput {
                      disconnect: ActorDisconnectInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      node: ActorSubscriptionWhere
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere
                      actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });

            test("enable value and aggregation filters", async () => {
                const typeDefs = gql`
                    type Actor {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie {
                        title: String
                        actors: [Actor!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: true, byAggregate: true)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      createdRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      deletedRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    input ActorRelationshipsSubscriptionWhere {
                      movies: ActorMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregationSelection {
                      count: Int!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input MovieActorsAggregateInput {
                      AND: [MovieActorsAggregateInput!]
                      NOT: MovieActorsAggregateInput
                      OR: [MovieActorsAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnectedRelationship {
                      node: ActorEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsDeleteFieldInput {
                      delete: ActorDeleteInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsDisconnectFieldInput {
                      disconnect: ActorDisconnectInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                    }

                    input MovieActorsNodeAggregationWhereInput {
                      AND: [MovieActorsNodeAggregationWhereInput!]
                      NOT: MovieActorsNodeAggregationWhereInput
                      OR: [MovieActorsNodeAggregationWhereInput!]
                      password_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LENGTH_EQUAL: Float
                      password_AVERAGE_LENGTH_GT: Float
                      password_AVERAGE_LENGTH_GTE: Float
                      password_AVERAGE_LENGTH_LT: Float
                      password_AVERAGE_LENGTH_LTE: Float
                      password_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LENGTH_EQUAL: Int
                      password_LONGEST_LENGTH_GT: Int
                      password_LONGEST_LENGTH_GTE: Int
                      password_LONGEST_LENGTH_LT: Int
                      password_LONGEST_LENGTH_LTE: Int
                      password_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int
                      password_SHORTEST_LENGTH_GT: Int
                      password_SHORTEST_LENGTH_GTE: Int
                      password_SHORTEST_LENGTH_LT: Int
                      password_SHORTEST_LENGTH_LTE: Int
                      password_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LENGTH_EQUAL: Float
                      username_AVERAGE_LENGTH_GT: Float
                      username_AVERAGE_LENGTH_GTE: Float
                      username_AVERAGE_LENGTH_LT: Float
                      username_AVERAGE_LENGTH_LTE: Float
                      username_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LENGTH_EQUAL: Int
                      username_LONGEST_LENGTH_GT: Int
                      username_LONGEST_LENGTH_GTE: Int
                      username_LONGEST_LENGTH_LT: Int
                      username_LONGEST_LENGTH_LTE: Int
                      username_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int
                      username_SHORTEST_LENGTH_GT: Int
                      username_SHORTEST_LENGTH_GTE: Int
                      username_SHORTEST_LENGTH_LT: Int
                      username_SHORTEST_LENGTH_LTE: Int
                      username_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      node: ActorSubscriptionWhere
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsAggregate: MovieActorsAggregateInput
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere
                      actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });

            test("enable only aggregation filters", async () => {
                const typeDefs = gql`
                    type Actor {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie {
                        title: String
                        actors: [Actor!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: false, byAggregate: true)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      createdRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      deletedRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    input ActorRelationshipsSubscriptionWhere {
                      movies: ActorMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregationSelection {
                      count: Int!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input MovieActorsAggregateInput {
                      AND: [MovieActorsAggregateInput!]
                      NOT: MovieActorsAggregateInput
                      OR: [MovieActorsAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnectedRelationship {
                      node: ActorEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsDeleteFieldInput {
                      delete: ActorDeleteInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsDisconnectFieldInput {
                      disconnect: ActorDisconnectInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                    }

                    input MovieActorsNodeAggregationWhereInput {
                      AND: [MovieActorsNodeAggregationWhereInput!]
                      NOT: MovieActorsNodeAggregationWhereInput
                      OR: [MovieActorsNodeAggregationWhereInput!]
                      password_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LENGTH_EQUAL: Float
                      password_AVERAGE_LENGTH_GT: Float
                      password_AVERAGE_LENGTH_GTE: Float
                      password_AVERAGE_LENGTH_LT: Float
                      password_AVERAGE_LENGTH_LTE: Float
                      password_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LENGTH_EQUAL: Int
                      password_LONGEST_LENGTH_GT: Int
                      password_LONGEST_LENGTH_GTE: Int
                      password_LONGEST_LENGTH_LT: Int
                      password_LONGEST_LENGTH_LTE: Int
                      password_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      password_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int
                      password_SHORTEST_LENGTH_GT: Int
                      password_SHORTEST_LENGTH_GTE: Int
                      password_SHORTEST_LENGTH_LT: Int
                      password_SHORTEST_LENGTH_LTE: Int
                      password_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      password_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LENGTH_EQUAL: Float
                      username_AVERAGE_LENGTH_GT: Float
                      username_AVERAGE_LENGTH_GTE: Float
                      username_AVERAGE_LENGTH_LT: Float
                      username_AVERAGE_LENGTH_LTE: Float
                      username_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LENGTH_EQUAL: Int
                      username_LONGEST_LENGTH_GT: Int
                      username_LONGEST_LENGTH_GTE: Int
                      username_LONGEST_LENGTH_LT: Int
                      username_LONGEST_LENGTH_LTE: Int
                      username_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int
                      username_SHORTEST_LENGTH_GT: Int
                      username_SHORTEST_LENGTH_GTE: Int
                      username_SHORTEST_LENGTH_LT: Int
                      username_SHORTEST_LENGTH_LTE: Int
                      username_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      node: ActorSubscriptionWhere
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actorsAggregate: MovieActorsAggregateInput
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });

            test("enable only value filters", async () => {
                const typeDefs = gql`
                    type Actor {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie {
                        title: String
                        actors: [Actor!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: true, byAggregate: false)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      createdRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      deletedRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    input ActorRelationshipsSubscriptionWhere {
                      movies: ActorMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(directed: Boolean = true, where: ActorWhere): MovieActorActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregationSelection {
                      count: Int!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnectedRelationship {
                      node: ActorEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsDeleteFieldInput {
                      delete: ActorDeleteInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsDisconnectFieldInput {
                      disconnect: ActorDisconnectInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      node: ActorSubscriptionWhere
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere
                      actors_NOT: ActorWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });
        });

        describe("on INTERFACE RELATIONSHIP FIELD, (aggregation does not exists on abstract types)", () => {
            test("default arguments should disable aggregation", async () => {
                const typeDefs = gql`
                    type Actor implements Person {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    interface Person {
                        username: String!
                    }

                    type Movie {
                        title: String
                        actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor implements Person {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload implements PersonEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      createdRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      deletedRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    input ActorRelationshipsSubscriptionWhere {
                      movies: ActorMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                      actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    input MovieActorsConnectFieldInput {
                      where: PersonConnectWhere
                    }

                    type MovieActorsConnectedRelationship {
                      node: PersonEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionSort {
                      node: PersonSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: PersonWhere
                      node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsCreateFieldInput {
                      node: PersonCreateInput!
                    }

                    input MovieActorsDeleteFieldInput {
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsDisconnectFieldInput {
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Person!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      node: PersonSubscriptionWhere
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: PersonUpdateInput
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    type MoviePersonActorsAggregationSelection {
                      count: Int!
                      node: MoviePersonActorsNodeAggregateSelection
                    }

                    type MoviePersonActorsNodeAggregateSelection {
                      username: StringAggregateSelection!
                    }

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere
                      actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type PeopleConnection {
                      edges: [PersonEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    interface Person {
                      username: String!
                    }

                    type PersonAggregateSelection {
                      count: Int!
                      username: StringAggregateSelection!
                    }

                    input PersonConnectWhere {
                      node: PersonWhere!
                    }

                    input PersonCreateInput {
                      Actor: ActorCreateInput
                    }

                    type PersonEdge {
                      cursor: String!
                      node: Person!
                    }

                    interface PersonEventPayload {
                      username: String!
                    }

                    enum PersonImplementation {
                      Actor
                    }

                    input PersonOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [PersonSort]
                    }

                    \\"\\"\\"
                    Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                    \\"\\"\\"
                    input PersonSort {
                      username: SortDirection
                    }

                    input PersonSubscriptionWhere {
                      AND: [PersonSubscriptionWhere!]
                      NOT: PersonSubscriptionWhere
                      OR: [PersonSubscriptionWhere!]
                      typename_IN: [PersonImplementation!]
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input PersonUpdateInput {
                      username: String
                    }

                    input PersonWhere {
                      AND: [PersonWhere!]
                      NOT: PersonWhere
                      OR: [PersonWhere!]
                      typename_IN: [PersonImplementation!]
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                      people(options: PersonOptions, where: PersonWhere): [Person!]!
                      peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                      peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });

            test("enable value and aggregation filters", async () => {
                const typeDefs = gql`
                    type Actor implements Person {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    interface Person {
                        username: String!
                    }

                    type Movie {
                        title: String
                        actors: [Person!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: true, byAggregate: true)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor implements Person {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload implements PersonEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      createdRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      deletedRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    input ActorRelationshipsSubscriptionWhere {
                      movies: ActorMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                      actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    input MovieActorsAggregateInput {
                      AND: [MovieActorsAggregateInput!]
                      NOT: MovieActorsAggregateInput
                      OR: [MovieActorsAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      where: PersonConnectWhere
                    }

                    type MovieActorsConnectedRelationship {
                      node: PersonEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionSort {
                      node: PersonSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: PersonWhere
                      node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsCreateFieldInput {
                      node: PersonCreateInput!
                    }

                    input MovieActorsDeleteFieldInput {
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsDisconnectFieldInput {
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                    }

                    input MovieActorsNodeAggregationWhereInput {
                      AND: [MovieActorsNodeAggregationWhereInput!]
                      NOT: MovieActorsNodeAggregationWhereInput
                      OR: [MovieActorsNodeAggregationWhereInput!]
                      username_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LENGTH_EQUAL: Float
                      username_AVERAGE_LENGTH_GT: Float
                      username_AVERAGE_LENGTH_GTE: Float
                      username_AVERAGE_LENGTH_LT: Float
                      username_AVERAGE_LENGTH_LTE: Float
                      username_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LENGTH_EQUAL: Int
                      username_LONGEST_LENGTH_GT: Int
                      username_LONGEST_LENGTH_GTE: Int
                      username_LONGEST_LENGTH_LT: Int
                      username_LONGEST_LENGTH_LTE: Int
                      username_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      username_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int
                      username_SHORTEST_LENGTH_GT: Int
                      username_SHORTEST_LENGTH_GTE: Int
                      username_SHORTEST_LENGTH_LT: Int
                      username_SHORTEST_LENGTH_LTE: Int
                      username_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      username_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Person!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      node: PersonSubscriptionWhere
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: PersonUpdateInput
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    type MoviePersonActorsAggregationSelection {
                      count: Int!
                      node: MoviePersonActorsNodeAggregateSelection
                    }

                    type MoviePersonActorsNodeAggregateSelection {
                      username: StringAggregateSelection!
                    }

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsAggregate: MovieActorsAggregateInput
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere
                      actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type PeopleConnection {
                      edges: [PersonEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    interface Person {
                      username: String!
                    }

                    type PersonAggregateSelection {
                      count: Int!
                      username: StringAggregateSelection!
                    }

                    input PersonConnectWhere {
                      node: PersonWhere!
                    }

                    input PersonCreateInput {
                      Actor: ActorCreateInput
                    }

                    type PersonEdge {
                      cursor: String!
                      node: Person!
                    }

                    interface PersonEventPayload {
                      username: String!
                    }

                    enum PersonImplementation {
                      Actor
                    }

                    input PersonOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [PersonSort]
                    }

                    \\"\\"\\"
                    Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                    \\"\\"\\"
                    input PersonSort {
                      username: SortDirection
                    }

                    input PersonSubscriptionWhere {
                      AND: [PersonSubscriptionWhere!]
                      NOT: PersonSubscriptionWhere
                      OR: [PersonSubscriptionWhere!]
                      typename_IN: [PersonImplementation!]
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input PersonUpdateInput {
                      username: String
                    }

                    input PersonWhere {
                      AND: [PersonWhere!]
                      NOT: PersonWhere
                      OR: [PersonWhere!]
                      typename_IN: [PersonImplementation!]
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                      people(options: PersonOptions, where: PersonWhere): [Person!]!
                      peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                      peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });

            test("enable only value filters", async () => {
                const typeDefs = gql`
                    type Actor implements Person {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    interface Person {
                        username: String!
                    }

                    type Movie {
                        title: String
                        actors: [Person!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: true, byAggregate: false)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor implements Person {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload implements PersonEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      createdRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      deletedRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    input ActorRelationshipsSubscriptionWhere {
                      movies: ActorMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: PersonOptions, where: PersonWhere): [Person!]!
                      actorsAggregate(directed: Boolean = true, where: PersonWhere): MoviePersonActorsAggregationSelection
                      actorsConnection(after: String, directed: Boolean = true, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    input MovieActorsConnectFieldInput {
                      where: PersonConnectWhere
                    }

                    type MovieActorsConnectedRelationship {
                      node: PersonEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionSort {
                      node: PersonSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: PersonWhere
                      node_NOT: PersonWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsCreateFieldInput {
                      node: PersonCreateInput!
                    }

                    input MovieActorsDeleteFieldInput {
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsDisconnectFieldInput {
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Person!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      node: PersonSubscriptionWhere
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: PersonUpdateInput
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                      where: MovieActorsConnectionWhere
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    type MoviePersonActorsAggregationSelection {
                      count: Int!
                      node: MoviePersonActorsNodeAggregateSelection
                    }

                    type MoviePersonActorsNodeAggregateSelection {
                      username: StringAggregateSelection!
                    }

                    input MovieRelationInput {
                      actors: [MovieActorsCreateFieldInput!]
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere
                      actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type PeopleConnection {
                      edges: [PersonEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    interface Person {
                      username: String!
                    }

                    type PersonAggregateSelection {
                      count: Int!
                      username: StringAggregateSelection!
                    }

                    input PersonConnectWhere {
                      node: PersonWhere!
                    }

                    input PersonCreateInput {
                      Actor: ActorCreateInput
                    }

                    type PersonEdge {
                      cursor: String!
                      node: Person!
                    }

                    interface PersonEventPayload {
                      username: String!
                    }

                    enum PersonImplementation {
                      Actor
                    }

                    input PersonOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more PersonSort objects to sort People by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [PersonSort]
                    }

                    \\"\\"\\"
                    Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                    \\"\\"\\"
                    input PersonSort {
                      username: SortDirection
                    }

                    input PersonSubscriptionWhere {
                      AND: [PersonSubscriptionWhere!]
                      NOT: PersonSubscriptionWhere
                      OR: [PersonSubscriptionWhere!]
                      typename_IN: [PersonImplementation!]
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input PersonUpdateInput {
                      username: String
                    }

                    input PersonWhere {
                      AND: [PersonWhere!]
                      NOT: PersonWhere
                      OR: [PersonWhere!]
                      typename_IN: [PersonImplementation!]
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                      people(options: PersonOptions, where: PersonWhere): [Person!]!
                      peopleAggregate(where: PersonWhere): PersonAggregateSelection!
                      peopleConnection(after: String, first: Int, sort: [PersonSort], where: PersonWhere): PeopleConnection!
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });
        });

        describe("on UNION RELATIONSHIP FIELD, (aggregation does not exists on abstract types)", () => {
            test("default arguments should disable aggregation", async () => {
                const typeDefs = gql`
                    type Actor {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Appearance {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    union Person = Actor | Appearance

                    type Movie {
                        title: String
                        actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      createdRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      deletedRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    input ActorRelationshipsSubscriptionWhere {
                      movies: ActorMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Appearance {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): AppearanceMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [AppearanceMoviesConnectionSort!], where: AppearanceMoviesConnectionWhere): AppearanceMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type AppearanceAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input AppearanceConnectInput {
                      movies: [AppearanceMoviesConnectFieldInput!]
                    }

                    input AppearanceConnectWhere {
                      node: AppearanceWhere!
                    }

                    type AppearanceConnectedRelationships {
                      movies: AppearanceMoviesConnectedRelationship
                    }

                    input AppearanceCreateInput {
                      movies: AppearanceMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type AppearanceCreatedEvent {
                      createdAppearance: AppearanceEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input AppearanceDeleteInput {
                      movies: [AppearanceMoviesDeleteFieldInput!]
                    }

                    type AppearanceDeletedEvent {
                      deletedAppearance: AppearanceEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input AppearanceDisconnectInput {
                      movies: [AppearanceMoviesDisconnectFieldInput!]
                    }

                    type AppearanceEdge {
                      cursor: String!
                      node: Appearance!
                    }

                    type AppearanceEventPayload {
                      password: String!
                      username: String!
                    }

                    type AppearanceMovieMoviesAggregationSelection {
                      count: Int!
                      node: AppearanceMovieMoviesNodeAggregateSelection
                    }

                    type AppearanceMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input AppearanceMoviesAggregateInput {
                      AND: [AppearanceMoviesAggregateInput!]
                      NOT: AppearanceMoviesAggregateInput
                      OR: [AppearanceMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: AppearanceMoviesNodeAggregationWhereInput
                    }

                    input AppearanceMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type AppearanceMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type AppearanceMoviesConnection {
                      edges: [AppearanceMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input AppearanceMoviesConnectionSort {
                      node: MovieSort
                    }

                    input AppearanceMoviesConnectionWhere {
                      AND: [AppearanceMoviesConnectionWhere!]
                      NOT: AppearanceMoviesConnectionWhere
                      OR: [AppearanceMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input AppearanceMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input AppearanceMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceMoviesFieldInput {
                      connect: [AppearanceMoviesConnectFieldInput!]
                      create: [AppearanceMoviesCreateFieldInput!]
                    }

                    input AppearanceMoviesNodeAggregationWhereInput {
                      AND: [AppearanceMoviesNodeAggregationWhereInput!]
                      NOT: AppearanceMoviesNodeAggregationWhereInput
                      OR: [AppearanceMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type AppearanceMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input AppearanceMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input AppearanceMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input AppearanceMoviesUpdateFieldInput {
                      connect: [AppearanceMoviesConnectFieldInput!]
                      create: [AppearanceMoviesCreateFieldInput!]
                      delete: [AppearanceMoviesDeleteFieldInput!]
                      disconnect: [AppearanceMoviesDisconnectFieldInput!]
                      update: AppearanceMoviesUpdateConnectionInput
                      where: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more AppearanceSort objects to sort Appearances by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [AppearanceSort!]
                    }

                    input AppearanceRelationInput {
                      movies: [AppearanceMoviesCreateFieldInput!]
                    }

                    type AppearanceRelationshipCreatedEvent {
                      appearance: AppearanceEventPayload!
                      createdRelationship: AppearanceConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input AppearanceRelationshipCreatedSubscriptionWhere {
                      AND: [AppearanceRelationshipCreatedSubscriptionWhere!]
                      NOT: AppearanceRelationshipCreatedSubscriptionWhere
                      OR: [AppearanceRelationshipCreatedSubscriptionWhere!]
                      appearance: AppearanceSubscriptionWhere
                      createdRelationship: AppearanceRelationshipsSubscriptionWhere
                    }

                    type AppearanceRelationshipDeletedEvent {
                      appearance: AppearanceEventPayload!
                      deletedRelationship: AppearanceConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input AppearanceRelationshipDeletedSubscriptionWhere {
                      AND: [AppearanceRelationshipDeletedSubscriptionWhere!]
                      NOT: AppearanceRelationshipDeletedSubscriptionWhere
                      OR: [AppearanceRelationshipDeletedSubscriptionWhere!]
                      appearance: AppearanceSubscriptionWhere
                      deletedRelationship: AppearanceRelationshipsSubscriptionWhere
                    }

                    input AppearanceRelationshipsSubscriptionWhere {
                      movies: AppearanceMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Appearances by. The order in which sorts are applied is not guaranteed when specifying many fields in one AppearanceSort object.
                    \\"\\"\\"
                    input AppearanceSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input AppearanceSubscriptionWhere {
                      AND: [AppearanceSubscriptionWhere!]
                      NOT: AppearanceSubscriptionWhere
                      OR: [AppearanceSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input AppearanceUpdateInput {
                      movies: [AppearanceMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type AppearanceUpdatedEvent {
                      event: EventType!
                      previousState: AppearanceEventPayload!
                      timestamp: Float!
                      updatedAppearance: AppearanceEventPayload!
                    }

                    input AppearanceWhere {
                      AND: [AppearanceWhere!]
                      NOT: AppearanceWhere
                      OR: [AppearanceWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: AppearanceMoviesAggregateInput
                      moviesConnection: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Appearances where all of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where none of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: AppearanceMoviesConnectionWhere
                      moviesConnection_NOT: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Appearances where one of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where some of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: AppearanceMoviesConnectionWhere
                      \\"\\"\\"Return Appearances where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Appearances where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Appearances where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Appearances where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type AppearancesConnection {
                      edges: [AppearanceEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    type CreateAppearancesMutationResponse {
                      appearances: [Appearance!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                      actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    input MovieActorsActorConnectFieldInput {
                      connect: [ActorConnectInput!]
                      where: ActorConnectWhere
                    }

                    input MovieActorsActorConnectionWhere {
                      AND: [MovieActorsActorConnectionWhere!]
                      NOT: MovieActorsActorConnectionWhere
                      OR: [MovieActorsActorConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsActorCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsActorDeleteFieldInput {
                      delete: ActorDeleteInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorDisconnectFieldInput {
                      disconnect: ActorDisconnectInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                    }

                    input MovieActorsActorSubscriptionWhere {
                      node: ActorSubscriptionWhere
                    }

                    input MovieActorsActorUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsActorUpdateFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                      delete: [MovieActorsActorDeleteFieldInput!]
                      disconnect: [MovieActorsActorDisconnectFieldInput!]
                      update: MovieActorsActorUpdateConnectionInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsAppearanceConnectFieldInput {
                      connect: [AppearanceConnectInput!]
                      where: AppearanceConnectWhere
                    }

                    input MovieActorsAppearanceConnectionWhere {
                      AND: [MovieActorsAppearanceConnectionWhere!]
                      NOT: MovieActorsAppearanceConnectionWhere
                      OR: [MovieActorsAppearanceConnectionWhere!]
                      node: AppearanceWhere
                      node_NOT: AppearanceWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsAppearanceCreateFieldInput {
                      node: AppearanceCreateInput!
                    }

                    input MovieActorsAppearanceDeleteFieldInput {
                      delete: AppearanceDeleteInput
                      where: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsAppearanceDisconnectFieldInput {
                      disconnect: AppearanceDisconnectInput
                      where: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsAppearanceFieldInput {
                      connect: [MovieActorsAppearanceConnectFieldInput!]
                      create: [MovieActorsAppearanceCreateFieldInput!]
                    }

                    input MovieActorsAppearanceSubscriptionWhere {
                      node: AppearanceSubscriptionWhere
                    }

                    input MovieActorsAppearanceUpdateConnectionInput {
                      node: AppearanceUpdateInput
                    }

                    input MovieActorsAppearanceUpdateFieldInput {
                      connect: [MovieActorsAppearanceConnectFieldInput!]
                      create: [MovieActorsAppearanceCreateFieldInput!]
                      delete: [MovieActorsAppearanceDeleteFieldInput!]
                      disconnect: [MovieActorsAppearanceDisconnectFieldInput!]
                      update: MovieActorsAppearanceUpdateConnectionInput
                      where: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsConnectInput {
                      Actor: [MovieActorsActorConnectFieldInput!]
                      Appearance: [MovieActorsAppearanceConnectFieldInput!]
                    }

                    type MovieActorsConnectedRelationship {
                      node: PersonEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionWhere {
                      Actor: MovieActorsActorConnectionWhere
                      Appearance: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsCreateFieldInput {
                      Actor: [MovieActorsActorCreateFieldInput!]
                      Appearance: [MovieActorsAppearanceCreateFieldInput!]
                    }

                    input MovieActorsCreateInput {
                      Actor: MovieActorsActorFieldInput
                      Appearance: MovieActorsAppearanceFieldInput
                    }

                    input MovieActorsDeleteInput {
                      Actor: [MovieActorsActorDeleteFieldInput!]
                      Appearance: [MovieActorsAppearanceDeleteFieldInput!]
                    }

                    input MovieActorsDisconnectInput {
                      Actor: [MovieActorsActorDisconnectFieldInput!]
                      Appearance: [MovieActorsAppearanceDisconnectFieldInput!]
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Person!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      Actor: MovieActorsActorSubscriptionWhere
                      Appearance: MovieActorsAppearanceSubscriptionWhere
                    }

                    input MovieActorsUpdateInput {
                      Actor: [MovieActorsActorUpdateFieldInput!]
                      Appearance: [MovieActorsAppearanceUpdateFieldInput!]
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: MovieActorsConnectInput
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsCreateInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: MovieActorsDeleteInput
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: MovieActorsDisconnectInput
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    input MovieRelationInput {
                      actors: MovieActorsCreateFieldInput
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere
                      actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createAppearances(input: [AppearanceCreateInput!]!): CreateAppearancesMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteAppearances(delete: AppearanceDeleteInput, where: AppearanceWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateAppearances(connect: AppearanceConnectInput, create: AppearanceRelationInput, delete: AppearanceDeleteInput, disconnect: AppearanceDisconnectInput, update: AppearanceUpdateInput, where: AppearanceWhere): UpdateAppearancesMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    union Person = Actor | Appearance

                    union PersonEventPayload = ActorEventPayload | AppearanceEventPayload

                    input PersonWhere {
                      Actor: ActorWhere
                      Appearance: AppearanceWhere
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      appearances(options: AppearanceOptions, where: AppearanceWhere): [Appearance!]!
                      appearancesAggregate(where: AppearanceWhere): AppearanceAggregateSelection!
                      appearancesConnection(after: String, first: Int, sort: [AppearanceSort], where: AppearanceWhere): AppearancesConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                      people(options: QueryOptions, where: PersonWhere): [Person!]!
                    }

                    \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                    input QueryOptions {
                      limit: Int
                      offset: Int
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      appearanceCreated(where: AppearanceSubscriptionWhere): AppearanceCreatedEvent!
                      appearanceDeleted(where: AppearanceSubscriptionWhere): AppearanceDeletedEvent!
                      appearanceRelationshipCreated(where: AppearanceRelationshipCreatedSubscriptionWhere): AppearanceRelationshipCreatedEvent!
                      appearanceRelationshipDeleted(where: AppearanceRelationshipDeletedSubscriptionWhere): AppearanceRelationshipDeletedEvent!
                      appearanceUpdated(where: AppearanceSubscriptionWhere): AppearanceUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    type UpdateAppearancesMutationResponse {
                      appearances: [Appearance!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });

            test("enable value and aggregation filters", async () => {
                const typeDefs = gql`
                    type Actor {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Appearance {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    union Person = Actor | Appearance

                    type Movie {
                        title: String
                        actors: [Person!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: true, byAggregate: true)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      createdRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      deletedRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    input ActorRelationshipsSubscriptionWhere {
                      movies: ActorMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Appearance {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): AppearanceMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [AppearanceMoviesConnectionSort!], where: AppearanceMoviesConnectionWhere): AppearanceMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type AppearanceAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input AppearanceConnectInput {
                      movies: [AppearanceMoviesConnectFieldInput!]
                    }

                    input AppearanceConnectWhere {
                      node: AppearanceWhere!
                    }

                    type AppearanceConnectedRelationships {
                      movies: AppearanceMoviesConnectedRelationship
                    }

                    input AppearanceCreateInput {
                      movies: AppearanceMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type AppearanceCreatedEvent {
                      createdAppearance: AppearanceEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input AppearanceDeleteInput {
                      movies: [AppearanceMoviesDeleteFieldInput!]
                    }

                    type AppearanceDeletedEvent {
                      deletedAppearance: AppearanceEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input AppearanceDisconnectInput {
                      movies: [AppearanceMoviesDisconnectFieldInput!]
                    }

                    type AppearanceEdge {
                      cursor: String!
                      node: Appearance!
                    }

                    type AppearanceEventPayload {
                      password: String!
                      username: String!
                    }

                    type AppearanceMovieMoviesAggregationSelection {
                      count: Int!
                      node: AppearanceMovieMoviesNodeAggregateSelection
                    }

                    type AppearanceMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input AppearanceMoviesAggregateInput {
                      AND: [AppearanceMoviesAggregateInput!]
                      NOT: AppearanceMoviesAggregateInput
                      OR: [AppearanceMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: AppearanceMoviesNodeAggregationWhereInput
                    }

                    input AppearanceMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type AppearanceMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type AppearanceMoviesConnection {
                      edges: [AppearanceMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input AppearanceMoviesConnectionSort {
                      node: MovieSort
                    }

                    input AppearanceMoviesConnectionWhere {
                      AND: [AppearanceMoviesConnectionWhere!]
                      NOT: AppearanceMoviesConnectionWhere
                      OR: [AppearanceMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input AppearanceMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input AppearanceMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceMoviesFieldInput {
                      connect: [AppearanceMoviesConnectFieldInput!]
                      create: [AppearanceMoviesCreateFieldInput!]
                    }

                    input AppearanceMoviesNodeAggregationWhereInput {
                      AND: [AppearanceMoviesNodeAggregationWhereInput!]
                      NOT: AppearanceMoviesNodeAggregationWhereInput
                      OR: [AppearanceMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type AppearanceMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input AppearanceMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input AppearanceMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input AppearanceMoviesUpdateFieldInput {
                      connect: [AppearanceMoviesConnectFieldInput!]
                      create: [AppearanceMoviesCreateFieldInput!]
                      delete: [AppearanceMoviesDeleteFieldInput!]
                      disconnect: [AppearanceMoviesDisconnectFieldInput!]
                      update: AppearanceMoviesUpdateConnectionInput
                      where: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more AppearanceSort objects to sort Appearances by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [AppearanceSort!]
                    }

                    input AppearanceRelationInput {
                      movies: [AppearanceMoviesCreateFieldInput!]
                    }

                    type AppearanceRelationshipCreatedEvent {
                      appearance: AppearanceEventPayload!
                      createdRelationship: AppearanceConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input AppearanceRelationshipCreatedSubscriptionWhere {
                      AND: [AppearanceRelationshipCreatedSubscriptionWhere!]
                      NOT: AppearanceRelationshipCreatedSubscriptionWhere
                      OR: [AppearanceRelationshipCreatedSubscriptionWhere!]
                      appearance: AppearanceSubscriptionWhere
                      createdRelationship: AppearanceRelationshipsSubscriptionWhere
                    }

                    type AppearanceRelationshipDeletedEvent {
                      appearance: AppearanceEventPayload!
                      deletedRelationship: AppearanceConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input AppearanceRelationshipDeletedSubscriptionWhere {
                      AND: [AppearanceRelationshipDeletedSubscriptionWhere!]
                      NOT: AppearanceRelationshipDeletedSubscriptionWhere
                      OR: [AppearanceRelationshipDeletedSubscriptionWhere!]
                      appearance: AppearanceSubscriptionWhere
                      deletedRelationship: AppearanceRelationshipsSubscriptionWhere
                    }

                    input AppearanceRelationshipsSubscriptionWhere {
                      movies: AppearanceMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Appearances by. The order in which sorts are applied is not guaranteed when specifying many fields in one AppearanceSort object.
                    \\"\\"\\"
                    input AppearanceSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input AppearanceSubscriptionWhere {
                      AND: [AppearanceSubscriptionWhere!]
                      NOT: AppearanceSubscriptionWhere
                      OR: [AppearanceSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input AppearanceUpdateInput {
                      movies: [AppearanceMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type AppearanceUpdatedEvent {
                      event: EventType!
                      previousState: AppearanceEventPayload!
                      timestamp: Float!
                      updatedAppearance: AppearanceEventPayload!
                    }

                    input AppearanceWhere {
                      AND: [AppearanceWhere!]
                      NOT: AppearanceWhere
                      OR: [AppearanceWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: AppearanceMoviesAggregateInput
                      moviesConnection: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Appearances where all of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where none of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: AppearanceMoviesConnectionWhere
                      moviesConnection_NOT: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Appearances where one of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where some of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: AppearanceMoviesConnectionWhere
                      \\"\\"\\"Return Appearances where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Appearances where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Appearances where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Appearances where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type AppearancesConnection {
                      edges: [AppearanceEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    type CreateAppearancesMutationResponse {
                      appearances: [Appearance!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                      actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    input MovieActorsActorConnectFieldInput {
                      connect: [ActorConnectInput!]
                      where: ActorConnectWhere
                    }

                    input MovieActorsActorConnectionWhere {
                      AND: [MovieActorsActorConnectionWhere!]
                      NOT: MovieActorsActorConnectionWhere
                      OR: [MovieActorsActorConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsActorCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsActorDeleteFieldInput {
                      delete: ActorDeleteInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorDisconnectFieldInput {
                      disconnect: ActorDisconnectInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                    }

                    input MovieActorsActorSubscriptionWhere {
                      node: ActorSubscriptionWhere
                    }

                    input MovieActorsActorUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsActorUpdateFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                      delete: [MovieActorsActorDeleteFieldInput!]
                      disconnect: [MovieActorsActorDisconnectFieldInput!]
                      update: MovieActorsActorUpdateConnectionInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsAppearanceConnectFieldInput {
                      connect: [AppearanceConnectInput!]
                      where: AppearanceConnectWhere
                    }

                    input MovieActorsAppearanceConnectionWhere {
                      AND: [MovieActorsAppearanceConnectionWhere!]
                      NOT: MovieActorsAppearanceConnectionWhere
                      OR: [MovieActorsAppearanceConnectionWhere!]
                      node: AppearanceWhere
                      node_NOT: AppearanceWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsAppearanceCreateFieldInput {
                      node: AppearanceCreateInput!
                    }

                    input MovieActorsAppearanceDeleteFieldInput {
                      delete: AppearanceDeleteInput
                      where: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsAppearanceDisconnectFieldInput {
                      disconnect: AppearanceDisconnectInput
                      where: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsAppearanceFieldInput {
                      connect: [MovieActorsAppearanceConnectFieldInput!]
                      create: [MovieActorsAppearanceCreateFieldInput!]
                    }

                    input MovieActorsAppearanceSubscriptionWhere {
                      node: AppearanceSubscriptionWhere
                    }

                    input MovieActorsAppearanceUpdateConnectionInput {
                      node: AppearanceUpdateInput
                    }

                    input MovieActorsAppearanceUpdateFieldInput {
                      connect: [MovieActorsAppearanceConnectFieldInput!]
                      create: [MovieActorsAppearanceCreateFieldInput!]
                      delete: [MovieActorsAppearanceDeleteFieldInput!]
                      disconnect: [MovieActorsAppearanceDisconnectFieldInput!]
                      update: MovieActorsAppearanceUpdateConnectionInput
                      where: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsConnectInput {
                      Actor: [MovieActorsActorConnectFieldInput!]
                      Appearance: [MovieActorsAppearanceConnectFieldInput!]
                    }

                    type MovieActorsConnectedRelationship {
                      node: PersonEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionWhere {
                      Actor: MovieActorsActorConnectionWhere
                      Appearance: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsCreateFieldInput {
                      Actor: [MovieActorsActorCreateFieldInput!]
                      Appearance: [MovieActorsAppearanceCreateFieldInput!]
                    }

                    input MovieActorsCreateInput {
                      Actor: MovieActorsActorFieldInput
                      Appearance: MovieActorsAppearanceFieldInput
                    }

                    input MovieActorsDeleteInput {
                      Actor: [MovieActorsActorDeleteFieldInput!]
                      Appearance: [MovieActorsAppearanceDeleteFieldInput!]
                    }

                    input MovieActorsDisconnectInput {
                      Actor: [MovieActorsActorDisconnectFieldInput!]
                      Appearance: [MovieActorsAppearanceDisconnectFieldInput!]
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Person!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      Actor: MovieActorsActorSubscriptionWhere
                      Appearance: MovieActorsAppearanceSubscriptionWhere
                    }

                    input MovieActorsUpdateInput {
                      Actor: [MovieActorsActorUpdateFieldInput!]
                      Appearance: [MovieActorsAppearanceUpdateFieldInput!]
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: MovieActorsConnectInput
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsCreateInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: MovieActorsDeleteInput
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: MovieActorsDisconnectInput
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    input MovieRelationInput {
                      actors: MovieActorsCreateFieldInput
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere
                      actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createAppearances(input: [AppearanceCreateInput!]!): CreateAppearancesMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteAppearances(delete: AppearanceDeleteInput, where: AppearanceWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateAppearances(connect: AppearanceConnectInput, create: AppearanceRelationInput, delete: AppearanceDeleteInput, disconnect: AppearanceDisconnectInput, update: AppearanceUpdateInput, where: AppearanceWhere): UpdateAppearancesMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    union Person = Actor | Appearance

                    union PersonEventPayload = ActorEventPayload | AppearanceEventPayload

                    input PersonWhere {
                      Actor: ActorWhere
                      Appearance: AppearanceWhere
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      appearances(options: AppearanceOptions, where: AppearanceWhere): [Appearance!]!
                      appearancesAggregate(where: AppearanceWhere): AppearanceAggregateSelection!
                      appearancesConnection(after: String, first: Int, sort: [AppearanceSort], where: AppearanceWhere): AppearancesConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                      people(options: QueryOptions, where: PersonWhere): [Person!]!
                    }

                    \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                    input QueryOptions {
                      limit: Int
                      offset: Int
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      appearanceCreated(where: AppearanceSubscriptionWhere): AppearanceCreatedEvent!
                      appearanceDeleted(where: AppearanceSubscriptionWhere): AppearanceDeletedEvent!
                      appearanceRelationshipCreated(where: AppearanceRelationshipCreatedSubscriptionWhere): AppearanceRelationshipCreatedEvent!
                      appearanceRelationshipDeleted(where: AppearanceRelationshipDeletedSubscriptionWhere): AppearanceRelationshipDeletedEvent!
                      appearanceUpdated(where: AppearanceSubscriptionWhere): AppearanceUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    type UpdateAppearancesMutationResponse {
                      appearances: [Appearance!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });

            test("enable only value filters", async () => {
                const typeDefs = gql`
                    type Actor {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Appearance {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    union Person = Actor | Appearance

                    type Movie {
                        title: String
                        actors: [Person!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: true, byAggregate: false)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: plugin,
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                      subscription: Subscription
                    }

                    type Actor {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): ActorMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    type ActorConnectedRelationships {
                      movies: ActorMoviesConnectedRelationship
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type ActorCreatedEvent {
                      createdActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorDeletedEvent {
                      deletedActor: ActorEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregationSelection {
                      count: Int!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type ActorMoviesConnection {
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input ActorMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input ActorMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                    }

                    input ActorMoviesNodeAggregationWhereInput {
                      AND: [ActorMoviesNodeAggregationWhereInput!]
                      NOT: ActorMoviesNodeAggregationWhereInput
                      OR: [ActorMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more ActorSort objects to sort Actors by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [ActorSort!]
                    }

                    input ActorRelationInput {
                      movies: [ActorMoviesCreateFieldInput!]
                    }

                    type ActorRelationshipCreatedEvent {
                      actor: ActorEventPayload!
                      createdRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipCreatedSubscriptionWhere {
                      AND: [ActorRelationshipCreatedSubscriptionWhere!]
                      NOT: ActorRelationshipCreatedSubscriptionWhere
                      OR: [ActorRelationshipCreatedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      createdRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    type ActorRelationshipDeletedEvent {
                      actor: ActorEventPayload!
                      deletedRelationship: ActorConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input ActorRelationshipDeletedSubscriptionWhere {
                      AND: [ActorRelationshipDeletedSubscriptionWhere!]
                      NOT: ActorRelationshipDeletedSubscriptionWhere
                      OR: [ActorRelationshipDeletedSubscriptionWhere!]
                      actor: ActorSubscriptionWhere
                      deletedRelationship: ActorRelationshipsSubscriptionWhere
                    }

                    input ActorRelationshipsSubscriptionWhere {
                      movies: ActorMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type ActorUpdatedEvent {
                      event: EventType!
                      previousState: ActorEventPayload!
                      timestamp: Float!
                      updatedActor: ActorEventPayload!
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: ActorMoviesAggregateInput
                      moviesConnection: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere
                      moviesConnection_NOT: ActorMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type ActorsConnection {
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Appearance {
                      movies(directed: Boolean = true, options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(directed: Boolean = true, where: MovieWhere): AppearanceMovieMoviesAggregationSelection
                      moviesConnection(after: String, directed: Boolean = true, first: Int, sort: [AppearanceMoviesConnectionSort!], where: AppearanceMoviesConnectionWhere): AppearanceMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type AppearanceAggregateSelection {
                      count: Int!
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input AppearanceConnectInput {
                      movies: [AppearanceMoviesConnectFieldInput!]
                    }

                    input AppearanceConnectWhere {
                      node: AppearanceWhere!
                    }

                    type AppearanceConnectedRelationships {
                      movies: AppearanceMoviesConnectedRelationship
                    }

                    input AppearanceCreateInput {
                      movies: AppearanceMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    type AppearanceCreatedEvent {
                      createdAppearance: AppearanceEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input AppearanceDeleteInput {
                      movies: [AppearanceMoviesDeleteFieldInput!]
                    }

                    type AppearanceDeletedEvent {
                      deletedAppearance: AppearanceEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input AppearanceDisconnectInput {
                      movies: [AppearanceMoviesDisconnectFieldInput!]
                    }

                    type AppearanceEdge {
                      cursor: String!
                      node: Appearance!
                    }

                    type AppearanceEventPayload {
                      password: String!
                      username: String!
                    }

                    type AppearanceMovieMoviesAggregationSelection {
                      count: Int!
                      node: AppearanceMovieMoviesNodeAggregateSelection
                    }

                    type AppearanceMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input AppearanceMoviesAggregateInput {
                      AND: [AppearanceMoviesAggregateInput!]
                      NOT: AppearanceMoviesAggregateInput
                      OR: [AppearanceMoviesAggregateInput!]
                      count: Int
                      count_GT: Int
                      count_GTE: Int
                      count_LT: Int
                      count_LTE: Int
                      node: AppearanceMoviesNodeAggregationWhereInput
                    }

                    input AppearanceMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      \\"\\"\\"
                      Whether or not to overwrite any matching relationship with the new properties.
                      \\"\\"\\"
                      overwrite: Boolean! = true
                      where: MovieConnectWhere
                    }

                    type AppearanceMoviesConnectedRelationship {
                      node: MovieEventPayload!
                    }

                    type AppearanceMoviesConnection {
                      edges: [AppearanceMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input AppearanceMoviesConnectionSort {
                      node: MovieSort
                    }

                    input AppearanceMoviesConnectionWhere {
                      AND: [AppearanceMoviesConnectionWhere!]
                      NOT: AppearanceMoviesConnectionWhere
                      OR: [AppearanceMoviesConnectionWhere!]
                      node: MovieWhere
                      node_NOT: MovieWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input AppearanceMoviesCreateFieldInput {
                      node: MovieCreateInput!
                    }

                    input AppearanceMoviesDeleteFieldInput {
                      delete: MovieDeleteInput
                      where: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceMoviesDisconnectFieldInput {
                      disconnect: MovieDisconnectInput
                      where: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceMoviesFieldInput {
                      connect: [AppearanceMoviesConnectFieldInput!]
                      create: [AppearanceMoviesCreateFieldInput!]
                    }

                    input AppearanceMoviesNodeAggregationWhereInput {
                      AND: [AppearanceMoviesNodeAggregationWhereInput!]
                      NOT: AppearanceMoviesNodeAggregationWhereInput
                      OR: [AppearanceMoviesNodeAggregationWhereInput!]
                      title_AVERAGE_EQUAL: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_GTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LENGTH_EQUAL: Float
                      title_AVERAGE_LENGTH_GT: Float
                      title_AVERAGE_LENGTH_GTE: Float
                      title_AVERAGE_LENGTH_LT: Float
                      title_AVERAGE_LENGTH_LTE: Float
                      title_AVERAGE_LT: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_AVERAGE_LTE: Float @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_EQUAL: String @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_GTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LONGEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LENGTH_EQUAL: Int
                      title_LONGEST_LENGTH_GT: Int
                      title_LONGEST_LENGTH_GTE: Int
                      title_LONGEST_LENGTH_LT: Int
                      title_LONGEST_LENGTH_LTE: Int
                      title_LONGEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LONGEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_LT: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_LTE: Int @deprecated(reason: \\"Aggregation filters that are not relying on an aggregating function will be deprecated.\\")
                      title_SHORTEST_EQUAL: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_GTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int
                      title_SHORTEST_LENGTH_GT: Int
                      title_SHORTEST_LENGTH_GTE: Int
                      title_SHORTEST_LENGTH_LT: Int
                      title_SHORTEST_LENGTH_LTE: Int
                      title_SHORTEST_LT: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                      title_SHORTEST_LTE: Int @deprecated(reason: \\"Please use the explicit _LENGTH version for string aggregation.\\")
                    }

                    type AppearanceMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input AppearanceMoviesRelationshipSubscriptionWhere {
                      node: MovieSubscriptionWhere
                    }

                    input AppearanceMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                    }

                    input AppearanceMoviesUpdateFieldInput {
                      connect: [AppearanceMoviesConnectFieldInput!]
                      create: [AppearanceMoviesCreateFieldInput!]
                      delete: [AppearanceMoviesDeleteFieldInput!]
                      disconnect: [AppearanceMoviesDisconnectFieldInput!]
                      update: AppearanceMoviesUpdateConnectionInput
                      where: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more AppearanceSort objects to sort Appearances by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [AppearanceSort!]
                    }

                    input AppearanceRelationInput {
                      movies: [AppearanceMoviesCreateFieldInput!]
                    }

                    type AppearanceRelationshipCreatedEvent {
                      appearance: AppearanceEventPayload!
                      createdRelationship: AppearanceConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input AppearanceRelationshipCreatedSubscriptionWhere {
                      AND: [AppearanceRelationshipCreatedSubscriptionWhere!]
                      NOT: AppearanceRelationshipCreatedSubscriptionWhere
                      OR: [AppearanceRelationshipCreatedSubscriptionWhere!]
                      appearance: AppearanceSubscriptionWhere
                      createdRelationship: AppearanceRelationshipsSubscriptionWhere
                    }

                    type AppearanceRelationshipDeletedEvent {
                      appearance: AppearanceEventPayload!
                      deletedRelationship: AppearanceConnectedRelationships!
                      event: EventType!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input AppearanceRelationshipDeletedSubscriptionWhere {
                      AND: [AppearanceRelationshipDeletedSubscriptionWhere!]
                      NOT: AppearanceRelationshipDeletedSubscriptionWhere
                      OR: [AppearanceRelationshipDeletedSubscriptionWhere!]
                      appearance: AppearanceSubscriptionWhere
                      deletedRelationship: AppearanceRelationshipsSubscriptionWhere
                    }

                    input AppearanceRelationshipsSubscriptionWhere {
                      movies: AppearanceMoviesRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Appearances by. The order in which sorts are applied is not guaranteed when specifying many fields in one AppearanceSort object.
                    \\"\\"\\"
                    input AppearanceSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input AppearanceSubscriptionWhere {
                      AND: [AppearanceSubscriptionWhere!]
                      NOT: AppearanceSubscriptionWhere
                      OR: [AppearanceSubscriptionWhere!]
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    input AppearanceUpdateInput {
                      movies: [AppearanceMoviesUpdateFieldInput!]
                      password: String
                      username: String
                    }

                    type AppearanceUpdatedEvent {
                      event: EventType!
                      previousState: AppearanceEventPayload!
                      timestamp: Float!
                      updatedAppearance: AppearanceEventPayload!
                    }

                    input AppearanceWhere {
                      AND: [AppearanceWhere!]
                      NOT: AppearanceWhere
                      OR: [AppearanceWhere!]
                      movies: MovieWhere @deprecated(reason: \\"Use \`movies_SOME\` instead.\\")
                      moviesAggregate: AppearanceMoviesAggregateInput
                      moviesConnection: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Appearances where all of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where none of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: AppearanceMoviesConnectionWhere
                      moviesConnection_NOT: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Use \`moviesConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Appearances where one of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where some of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: AppearanceMoviesConnectionWhere
                      \\"\\"\\"Return Appearances where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere
                      \\"\\"\\"Return Appearances where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere
                      movies_NOT: MovieWhere @deprecated(reason: \\"Use \`movies_NONE\` instead.\\")
                      \\"\\"\\"Return Appearances where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere
                      \\"\\"\\"Return Appearances where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere
                      password: String
                      password_CONTAINS: String
                      password_ENDS_WITH: String
                      password_IN: [String!]
                      password_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      password_STARTS_WITH: String
                      username: String
                      username_CONTAINS: String
                      username_ENDS_WITH: String
                      username_IN: [String!]
                      username_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_IN: [String!] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      username_STARTS_WITH: String
                    }

                    type AppearancesConnection {
                      edges: [AppearanceEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    type CreateAppearancesMutationResponse {
                      appearances: [Appearance!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      relationshipsCreated: Int!
                    }

                    type CreateMoviesMutationResponse {
                      info: CreateInfo!
                      movies: [Movie!]!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships deleted during a delete mutation
                    \\"\\"\\"
                    type DeleteInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
                    }

                    type Movie {
                      actors(directed: Boolean = true, options: QueryOptions, where: PersonWhere): [Person!]!
                      actorsConnection(after: String, directed: Boolean = true, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    input MovieActorsActorConnectFieldInput {
                      connect: [ActorConnectInput!]
                      where: ActorConnectWhere
                    }

                    input MovieActorsActorConnectionWhere {
                      AND: [MovieActorsActorConnectionWhere!]
                      NOT: MovieActorsActorConnectionWhere
                      OR: [MovieActorsActorConnectionWhere!]
                      node: ActorWhere
                      node_NOT: ActorWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsActorCreateFieldInput {
                      node: ActorCreateInput!
                    }

                    input MovieActorsActorDeleteFieldInput {
                      delete: ActorDeleteInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorDisconnectFieldInput {
                      disconnect: ActorDisconnectInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                    }

                    input MovieActorsActorSubscriptionWhere {
                      node: ActorSubscriptionWhere
                    }

                    input MovieActorsActorUpdateConnectionInput {
                      node: ActorUpdateInput
                    }

                    input MovieActorsActorUpdateFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                      delete: [MovieActorsActorDeleteFieldInput!]
                      disconnect: [MovieActorsActorDisconnectFieldInput!]
                      update: MovieActorsActorUpdateConnectionInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsAppearanceConnectFieldInput {
                      connect: [AppearanceConnectInput!]
                      where: AppearanceConnectWhere
                    }

                    input MovieActorsAppearanceConnectionWhere {
                      AND: [MovieActorsAppearanceConnectionWhere!]
                      NOT: MovieActorsAppearanceConnectionWhere
                      OR: [MovieActorsAppearanceConnectionWhere!]
                      node: AppearanceWhere
                      node_NOT: AppearanceWhere @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                    }

                    input MovieActorsAppearanceCreateFieldInput {
                      node: AppearanceCreateInput!
                    }

                    input MovieActorsAppearanceDeleteFieldInput {
                      delete: AppearanceDeleteInput
                      where: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsAppearanceDisconnectFieldInput {
                      disconnect: AppearanceDisconnectInput
                      where: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsAppearanceFieldInput {
                      connect: [MovieActorsAppearanceConnectFieldInput!]
                      create: [MovieActorsAppearanceCreateFieldInput!]
                    }

                    input MovieActorsAppearanceSubscriptionWhere {
                      node: AppearanceSubscriptionWhere
                    }

                    input MovieActorsAppearanceUpdateConnectionInput {
                      node: AppearanceUpdateInput
                    }

                    input MovieActorsAppearanceUpdateFieldInput {
                      connect: [MovieActorsAppearanceConnectFieldInput!]
                      create: [MovieActorsAppearanceCreateFieldInput!]
                      delete: [MovieActorsAppearanceDeleteFieldInput!]
                      disconnect: [MovieActorsAppearanceDisconnectFieldInput!]
                      update: MovieActorsAppearanceUpdateConnectionInput
                      where: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsConnectInput {
                      Actor: [MovieActorsActorConnectFieldInput!]
                      Appearance: [MovieActorsAppearanceConnectFieldInput!]
                    }

                    type MovieActorsConnectedRelationship {
                      node: PersonEventPayload!
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionWhere {
                      Actor: MovieActorsActorConnectionWhere
                      Appearance: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsCreateFieldInput {
                      Actor: [MovieActorsActorCreateFieldInput!]
                      Appearance: [MovieActorsAppearanceCreateFieldInput!]
                    }

                    input MovieActorsCreateInput {
                      Actor: MovieActorsActorFieldInput
                      Appearance: MovieActorsAppearanceFieldInput
                    }

                    input MovieActorsDeleteInput {
                      Actor: [MovieActorsActorDeleteFieldInput!]
                      Appearance: [MovieActorsAppearanceDeleteFieldInput!]
                    }

                    input MovieActorsDisconnectInput {
                      Actor: [MovieActorsActorDisconnectFieldInput!]
                      Appearance: [MovieActorsAppearanceDisconnectFieldInput!]
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Person!
                    }

                    input MovieActorsRelationshipSubscriptionWhere {
                      Actor: MovieActorsActorSubscriptionWhere
                      Appearance: MovieActorsAppearanceSubscriptionWhere
                    }

                    input MovieActorsUpdateInput {
                      Actor: [MovieActorsActorUpdateFieldInput!]
                      Appearance: [MovieActorsAppearanceUpdateFieldInput!]
                    }

                    type MovieAggregateSelection {
                      count: Int!
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: MovieActorsConnectInput
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    type MovieConnectedRelationships {
                      actors: MovieActorsConnectedRelationship
                    }

                    input MovieCreateInput {
                      actors: MovieActorsCreateInput
                      title: String
                    }

                    type MovieCreatedEvent {
                      createdMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDeleteInput {
                      actors: MovieActorsDeleteInput
                    }

                    type MovieDeletedEvent {
                      deletedMovie: MovieEventPayload!
                      event: EventType!
                      timestamp: Float!
                    }

                    input MovieDisconnectInput {
                      actors: MovieActorsDisconnectInput
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MovieEventPayload {
                      title: String
                    }

                    input MovieOptions {
                      limit: Int
                      offset: Int
                      \\"\\"\\"
                      Specify one or more MovieSort objects to sort Movies by. The sorts will be applied in the order in which they are arranged in the array.
                      \\"\\"\\"
                      sort: [MovieSort!]
                    }

                    input MovieRelationInput {
                      actors: MovieActorsCreateFieldInput
                    }

                    type MovieRelationshipCreatedEvent {
                      createdRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipCreatedSubscriptionWhere {
                      AND: [MovieRelationshipCreatedSubscriptionWhere!]
                      NOT: MovieRelationshipCreatedSubscriptionWhere
                      OR: [MovieRelationshipCreatedSubscriptionWhere!]
                      createdRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    type MovieRelationshipDeletedEvent {
                      deletedRelationship: MovieConnectedRelationships!
                      event: EventType!
                      movie: MovieEventPayload!
                      relationshipFieldName: String!
                      timestamp: Float!
                    }

                    input MovieRelationshipDeletedSubscriptionWhere {
                      AND: [MovieRelationshipDeletedSubscriptionWhere!]
                      NOT: MovieRelationshipDeletedSubscriptionWhere
                      OR: [MovieRelationshipDeletedSubscriptionWhere!]
                      deletedRelationship: MovieRelationshipsSubscriptionWhere
                      movie: MovieSubscriptionWhere
                    }

                    input MovieRelationshipsSubscriptionWhere {
                      actors: MovieActorsRelationshipSubscriptionWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: String
                    }

                    type MovieUpdatedEvent {
                      event: EventType!
                      previousState: MovieEventPayload!
                      timestamp: Float!
                      updatedMovie: MovieEventPayload!
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: PersonWhere @deprecated(reason: \\"Use \`actors_SOME\` instead.\\")
                      actorsConnection: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_SOME\` instead.\\")
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere
                      actorsConnection_NOT: MovieActorsConnectionWhere @deprecated(reason: \\"Use \`actorsConnection_NONE\` instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere
                      actors_NOT: PersonWhere @deprecated(reason: \\"Use \`actors_NONE\` instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere
                      title: String
                      title_CONTAINS: String
                      title_ENDS_WITH: String
                      title_IN: [String]
                      title_NOT: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_CONTAINS: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_ENDS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_IN: [String] @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_NOT_STARTS_WITH: String @deprecated(reason: \\"Negation filters will be deprecated, use the NOT operator to achieve the same behavior\\")
                      title_STARTS_WITH: String
                    }

                    type MoviesConnection {
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createAppearances(input: [AppearanceCreateInput!]!): CreateAppearancesMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteAppearances(delete: AppearanceDeleteInput, where: AppearanceWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(connect: ActorConnectInput, create: ActorRelationInput, delete: ActorDeleteInput, disconnect: ActorDisconnectInput, update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateAppearances(connect: AppearanceConnectInput, create: AppearanceRelationInput, delete: AppearanceDeleteInput, disconnect: AppearanceDisconnectInput, update: AppearanceUpdateInput, where: AppearanceWhere): UpdateAppearancesMutationResponse!
                      updateMovies(connect: MovieConnectInput, create: MovieRelationInput, delete: MovieDeleteInput, disconnect: MovieDisconnectInput, update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    union Person = Actor | Appearance

                    union PersonEventPayload = ActorEventPayload | AppearanceEventPayload

                    input PersonWhere {
                      Actor: ActorWhere
                      Appearance: AppearanceWhere
                    }

                    type Query {
                      actors(options: ActorOptions, where: ActorWhere): [Actor!]!
                      actorsAggregate(where: ActorWhere): ActorAggregateSelection!
                      actorsConnection(after: String, first: Int, sort: [ActorSort], where: ActorWhere): ActorsConnection!
                      appearances(options: AppearanceOptions, where: AppearanceWhere): [Appearance!]!
                      appearancesAggregate(where: AppearanceWhere): AppearanceAggregateSelection!
                      appearancesConnection(after: String, first: Int, sort: [AppearanceSort], where: AppearanceWhere): AppearancesConnection!
                      movies(options: MovieOptions, where: MovieWhere): [Movie!]!
                      moviesAggregate(where: MovieWhere): MovieAggregateSelection!
                      moviesConnection(after: String, first: Int, sort: [MovieSort], where: MovieWhere): MoviesConnection!
                      people(options: QueryOptions, where: PersonWhere): [Person!]!
                    }

                    \\"\\"\\"Input type for options that can be specified on a query operation.\\"\\"\\"
                    input QueryOptions {
                      limit: Int
                      offset: Int
                    }

                    \\"\\"\\"An enum for sorting in either ascending or descending order.\\"\\"\\"
                    enum SortDirection {
                      \\"\\"\\"Sort by field values in ascending order.\\"\\"\\"
                      ASC
                      \\"\\"\\"Sort by field values in descending order.\\"\\"\\"
                      DESC
                    }

                    type StringAggregateSelection {
                      longest: String
                      shortest: String
                    }

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorRelationshipCreated(where: ActorRelationshipCreatedSubscriptionWhere): ActorRelationshipCreatedEvent!
                      actorRelationshipDeleted(where: ActorRelationshipDeletedSubscriptionWhere): ActorRelationshipDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      appearanceCreated(where: AppearanceSubscriptionWhere): AppearanceCreatedEvent!
                      appearanceDeleted(where: AppearanceSubscriptionWhere): AppearanceDeletedEvent!
                      appearanceRelationshipCreated(where: AppearanceRelationshipCreatedSubscriptionWhere): AppearanceRelationshipCreatedEvent!
                      appearanceRelationshipDeleted(where: AppearanceRelationshipDeletedSubscriptionWhere): AppearanceRelationshipDeletedEvent!
                      appearanceUpdated(where: AppearanceSubscriptionWhere): AppearanceUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
                      movieRelationshipCreated(where: MovieRelationshipCreatedSubscriptionWhere): MovieRelationshipCreatedEvent!
                      movieRelationshipDeleted(where: MovieRelationshipDeletedSubscriptionWhere): MovieRelationshipDeletedEvent!
                      movieUpdated(where: MovieSubscriptionWhere): MovieUpdatedEvent!
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    type UpdateAppearancesMutationResponse {
                      appearances: [Appearance!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
                      bookmark: String @deprecated(reason: \\"This field has been deprecated because bookmarks are now handled by the driver.\\")
                      nodesCreated: Int!
                      nodesDeleted: Int!
                      relationshipsCreated: Int!
                      relationshipsDeleted: Int!
                    }

                    type UpdateMoviesMutationResponse {
                      info: UpdateInfo!
                      movies: [Movie!]!
                    }"
                `);
            });
        });
    });
});
