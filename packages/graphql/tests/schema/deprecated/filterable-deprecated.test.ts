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
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";

describe("@filterable directive - deprecated", () => {
    describe("on SCALAR", () => {
        test("enable only aggregation filters", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    title: String @filterable(byValue: false, byAggregate: true)
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
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

            const title_AGG = aggregationWhereInputFields["title"];
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
                title_AGG,
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
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
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
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    title: String
                    actors: [Actor!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
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
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    title: String
                    actors: [Actor!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: false, byAggregate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
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
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    title: String
                    actors: [Actor!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
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
                type Actor implements Person @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                interface Person {
                    username: String!
                }

                type Movie @node {
                    title: String
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
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
                type Actor implements Person @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                interface Person {
                    username: String!
                }

                type Movie @node {
                    title: String
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
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
                type Actor implements Person @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                interface Person {
                    username: String!
                }

                type Movie @node {
                    title: String
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
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
                type Actor implements Person @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                interface Person {
                    username: String!
                }

                type Movie @node {
                    title: String
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: false, byAggregate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
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
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Appearance @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                union Person = Actor | Appearance

                type Movie @node {
                    title: String
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
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
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Appearance @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                union Person = Actor | Appearance

                type Movie @node {
                    title: String
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: true)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
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
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Appearance @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                union Person = Actor | Appearance

                type Movie @node {
                    title: String
                    actors: [Person!]!
                        @relationship(type: "ACTED_IN", direction: IN)
                        @filterable(byValue: true, byAggregate: false)
                }
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionALL = movieWhereFields["actorsConnection_ALL"];
            const actorsConnectionNONE = movieWhereFields["actorsConnection_NONE"];
            const actorsConnectionSINGLE = movieWhereFields["actorsConnection_SINGLE"];
            const actorsConnectionSOME = movieWhereFields["actorsConnection_SOME"];

            const actorsConnectionFilters = [
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
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String @filterable
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    input ActorRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
                      all: ActorWhere
                      \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
                      none: ActorWhere
                      \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
                      single: ActorWhere
                      \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
                      some: ActorWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregateSelection {
                      count: CountConnection!
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
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MovieActorActorsAggregateSelection!
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionAggregateInput {
                      AND: [MovieActorsConnectionAggregateInput!]
                      NOT: MovieActorsConnectionAggregateInput
                      OR: [MovieActorsConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"Filter Movies by aggregating results on related MovieActorsConnections\\"\\"\\"
                      aggregate: MovieActorsConnectionAggregateInput
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      all: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      none: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      single: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      some: MovieActorsConnectionWhere
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
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
                      password: StringScalarAggregationFilters
                      password_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { eq: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gte: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { eq: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { eq: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lte: ... } } }' instead.\\")
                      username: StringScalarAggregationFilters
                      username_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { eq: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gte: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { eq: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { eq: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorRelationshipFilters
                      actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
                      actorsConnection: MovieActorsConnectionFilters
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
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
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String @filterable(byValue: true, byAggregate: true)
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    input ActorRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
                      all: ActorWhere
                      \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
                      none: ActorWhere
                      \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
                      single: ActorWhere
                      \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
                      some: ActorWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregateSelection {
                      count: CountConnection!
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
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MovieActorActorsAggregateSelection!
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionAggregateInput {
                      AND: [MovieActorsConnectionAggregateInput!]
                      NOT: MovieActorsConnectionAggregateInput
                      OR: [MovieActorsConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"Filter Movies by aggregating results on related MovieActorsConnections\\"\\"\\"
                      aggregate: MovieActorsConnectionAggregateInput
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      all: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      none: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      single: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      some: MovieActorsConnectionWhere
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
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
                      password: StringScalarAggregationFilters
                      password_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { eq: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gte: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { eq: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { eq: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lte: ... } } }' instead.\\")
                      username: StringScalarAggregationFilters
                      username_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { eq: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gte: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { eq: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { eq: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorRelationshipFilters
                      actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
                      actorsConnection: MovieActorsConnectionFilters
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
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
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String @filterable(byValue: false, byAggregate: true)
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    input ActorRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
                      all: ActorWhere
                      \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
                      none: ActorWhere
                      \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
                      single: ActorWhere
                      \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
                      some: ActorWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregateSelection {
                      count: CountConnection!
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
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MovieActorActorsAggregateSelection!
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionAggregateInput {
                      AND: [MovieActorsConnectionAggregateInput!]
                      NOT: MovieActorsConnectionAggregateInput
                      OR: [MovieActorsConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"Filter Movies by aggregating results on related MovieActorsConnections\\"\\"\\"
                      aggregate: MovieActorsConnectionAggregateInput
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      all: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      none: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      single: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      some: MovieActorsConnectionWhere
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
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
                      password: StringScalarAggregationFilters
                      password_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { eq: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gte: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { eq: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { eq: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lte: ... } } }' instead.\\")
                      username: StringScalarAggregationFilters
                      username_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { eq: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gte: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { eq: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { eq: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorRelationshipFilters
                      actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
                      actorsConnection: MovieActorsConnectionFilters
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
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
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    input ActorRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
                      all: ActorWhere
                      \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
                      none: ActorWhere
                      \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
                      single: ActorWhere
                      \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
                      some: ActorWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregateSelection {
                      count: CountConnection!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MovieActorActorsAggregateSelection!
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      all: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      none: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      single: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      some: MovieActorsConnectionWhere
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
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

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorRelationshipFilters
                      actorsConnection: MovieActorsConnectionFilters
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
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
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String
                        actors: [Actor!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: true, byAggregate: true)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    input ActorRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
                      all: ActorWhere
                      \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
                      none: ActorWhere
                      \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
                      single: ActorWhere
                      \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
                      some: ActorWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregateSelection {
                      count: CountConnection!
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
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MovieActorActorsAggregateSelection!
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionAggregateInput {
                      AND: [MovieActorsConnectionAggregateInput!]
                      NOT: MovieActorsConnectionAggregateInput
                      OR: [MovieActorsConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"Filter Movies by aggregating results on related MovieActorsConnections\\"\\"\\"
                      aggregate: MovieActorsConnectionAggregateInput
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      all: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      none: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      single: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      some: MovieActorsConnectionWhere
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
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
                      password: StringScalarAggregationFilters
                      password_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { eq: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gte: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { eq: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { eq: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lte: ... } } }' instead.\\")
                      username: StringScalarAggregationFilters
                      username_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { eq: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gte: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { eq: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { eq: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorRelationshipFilters
                      actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
                      actorsConnection: MovieActorsConnectionFilters
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
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
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String
                        actors: [Actor!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: false, byAggregate: true)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregateSelection {
                      count: CountConnection!
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
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MovieActorActorsAggregateSelection!
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionAggregateInput {
                      AND: [MovieActorsConnectionAggregateInput!]
                      NOT: MovieActorsConnectionAggregateInput
                      OR: [MovieActorsConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"Filter Movies by aggregating results on related MovieActorsConnections\\"\\"\\"
                      aggregate: MovieActorsConnectionAggregateInput
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
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
                      password: StringScalarAggregationFilters
                      password_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { eq: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { gte: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lt: ... } } }' instead.\\")
                      password_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'password: { averageLength: { lte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { eq: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { gte: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lt: ... } } }' instead.\\")
                      password_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { longestLength: { lte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { eq: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { gte: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lt: ... } } }' instead.\\")
                      password_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'password: { shortestLength: { lte: ... } } }' instead.\\")
                      username: StringScalarAggregationFilters
                      username_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { eq: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gte: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { eq: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { eq: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Actor!
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
                      actorsConnection: MovieActorsConnectionFilters
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
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
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String
                        actors: [Actor!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: true, byAggregate: false)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();
                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    input ActorRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Actors match this filter\\"\\"\\"
                      all: ActorWhere
                      \\"\\"\\"Filter type where none of the related Actors match this filter\\"\\"\\"
                      none: ActorWhere
                      \\"\\"\\"Filter type where one of the related Actors match this filter\\"\\"\\"
                      single: ActorWhere
                      \\"\\"\\"Filter type where some of the related Actors match this filter\\"\\"\\"
                      some: ActorWhere
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    type MovieActorActorsAggregateSelection {
                      count: CountConnection!
                      node: MovieActorActorsNodeAggregateSelection
                    }

                    type MovieActorActorsNodeAggregateSelection {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input MovieActorsConnectFieldInput {
                      connect: [ActorConnectInput!]
                      where: ActorConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MovieActorActorsAggregateSelection!
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      all: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      none: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      single: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      some: MovieActorsConnectionWhere
                    }

                    input MovieActorsConnectionSort {
                      node: ActorSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: ActorWhere
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

                    input MovieActorsUpdateConnectionInput {
                      node: ActorUpdateInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: ActorRelationshipFilters
                      actorsConnection: MovieActorsConnectionFilters
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Movies where all of the related Actors match this filter\\"\\"\\"
                      actors_ALL: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related Actors match this filter\\"\\"\\"
                      actors_NONE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related Actors match this filter\\"\\"\\"
                      actors_SINGLE: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related Actors match this filter\\"\\"\\"
                      actors_SOME: ActorWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
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
                    type Actor implements Person @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    interface Person {
                        username: String!
                    }

                    type Movie @node {
                        title: String
                        actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor implements Person {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    input MovieActorsConnectFieldInput {
                      where: PersonConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MoviePersonActorsAggregateSelection!
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      all: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      none: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      single: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      some: MovieActorsConnectionWhere
                    }

                    input MovieActorsConnectionSort {
                      node: PersonSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: PersonWhere
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

                    input MovieActorsUpdateConnectionInput {
                      node: PersonUpdateInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MoviePersonActorsAggregateSelection {
                      count: CountConnection!
                      node: MoviePersonActorsNodeAggregateSelection
                    }

                    type MoviePersonActorsNodeAggregateSelection {
                      username: StringAggregateSelection!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: PersonRelationshipFilters
                      actorsConnection: MovieActorsConnectionFilters
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type PeopleConnection {
                      aggregate: PersonAggregate!
                      edges: [PersonEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    interface Person {
                      username: String!
                    }

                    type PersonAggregate {
                      count: Count!
                      node: PersonAggregateNode!
                    }

                    type PersonAggregateNode {
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

                    enum PersonImplementation {
                      Actor
                    }

                    input PersonRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related People match this filter\\"\\"\\"
                      all: PersonWhere
                      \\"\\"\\"Filter type where none of the related People match this filter\\"\\"\\"
                      none: PersonWhere
                      \\"\\"\\"Filter type where one of the related People match this filter\\"\\"\\"
                      single: PersonWhere
                      \\"\\"\\"Filter type where some of the related People match this filter\\"\\"\\"
                      some: PersonWhere
                    }

                    \\"\\"\\"
                    Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                    \\"\\"\\"
                    input PersonSort {
                      username: SortDirection
                    }

                    input PersonUpdateInput {
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input PersonWhere {
                      AND: [PersonWhere!]
                      NOT: PersonWhere
                      OR: [PersonWhere!]
                      typename: [PersonImplementation!]
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                      people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                      peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
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
                    type Actor implements Person @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    interface Person {
                        username: String!
                    }

                    type Movie @node {
                        title: String
                        actors: [Person!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: true, byAggregate: true)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor implements Person {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    input MovieActorsAggregateInput {
                      AND: [MovieActorsAggregateInput!]
                      NOT: MovieActorsAggregateInput
                      OR: [MovieActorsAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectFieldInput {
                      where: PersonConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MoviePersonActorsAggregateSelection!
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionAggregateInput {
                      AND: [MovieActorsConnectionAggregateInput!]
                      NOT: MovieActorsConnectionAggregateInput
                      OR: [MovieActorsConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: MovieActorsNodeAggregationWhereInput
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"Filter Movies by aggregating results on related MovieActorsConnections\\"\\"\\"
                      aggregate: MovieActorsConnectionAggregateInput
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      all: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      none: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      single: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      some: MovieActorsConnectionWhere
                    }

                    input MovieActorsConnectionSort {
                      node: PersonSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: PersonWhere
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
                      username: StringScalarAggregationFilters
                      username_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { eq: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { gte: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lt: ... } } }' instead.\\")
                      username_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'username: { averageLength: { lte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { eq: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { gte: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lt: ... } } }' instead.\\")
                      username_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { longestLength: { lte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { eq: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { gte: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lt: ... } } }' instead.\\")
                      username_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'username: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type MovieActorsRelationship {
                      cursor: String!
                      node: Person!
                    }

                    input MovieActorsUpdateConnectionInput {
                      node: PersonUpdateInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MoviePersonActorsAggregateSelection {
                      count: CountConnection!
                      node: MoviePersonActorsNodeAggregateSelection
                    }

                    type MoviePersonActorsNodeAggregateSelection {
                      username: StringAggregateSelection!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: PersonRelationshipFilters
                      actorsAggregate: MovieActorsAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the actorsConnection filter, please use { actorsConnection: { aggregate: {...} } } instead\\")
                      actorsConnection: MovieActorsConnectionFilters
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type PeopleConnection {
                      aggregate: PersonAggregate!
                      edges: [PersonEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    interface Person {
                      username: String!
                    }

                    type PersonAggregate {
                      count: Count!
                      node: PersonAggregateNode!
                    }

                    type PersonAggregateNode {
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

                    enum PersonImplementation {
                      Actor
                    }

                    input PersonRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related People match this filter\\"\\"\\"
                      all: PersonWhere
                      \\"\\"\\"Filter type where none of the related People match this filter\\"\\"\\"
                      none: PersonWhere
                      \\"\\"\\"Filter type where one of the related People match this filter\\"\\"\\"
                      single: PersonWhere
                      \\"\\"\\"Filter type where some of the related People match this filter\\"\\"\\"
                      some: PersonWhere
                    }

                    \\"\\"\\"
                    Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                    \\"\\"\\"
                    input PersonSort {
                      username: SortDirection
                    }

                    input PersonUpdateInput {
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input PersonWhere {
                      AND: [PersonWhere!]
                      NOT: PersonWhere
                      OR: [PersonWhere!]
                      typename: [PersonImplementation!]
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                      people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                      peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
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
                    type Actor implements Person @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    interface Person {
                        username: String!
                    }

                    type Movie @node {
                        title: String
                        actors: [Person!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: true, byAggregate: false)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor implements Person {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
                    }

                    type CreateActorsMutationResponse {
                      actors: [Actor!]!
                      info: CreateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created during a create mutation
                    \\"\\"\\"
                    type CreateInfo {
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                      actorsConnection(after: String, first: Int, sort: [MovieActorsConnectionSort!], where: MovieActorsConnectionWhere): MovieActorsConnection!
                      title: String
                    }

                    input MovieActorsConnectFieldInput {
                      where: PersonConnectWhere
                    }

                    type MovieActorsConnection {
                      aggregate: MoviePersonActorsAggregateSelection!
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      all: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      none: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      single: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      some: MovieActorsConnectionWhere
                    }

                    input MovieActorsConnectionSort {
                      node: PersonSort
                    }

                    input MovieActorsConnectionWhere {
                      AND: [MovieActorsConnectionWhere!]
                      NOT: MovieActorsConnectionWhere
                      OR: [MovieActorsConnectionWhere!]
                      node: PersonWhere
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

                    input MovieActorsUpdateConnectionInput {
                      node: PersonUpdateInput
                      where: MovieActorsConnectionWhere
                    }

                    input MovieActorsUpdateFieldInput {
                      connect: [MovieActorsConnectFieldInput!]
                      create: [MovieActorsCreateFieldInput!]
                      delete: [MovieActorsDeleteFieldInput!]
                      disconnect: [MovieActorsDisconnectFieldInput!]
                      update: MovieActorsUpdateConnectionInput
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: [MovieActorsConnectFieldInput!]
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsFieldInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: [MovieActorsDeleteFieldInput!]
                    }

                    input MovieDisconnectInput {
                      actors: [MovieActorsDisconnectFieldInput!]
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    type MoviePersonActorsAggregateSelection {
                      count: CountConnection!
                      node: MoviePersonActorsNodeAggregateSelection
                    }

                    type MoviePersonActorsNodeAggregateSelection {
                      username: StringAggregateSelection!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: PersonRelationshipFilters
                      actorsConnection: MovieActorsConnectionFilters
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
                      edges: [MovieEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Mutation {
                      createActors(input: [ActorCreateInput!]!): CreateActorsMutationResponse!
                      createMovies(input: [MovieCreateInput!]!): CreateMoviesMutationResponse!
                      deleteActors(delete: ActorDeleteInput, where: ActorWhere): DeleteInfo!
                      deleteMovies(delete: MovieDeleteInput, where: MovieWhere): DeleteInfo!
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    type PeopleConnection {
                      aggregate: PersonAggregate!
                      edges: [PersonEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    interface Person {
                      username: String!
                    }

                    type PersonAggregate {
                      count: Count!
                      node: PersonAggregateNode!
                    }

                    type PersonAggregateNode {
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

                    enum PersonImplementation {
                      Actor
                    }

                    input PersonRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related People match this filter\\"\\"\\"
                      all: PersonWhere
                      \\"\\"\\"Filter type where none of the related People match this filter\\"\\"\\"
                      none: PersonWhere
                      \\"\\"\\"Filter type where one of the related People match this filter\\"\\"\\"
                      single: PersonWhere
                      \\"\\"\\"Filter type where some of the related People match this filter\\"\\"\\"
                      some: PersonWhere
                    }

                    \\"\\"\\"
                    Fields to sort People by. The order in which sorts are applied is not guaranteed when specifying many fields in one PersonSort object.
                    \\"\\"\\"
                    input PersonSort {
                      username: SortDirection
                    }

                    input PersonUpdateInput {
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input PersonWhere {
                      AND: [PersonWhere!]
                      NOT: PersonWhere
                      OR: [PersonWhere!]
                      typename: [PersonImplementation!]
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                      people(limit: Int, offset: Int, sort: [PersonSort!], where: PersonWhere): [Person!]!
                      peopleConnection(after: String, first: Int, sort: [PersonSort!], where: PersonWhere): PeopleConnection!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
                    }

                    type UpdateActorsMutationResponse {
                      actors: [Actor!]!
                      info: UpdateInfo!
                    }

                    \\"\\"\\"
                    Information about the number of nodes and relationships created and deleted during an update mutation
                    \\"\\"\\"
                    type UpdateInfo {
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
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Appearance @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    union Person = Actor | Appearance

                    type Movie @node {
                        title: String
                        actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Appearance {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [AppearanceMoviesConnectionSort!], where: AppearanceMoviesConnectionWhere): AppearanceMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type AppearanceAggregate {
                      count: Count!
                      node: AppearanceAggregateNode!
                    }

                    type AppearanceAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input AppearanceConnectInput {
                      movies: [AppearanceMoviesConnectFieldInput!]
                    }

                    input AppearanceConnectWhere {
                      node: AppearanceWhere!
                    }

                    input AppearanceCreateInput {
                      movies: AppearanceMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input AppearanceDeleteInput {
                      movies: [AppearanceMoviesDeleteFieldInput!]
                    }

                    input AppearanceDisconnectInput {
                      movies: [AppearanceMoviesDisconnectFieldInput!]
                    }

                    type AppearanceEdge {
                      cursor: String!
                      node: Appearance!
                    }

                    type AppearanceMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: AppearanceMovieMoviesNodeAggregateSelection
                    }

                    type AppearanceMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input AppearanceMoviesAggregateInput {
                      AND: [AppearanceMoviesAggregateInput!]
                      NOT: AppearanceMoviesAggregateInput
                      OR: [AppearanceMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: AppearanceMoviesNodeAggregationWhereInput
                    }

                    input AppearanceMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type AppearanceMoviesConnection {
                      aggregate: AppearanceMovieMoviesAggregateSelection!
                      edges: [AppearanceMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input AppearanceMoviesConnectionAggregateInput {
                      AND: [AppearanceMoviesConnectionAggregateInput!]
                      NOT: AppearanceMoviesConnectionAggregateInput
                      OR: [AppearanceMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: AppearanceMoviesNodeAggregationWhereInput
                    }

                    input AppearanceMoviesConnectionFilters {
                      \\"\\"\\"
                      Filter Appearances by aggregating results on related AppearanceMoviesConnections
                      \\"\\"\\"
                      aggregate: AppearanceMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Appearances where all of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      all: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where none of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      none: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where one of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      single: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where some of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      some: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceMoviesConnectionSort {
                      node: MovieSort
                    }

                    input AppearanceMoviesConnectionWhere {
                      AND: [AppearanceMoviesConnectionWhere!]
                      NOT: AppearanceMoviesConnectionWhere
                      OR: [AppearanceMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type AppearanceMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input AppearanceMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceMoviesUpdateFieldInput {
                      connect: [AppearanceMoviesConnectFieldInput!]
                      create: [AppearanceMoviesCreateFieldInput!]
                      delete: [AppearanceMoviesDeleteFieldInput!]
                      disconnect: [AppearanceMoviesDisconnectFieldInput!]
                      update: AppearanceMoviesUpdateConnectionInput
                    }

                    \\"\\"\\"
                    Fields to sort Appearances by. The order in which sorts are applied is not guaranteed when specifying many fields in one AppearanceSort object.
                    \\"\\"\\"
                    input AppearanceSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input AppearanceUpdateInput {
                      movies: [AppearanceMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input AppearanceWhere {
                      AND: [AppearanceWhere!]
                      NOT: AppearanceWhere
                      OR: [AppearanceWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: AppearanceMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: AppearanceMoviesConnectionFilters
                      \\"\\"\\"
                      Return Appearances where all of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Appearances where none of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Appearances where one of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Appearances where some of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Appearances where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Appearances where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Appearances where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Appearances where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type AppearancesConnection {
                      aggregate: AppearanceAggregate!
                      edges: [AppearanceEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                      actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
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

                    input MovieActorsActorUpdateConnectionInput {
                      node: ActorUpdateInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorUpdateFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                      delete: [MovieActorsActorDeleteFieldInput!]
                      disconnect: [MovieActorsActorDisconnectFieldInput!]
                      update: MovieActorsActorUpdateConnectionInput
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

                    input MovieActorsAppearanceUpdateConnectionInput {
                      node: AppearanceUpdateInput
                      where: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsAppearanceUpdateFieldInput {
                      connect: [MovieActorsAppearanceConnectFieldInput!]
                      create: [MovieActorsAppearanceCreateFieldInput!]
                      delete: [MovieActorsAppearanceDeleteFieldInput!]
                      disconnect: [MovieActorsAppearanceDisconnectFieldInput!]
                      update: MovieActorsAppearanceUpdateConnectionInput
                    }

                    input MovieActorsConnectInput {
                      Actor: [MovieActorsActorConnectFieldInput!]
                      Appearance: [MovieActorsAppearanceConnectFieldInput!]
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      all: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      none: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      single: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      some: MovieActorsConnectionWhere
                    }

                    input MovieActorsConnectionWhere {
                      Actor: MovieActorsActorConnectionWhere
                      Appearance: MovieActorsAppearanceConnectionWhere
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

                    input MovieActorsUpdateInput {
                      Actor: [MovieActorsActorUpdateFieldInput!]
                      Appearance: [MovieActorsAppearanceUpdateFieldInput!]
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: MovieActorsConnectInput
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsCreateInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: MovieActorsDeleteInput
                    }

                    input MovieDisconnectInput {
                      actors: MovieActorsDisconnectInput
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: PersonRelationshipFilters
                      actorsConnection: MovieActorsConnectionFilters
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
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
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateAppearances(update: AppearanceUpdateInput, where: AppearanceWhere): UpdateAppearancesMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    union Person = Actor | Appearance

                    input PersonRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related People match this filter\\"\\"\\"
                      all: PersonWhere
                      \\"\\"\\"Filter type where none of the related People match this filter\\"\\"\\"
                      none: PersonWhere
                      \\"\\"\\"Filter type where one of the related People match this filter\\"\\"\\"
                      single: PersonWhere
                      \\"\\"\\"Filter type where some of the related People match this filter\\"\\"\\"
                      some: PersonWhere
                    }

                    input PersonWhere {
                      Actor: ActorWhere
                      Appearance: AppearanceWhere
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      appearances(limit: Int, offset: Int, sort: [AppearanceSort!], where: AppearanceWhere): [Appearance!]!
                      appearancesConnection(after: String, first: Int, sort: [AppearanceSort!], where: AppearanceWhere): AppearancesConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                      people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
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
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Appearance @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    union Person = Actor | Appearance

                    type Movie @node {
                        title: String
                        actors: [Person!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: true, byAggregate: true)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Appearance {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [AppearanceMoviesConnectionSort!], where: AppearanceMoviesConnectionWhere): AppearanceMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type AppearanceAggregate {
                      count: Count!
                      node: AppearanceAggregateNode!
                    }

                    type AppearanceAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input AppearanceConnectInput {
                      movies: [AppearanceMoviesConnectFieldInput!]
                    }

                    input AppearanceConnectWhere {
                      node: AppearanceWhere!
                    }

                    input AppearanceCreateInput {
                      movies: AppearanceMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input AppearanceDeleteInput {
                      movies: [AppearanceMoviesDeleteFieldInput!]
                    }

                    input AppearanceDisconnectInput {
                      movies: [AppearanceMoviesDisconnectFieldInput!]
                    }

                    type AppearanceEdge {
                      cursor: String!
                      node: Appearance!
                    }

                    type AppearanceMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: AppearanceMovieMoviesNodeAggregateSelection
                    }

                    type AppearanceMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input AppearanceMoviesAggregateInput {
                      AND: [AppearanceMoviesAggregateInput!]
                      NOT: AppearanceMoviesAggregateInput
                      OR: [AppearanceMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: AppearanceMoviesNodeAggregationWhereInput
                    }

                    input AppearanceMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type AppearanceMoviesConnection {
                      aggregate: AppearanceMovieMoviesAggregateSelection!
                      edges: [AppearanceMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input AppearanceMoviesConnectionAggregateInput {
                      AND: [AppearanceMoviesConnectionAggregateInput!]
                      NOT: AppearanceMoviesConnectionAggregateInput
                      OR: [AppearanceMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: AppearanceMoviesNodeAggregationWhereInput
                    }

                    input AppearanceMoviesConnectionFilters {
                      \\"\\"\\"
                      Filter Appearances by aggregating results on related AppearanceMoviesConnections
                      \\"\\"\\"
                      aggregate: AppearanceMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Appearances where all of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      all: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where none of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      none: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where one of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      single: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where some of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      some: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceMoviesConnectionSort {
                      node: MovieSort
                    }

                    input AppearanceMoviesConnectionWhere {
                      AND: [AppearanceMoviesConnectionWhere!]
                      NOT: AppearanceMoviesConnectionWhere
                      OR: [AppearanceMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type AppearanceMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input AppearanceMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceMoviesUpdateFieldInput {
                      connect: [AppearanceMoviesConnectFieldInput!]
                      create: [AppearanceMoviesCreateFieldInput!]
                      delete: [AppearanceMoviesDeleteFieldInput!]
                      disconnect: [AppearanceMoviesDisconnectFieldInput!]
                      update: AppearanceMoviesUpdateConnectionInput
                    }

                    \\"\\"\\"
                    Fields to sort Appearances by. The order in which sorts are applied is not guaranteed when specifying many fields in one AppearanceSort object.
                    \\"\\"\\"
                    input AppearanceSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input AppearanceUpdateInput {
                      movies: [AppearanceMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input AppearanceWhere {
                      AND: [AppearanceWhere!]
                      NOT: AppearanceWhere
                      OR: [AppearanceWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: AppearanceMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: AppearanceMoviesConnectionFilters
                      \\"\\"\\"
                      Return Appearances where all of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Appearances where none of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Appearances where one of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Appearances where some of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Appearances where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Appearances where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Appearances where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Appearances where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type AppearancesConnection {
                      aggregate: AppearanceAggregate!
                      edges: [AppearanceEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                      actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
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

                    input MovieActorsActorUpdateConnectionInput {
                      node: ActorUpdateInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorUpdateFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                      delete: [MovieActorsActorDeleteFieldInput!]
                      disconnect: [MovieActorsActorDisconnectFieldInput!]
                      update: MovieActorsActorUpdateConnectionInput
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

                    input MovieActorsAppearanceUpdateConnectionInput {
                      node: AppearanceUpdateInput
                      where: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsAppearanceUpdateFieldInput {
                      connect: [MovieActorsAppearanceConnectFieldInput!]
                      create: [MovieActorsAppearanceCreateFieldInput!]
                      delete: [MovieActorsAppearanceDeleteFieldInput!]
                      disconnect: [MovieActorsAppearanceDisconnectFieldInput!]
                      update: MovieActorsAppearanceUpdateConnectionInput
                    }

                    input MovieActorsConnectInput {
                      Actor: [MovieActorsActorConnectFieldInput!]
                      Appearance: [MovieActorsAppearanceConnectFieldInput!]
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      all: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      none: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      single: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      some: MovieActorsConnectionWhere
                    }

                    input MovieActorsConnectionWhere {
                      Actor: MovieActorsActorConnectionWhere
                      Appearance: MovieActorsAppearanceConnectionWhere
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

                    input MovieActorsUpdateInput {
                      Actor: [MovieActorsActorUpdateFieldInput!]
                      Appearance: [MovieActorsAppearanceUpdateFieldInput!]
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: MovieActorsConnectInput
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsCreateInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: MovieActorsDeleteInput
                    }

                    input MovieDisconnectInput {
                      actors: MovieActorsDisconnectInput
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: PersonRelationshipFilters
                      actorsConnection: MovieActorsConnectionFilters
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
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
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateAppearances(update: AppearanceUpdateInput, where: AppearanceWhere): UpdateAppearancesMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    union Person = Actor | Appearance

                    input PersonRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related People match this filter\\"\\"\\"
                      all: PersonWhere
                      \\"\\"\\"Filter type where none of the related People match this filter\\"\\"\\"
                      none: PersonWhere
                      \\"\\"\\"Filter type where one of the related People match this filter\\"\\"\\"
                      single: PersonWhere
                      \\"\\"\\"Filter type where some of the related People match this filter\\"\\"\\"
                      some: PersonWhere
                    }

                    input PersonWhere {
                      Actor: ActorWhere
                      Appearance: AppearanceWhere
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      appearances(limit: Int, offset: Int, sort: [AppearanceSort!], where: AppearanceWhere): [Appearance!]!
                      appearancesConnection(after: String, first: Int, sort: [AppearanceSort!], where: AppearanceWhere): AppearancesConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                      people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
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
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Appearance @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    union Person = Actor | Appearance

                    type Movie @node {
                        title: String
                        actors: [Person!]!
                            @relationship(type: "ACTED_IN", direction: IN)
                            @filterable(byValue: true, byAggregate: false)
                    }
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                    },
                });
                const schema = await neoSchema.getSchema();

                const printedSchema = printSchemaWithDirectives(lexicographicSortSchema(schema));
                expect(printedSchema).toMatchInlineSnapshot(`
                    "schema {
                      query: Query
                      mutation: Mutation
                    }

                    type Actor {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [ActorMoviesConnectionSort!], where: ActorMoviesConnectionWhere): ActorMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type ActorAggregate {
                      count: Count!
                      node: ActorAggregateNode!
                    }

                    type ActorAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input ActorConnectInput {
                      movies: [ActorMoviesConnectFieldInput!]
                    }

                    input ActorConnectWhere {
                      node: ActorWhere!
                    }

                    input ActorCreateInput {
                      movies: ActorMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input ActorDeleteInput {
                      movies: [ActorMoviesDeleteFieldInput!]
                    }

                    input ActorDisconnectInput {
                      movies: [ActorMoviesDisconnectFieldInput!]
                    }

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input ActorMoviesAggregateInput {
                      AND: [ActorMoviesAggregateInput!]
                      NOT: ActorMoviesAggregateInput
                      OR: [ActorMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type ActorMoviesConnection {
                      aggregate: ActorMovieMoviesAggregateSelection!
                      edges: [ActorMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ActorMoviesConnectionAggregateInput {
                      AND: [ActorMoviesConnectionAggregateInput!]
                      NOT: ActorMoviesConnectionAggregateInput
                      OR: [ActorMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: ActorMoviesNodeAggregationWhereInput
                    }

                    input ActorMoviesConnectionFilters {
                      \\"\\"\\"Filter Actors by aggregating results on related ActorMoviesConnections\\"\\"\\"
                      aggregate: ActorMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      all: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      none: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      single: ActorMoviesConnectionWhere
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      some: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesConnectionSort {
                      node: MovieSort
                    }

                    input ActorMoviesConnectionWhere {
                      AND: [ActorMoviesConnectionWhere!]
                      NOT: ActorMoviesConnectionWhere
                      OR: [ActorMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type ActorMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input ActorMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: ActorMoviesConnectionWhere
                    }

                    input ActorMoviesUpdateFieldInput {
                      connect: [ActorMoviesConnectFieldInput!]
                      create: [ActorMoviesCreateFieldInput!]
                      delete: [ActorMoviesDeleteFieldInput!]
                      disconnect: [ActorMoviesDisconnectFieldInput!]
                      update: ActorMoviesUpdateConnectionInput
                    }

                    \\"\\"\\"
                    Fields to sort Actors by. The order in which sorts are applied is not guaranteed when specifying many fields in one ActorSort object.
                    \\"\\"\\"
                    input ActorSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input ActorWhere {
                      AND: [ActorWhere!]
                      NOT: ActorWhere
                      OR: [ActorWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: ActorMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: ActorMoviesConnectionFilters
                      \\"\\"\\"
                      Return Actors where all of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where none of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where one of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Actors where some of the related ActorMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: ActorMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Actors where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Actors where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Actors where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Actors where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type ActorsConnection {
                      aggregate: ActorAggregate!
                      edges: [ActorEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    type Appearance {
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [AppearanceMoviesConnectionSort!], where: AppearanceMoviesConnectionWhere): AppearanceMoviesConnection!
                      password: String!
                      username: String!
                    }

                    type AppearanceAggregate {
                      count: Count!
                      node: AppearanceAggregateNode!
                    }

                    type AppearanceAggregateNode {
                      password: StringAggregateSelection!
                      username: StringAggregateSelection!
                    }

                    input AppearanceConnectInput {
                      movies: [AppearanceMoviesConnectFieldInput!]
                    }

                    input AppearanceConnectWhere {
                      node: AppearanceWhere!
                    }

                    input AppearanceCreateInput {
                      movies: AppearanceMoviesFieldInput
                      password: String!
                      username: String!
                    }

                    input AppearanceDeleteInput {
                      movies: [AppearanceMoviesDeleteFieldInput!]
                    }

                    input AppearanceDisconnectInput {
                      movies: [AppearanceMoviesDisconnectFieldInput!]
                    }

                    type AppearanceEdge {
                      cursor: String!
                      node: Appearance!
                    }

                    type AppearanceMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: AppearanceMovieMoviesNodeAggregateSelection
                    }

                    type AppearanceMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
                    }

                    input AppearanceMoviesAggregateInput {
                      AND: [AppearanceMoviesAggregateInput!]
                      NOT: AppearanceMoviesAggregateInput
                      OR: [AppearanceMoviesAggregateInput!]
                      count: IntScalarFilters
                      count_EQ: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { eq: ... } } }' instead.\\")
                      count_GT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gt: ... } } }' instead.\\")
                      count_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { gte: ... } } }' instead.\\")
                      count_LT: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lt: ... } } }' instead.\\")
                      count_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter '{ count: { lte: ... } } }' instead.\\")
                      node: AppearanceMoviesNodeAggregationWhereInput
                    }

                    input AppearanceMoviesConnectFieldInput {
                      connect: [MovieConnectInput!]
                      where: MovieConnectWhere
                    }

                    type AppearanceMoviesConnection {
                      aggregate: AppearanceMovieMoviesAggregateSelection!
                      edges: [AppearanceMoviesRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input AppearanceMoviesConnectionAggregateInput {
                      AND: [AppearanceMoviesConnectionAggregateInput!]
                      NOT: AppearanceMoviesConnectionAggregateInput
                      OR: [AppearanceMoviesConnectionAggregateInput!]
                      count: ConnectionAggregationCountFilterInput
                      node: AppearanceMoviesNodeAggregationWhereInput
                    }

                    input AppearanceMoviesConnectionFilters {
                      \\"\\"\\"
                      Filter Appearances by aggregating results on related AppearanceMoviesConnections
                      \\"\\"\\"
                      aggregate: AppearanceMoviesConnectionAggregateInput
                      \\"\\"\\"
                      Return Appearances where all of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      all: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where none of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      none: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where one of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      single: AppearanceMoviesConnectionWhere
                      \\"\\"\\"
                      Return Appearances where some of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      some: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceMoviesConnectionSort {
                      node: MovieSort
                    }

                    input AppearanceMoviesConnectionWhere {
                      AND: [AppearanceMoviesConnectionWhere!]
                      NOT: AppearanceMoviesConnectionWhere
                      OR: [AppearanceMoviesConnectionWhere!]
                      node: MovieWhere
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
                      title: StringScalarAggregationFilters
                      title_AVERAGE_LENGTH_EQUAL: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { eq: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_GTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { gte: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LT: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lt: ... } } }' instead.\\")
                      title_AVERAGE_LENGTH_LTE: Float @deprecated(reason: \\"Please use the relevant generic filter 'title: { averageLength: { lte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { eq: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { gte: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lt: ... } } }' instead.\\")
                      title_LONGEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { longestLength: { lte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_EQUAL: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { eq: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_GTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { gte: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LT: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lt: ... } } }' instead.\\")
                      title_SHORTEST_LENGTH_LTE: Int @deprecated(reason: \\"Please use the relevant generic filter 'title: { shortestLength: { lte: ... } } }' instead.\\")
                    }

                    type AppearanceMoviesRelationship {
                      cursor: String!
                      node: Movie!
                    }

                    input AppearanceMoviesUpdateConnectionInput {
                      node: MovieUpdateInput
                      where: AppearanceMoviesConnectionWhere
                    }

                    input AppearanceMoviesUpdateFieldInput {
                      connect: [AppearanceMoviesConnectFieldInput!]
                      create: [AppearanceMoviesCreateFieldInput!]
                      delete: [AppearanceMoviesDeleteFieldInput!]
                      disconnect: [AppearanceMoviesDisconnectFieldInput!]
                      update: AppearanceMoviesUpdateConnectionInput
                    }

                    \\"\\"\\"
                    Fields to sort Appearances by. The order in which sorts are applied is not guaranteed when specifying many fields in one AppearanceSort object.
                    \\"\\"\\"
                    input AppearanceSort {
                      password: SortDirection
                      username: SortDirection
                    }

                    input AppearanceUpdateInput {
                      movies: [AppearanceMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
                    }

                    input AppearanceWhere {
                      AND: [AppearanceWhere!]
                      NOT: AppearanceWhere
                      OR: [AppearanceWhere!]
                      movies: MovieRelationshipFilters
                      moviesAggregate: AppearanceMoviesAggregateInput @deprecated(reason: \\"Aggregate filters are moved inside the moviesConnection filter, please use { moviesConnection: { aggregate: {...} } } instead\\")
                      moviesConnection: AppearanceMoviesConnectionFilters
                      \\"\\"\\"
                      Return Appearances where all of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_ALL: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Appearances where none of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_NONE: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Appearances where one of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SINGLE: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Appearances where some of the related AppearanceMoviesConnections match this filter
                      \\"\\"\\"
                      moviesConnection_SOME: AppearanceMoviesConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'moviesConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Appearances where all of the related Movies match this filter\\"\\"\\"
                      movies_ALL: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { all: ... }' instead.\\")
                      \\"\\"\\"Return Appearances where none of the related Movies match this filter\\"\\"\\"
                      movies_NONE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: { none: ... }' instead.\\")
                      \\"\\"\\"Return Appearances where one of the related Movies match this filter\\"\\"\\"
                      movies_SINGLE: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Appearances where some of the related Movies match this filter\\"\\"\\"
                      movies_SOME: MovieWhere @deprecated(reason: \\"Please use the relevant generic filter 'movies: {  some: ... }' instead.\\")
                      password: StringScalarFilters
                      password_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter password: { contains: ... }\\")
                      password_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { endsWith: ... }\\")
                      password_EQ: String @deprecated(reason: \\"Please use the relevant generic filter password: { eq: ... }\\")
                      password_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter password: { in: ... }\\")
                      password_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter password: { startsWith: ... }\\")
                      username: StringScalarFilters
                      username_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter username: { contains: ... }\\")
                      username_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { endsWith: ... }\\")
                      username_EQ: String @deprecated(reason: \\"Please use the relevant generic filter username: { eq: ... }\\")
                      username_IN: [String!] @deprecated(reason: \\"Please use the relevant generic filter username: { in: ... }\\")
                      username_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter username: { startsWith: ... }\\")
                    }

                    type AppearancesConnection {
                      aggregate: AppearanceAggregate!
                      edges: [AppearanceEdge!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input ConnectionAggregationCountFilterInput {
                      edges: IntScalarFilters
                      nodes: IntScalarFilters
                    }

                    type Count {
                      nodes: Int!
                    }

                    type CountConnection {
                      edges: Int!
                      nodes: Int!
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
                      nodesDeleted: Int!
                      relationshipsDeleted: Int!
                    }

                    \\"\\"\\"Float filters\\"\\"\\"
                    input FloatScalarFilters {
                      eq: Float
                      gt: Float
                      gte: Float
                      in: [Float!]
                      lt: Float
                      lte: Float
                    }

                    \\"\\"\\"Int filters\\"\\"\\"
                    input IntScalarFilters {
                      eq: Int
                      gt: Int
                      gte: Int
                      in: [Int!]
                      lt: Int
                      lte: Int
                    }

                    type Movie {
                      actors(limit: Int, offset: Int, where: PersonWhere): [Person!]!
                      actorsConnection(after: String, first: Int, where: MovieActorsConnectionWhere): MovieActorsConnection!
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

                    input MovieActorsActorUpdateConnectionInput {
                      node: ActorUpdateInput
                      where: MovieActorsActorConnectionWhere
                    }

                    input MovieActorsActorUpdateFieldInput {
                      connect: [MovieActorsActorConnectFieldInput!]
                      create: [MovieActorsActorCreateFieldInput!]
                      delete: [MovieActorsActorDeleteFieldInput!]
                      disconnect: [MovieActorsActorDisconnectFieldInput!]
                      update: MovieActorsActorUpdateConnectionInput
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

                    input MovieActorsAppearanceUpdateConnectionInput {
                      node: AppearanceUpdateInput
                      where: MovieActorsAppearanceConnectionWhere
                    }

                    input MovieActorsAppearanceUpdateFieldInput {
                      connect: [MovieActorsAppearanceConnectFieldInput!]
                      create: [MovieActorsAppearanceCreateFieldInput!]
                      delete: [MovieActorsAppearanceDeleteFieldInput!]
                      disconnect: [MovieActorsAppearanceDisconnectFieldInput!]
                      update: MovieActorsAppearanceUpdateConnectionInput
                    }

                    input MovieActorsConnectInput {
                      Actor: [MovieActorsActorConnectFieldInput!]
                      Appearance: [MovieActorsAppearanceConnectFieldInput!]
                    }

                    type MovieActorsConnection {
                      edges: [MovieActorsRelationship!]!
                      pageInfo: PageInfo!
                      totalCount: Int!
                    }

                    input MovieActorsConnectionFilters {
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      all: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      none: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      single: MovieActorsConnectionWhere
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      some: MovieActorsConnectionWhere
                    }

                    input MovieActorsConnectionWhere {
                      Actor: MovieActorsActorConnectionWhere
                      Appearance: MovieActorsAppearanceConnectionWhere
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

                    input MovieActorsUpdateInput {
                      Actor: [MovieActorsActorUpdateFieldInput!]
                      Appearance: [MovieActorsAppearanceUpdateFieldInput!]
                    }

                    type MovieAggregate {
                      count: Count!
                      node: MovieAggregateNode!
                    }

                    type MovieAggregateNode {
                      title: StringAggregateSelection!
                    }

                    input MovieConnectInput {
                      actors: MovieActorsConnectInput
                    }

                    input MovieConnectWhere {
                      node: MovieWhere!
                    }

                    input MovieCreateInput {
                      actors: MovieActorsCreateInput
                      title: String
                    }

                    input MovieDeleteInput {
                      actors: MovieActorsDeleteInput
                    }

                    input MovieDisconnectInput {
                      actors: MovieActorsDisconnectInput
                    }

                    type MovieEdge {
                      cursor: String!
                      node: Movie!
                    }

                    input MovieRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related Movies match this filter\\"\\"\\"
                      all: MovieWhere
                      \\"\\"\\"Filter type where none of the related Movies match this filter\\"\\"\\"
                      none: MovieWhere
                      \\"\\"\\"Filter type where one of the related Movies match this filter\\"\\"\\"
                      single: MovieWhere
                      \\"\\"\\"Filter type where some of the related Movies match this filter\\"\\"\\"
                      some: MovieWhere
                    }

                    \\"\\"\\"
                    Fields to sort Movies by. The order in which sorts are applied is not guaranteed when specifying many fields in one MovieSort object.
                    \\"\\"\\"
                    input MovieSort {
                      title: SortDirection
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
                    }

                    input MovieWhere {
                      AND: [MovieWhere!]
                      NOT: MovieWhere
                      OR: [MovieWhere!]
                      actors: PersonRelationshipFilters
                      actorsConnection: MovieActorsConnectionFilters
                      \\"\\"\\"
                      Return Movies where all of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_ALL: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { all: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where none of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_NONE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { none: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where one of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SINGLE: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { single: { node: ... } } }' instead.\\")
                      \\"\\"\\"
                      Return Movies where some of the related MovieActorsConnections match this filter
                      \\"\\"\\"
                      actorsConnection_SOME: MovieActorsConnectionWhere @deprecated(reason: \\"Please use the relevant generic filter 'actorsConnection: { some: { node: ... } } }' instead.\\")
                      \\"\\"\\"Return Movies where all of the related People match this filter\\"\\"\\"
                      actors_ALL: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { all: ... }' instead.\\")
                      \\"\\"\\"Return Movies where none of the related People match this filter\\"\\"\\"
                      actors_NONE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: { none: ... }' instead.\\")
                      \\"\\"\\"Return Movies where one of the related People match this filter\\"\\"\\"
                      actors_SINGLE: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  single: ... }' instead.\\")
                      \\"\\"\\"Return Movies where some of the related People match this filter\\"\\"\\"
                      actors_SOME: PersonWhere @deprecated(reason: \\"Please use the relevant generic filter 'actors: {  some: ... }' instead.\\")
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    type MoviesConnection {
                      aggregate: MovieAggregate!
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
                      updateActors(update: ActorUpdateInput, where: ActorWhere): UpdateActorsMutationResponse!
                      updateAppearances(update: AppearanceUpdateInput, where: AppearanceWhere): UpdateAppearancesMutationResponse!
                      updateMovies(update: MovieUpdateInput, where: MovieWhere): UpdateMoviesMutationResponse!
                    }

                    \\"\\"\\"Pagination information (Relay)\\"\\"\\"
                    type PageInfo {
                      endCursor: String
                      hasNextPage: Boolean!
                      hasPreviousPage: Boolean!
                      startCursor: String
                    }

                    union Person = Actor | Appearance

                    input PersonRelationshipFilters {
                      \\"\\"\\"Filter type where all of the related People match this filter\\"\\"\\"
                      all: PersonWhere
                      \\"\\"\\"Filter type where none of the related People match this filter\\"\\"\\"
                      none: PersonWhere
                      \\"\\"\\"Filter type where one of the related People match this filter\\"\\"\\"
                      single: PersonWhere
                      \\"\\"\\"Filter type where some of the related People match this filter\\"\\"\\"
                      some: PersonWhere
                    }

                    input PersonWhere {
                      Actor: ActorWhere
                      Appearance: AppearanceWhere
                    }

                    type Query {
                      actors(limit: Int, offset: Int, sort: [ActorSort!], where: ActorWhere): [Actor!]!
                      actorsConnection(after: String, first: Int, sort: [ActorSort!], where: ActorWhere): ActorsConnection!
                      appearances(limit: Int, offset: Int, sort: [AppearanceSort!], where: AppearanceWhere): [Appearance!]!
                      appearancesConnection(after: String, first: Int, sort: [AppearanceSort!], where: AppearanceWhere): AppearancesConnection!
                      movies(limit: Int, offset: Int, sort: [MovieSort!], where: MovieWhere): [Movie!]!
                      moviesConnection(after: String, first: Int, sort: [MovieSort!], where: MovieWhere): MoviesConnection!
                      people(limit: Int, offset: Int, where: PersonWhere): [Person!]!
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

                    \\"\\"\\"Filters for an aggregation of a string field\\"\\"\\"
                    input StringScalarAggregationFilters {
                      averageLength: FloatScalarFilters
                      longestLength: IntScalarFilters
                      shortestLength: IntScalarFilters
                    }

                    \\"\\"\\"String filters\\"\\"\\"
                    input StringScalarFilters {
                      contains: String
                      endsWith: String
                      eq: String
                      in: [String!]
                      startsWith: String
                    }

                    \\"\\"\\"String mutations\\"\\"\\"
                    input StringScalarMutations {
                      set: String
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
