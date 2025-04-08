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
import { Neo4jGraphQL } from "../../../src";
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";

describe("@filterable directive", () => {
    describe("on SCALAR", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @node {
                    username: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    releaseDate: DateTime
                    title: String @filterable
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();
            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;

            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();
            expect(movieWhereFields.title).toBeDefined();
            expect(movieWhereFields.releaseDate).toBeDefined();

            const movieSubscriptionWhereType = schema.getType("MovieSubscriptionWhere") as GraphQLInputObjectType;

            expect(movieSubscriptionWhereType).toBeDefined();

            const movieSubscriptionWhereFields = movieSubscriptionWhereType.getFields();
            expect(movieSubscriptionWhereFields.title).toBeDefined();
            expect(movieSubscriptionWhereFields.releaseDate).toBeDefined();

            const aggregationWhereInput = schema.getType(
                "ActorMoviesNodeAggregationWhereInput"
            ) as GraphQLInputObjectType;

            expect(aggregationWhereInput).toBeDefined();
            const aggregationWhereInputFields = aggregationWhereInput.getFields();

            const title_AGG = aggregationWhereInputFields["title"];

            expect(title_AGG).toBeUndefined();
        });

        test("enable value and aggregation filters", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    releaseDate: DateTime
                    title: String @filterable(byValue: true, byAggregate: true)
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const title = movieWhereFields["title"];

            expect(title).toBeDefined();

            const movieSubscriptionWhereType = schema.getType("MovieSubscriptionWhere") as GraphQLInputObjectType;

            expect(movieSubscriptionWhereType).toBeDefined();

            const movieSubscriptionWhereFields = movieSubscriptionWhereType.getFields();

            const subscriptionTitle = movieSubscriptionWhereFields["title"];

            expect(subscriptionTitle).toBeDefined();

            const aggregationWhereInput = schema.getType(
                "ActorMoviesNodeAggregationWhereInput"
            ) as GraphQLInputObjectType;

            expect(aggregationWhereInput).toBeDefined();
            const aggregationWhereInputFields = aggregationWhereInput.getFields();

            const title_AGG = aggregationWhereInputFields["title"];

            expect(title_AGG).toBeDefined();
        });

        test("enable only aggregation filters", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    title: String @filterable(byValue: false, byAggregate: true)
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const title = movieWhereFields["title"];

            expect(title).toBeUndefined();

            const movieSubscriptionWhereType = schema.getType("MovieSubscriptionWhere") as GraphQLInputObjectType;

            expect(movieSubscriptionWhereType).toBeUndefined(); // is completely removed as does not contains any filterable fields

            const aggregationWhereInput = schema.getType(
                "ActorMoviesNodeAggregationWhereInput"
            ) as GraphQLInputObjectType;

            expect(aggregationWhereInput).toBeDefined();
            const aggregationWhereInputFields = aggregationWhereInput.getFields();

            const title_AGG = aggregationWhereInputFields["title"];

            expect(title_AGG).toBeDefined();
        });
    });

    describe("on RELATIONSHIP FIELD", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = /* GraphQL */ `
                type Actor @node {
                    username: String!
                    password: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                }
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionField = movieWhereFields["actorsConnection"];
            expect(actorsConnectionField).toBeDefined();

            const connectionFiltersType = schema.getType("MovieActorsConnectionFilters") as GraphQLInputObjectType;
            expect(connectionFiltersType).toBeDefined();

            const { aggregate, some, none, all, single } = connectionFiltersType.getFields();

            expect(some).toBeDefined();
            expect(none).toBeDefined();
            expect(all).toBeDefined();
            expect(single).toBeDefined();

            expect(aggregate).toBeUndefined();
        });

        test("enable value and aggregation filters", async () => {
            const typeDefs = /* GraphQL */ `
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
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionField = movieWhereFields["actorsConnection"];
            expect(actorsConnectionField).toBeDefined();

            const connectionFiltersType = schema.getType("MovieActorsConnectionFilters") as GraphQLInputObjectType;
            expect(connectionFiltersType).toBeDefined();

            const { aggregate, some, none, all, single } = connectionFiltersType.getFields();

            expect(some).toBeDefined();
            expect(none).toBeDefined();
            expect(all).toBeDefined();
            expect(single).toBeDefined();

            expect(aggregate).toBeDefined();
        });

        test("enable only aggregation filters", async () => {
            const typeDefs = /* GraphQL */ `
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
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionField = movieWhereFields["actorsConnection"];
            expect(actorsConnectionField).toBeDefined();

            const connectionFiltersType = schema.getType("MovieActorsConnectionFilters") as GraphQLInputObjectType;
            expect(connectionFiltersType).toBeDefined();

            const { aggregate, some, none, all, single } = connectionFiltersType.getFields();

            expect(some).toBeUndefined();
            expect(none).toBeUndefined();
            expect(all).toBeUndefined();
            expect(single).toBeUndefined();

            expect(aggregate).toBeDefined();
        });

        test("enable only value filters", async () => {
            const typeDefs = /* GraphQL */ `
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
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnectionField = movieWhereFields["actorsConnection"];
            expect(actorsConnectionField).toBeDefined();

            const connectionFiltersType = schema.getType("MovieActorsConnectionFilters") as GraphQLInputObjectType;
            expect(connectionFiltersType).toBeDefined();

            const { aggregate, some, none, all, single } = connectionFiltersType.getFields();

            expect(some).toBeDefined();
            expect(none).toBeDefined();
            expect(all).toBeDefined();
            expect(single).toBeDefined();

            expect(aggregate).toBeUndefined();
        });
    });

    describe("on INTERFACE RELATIONSHIP FIELD", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = /* GraphQL */ `
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
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            expect(actorsConnection).toBeDefined();

            const connectionFiltersType = schema.getType("MovieActorsConnectionFilters") as GraphQLInputObjectType;
            expect(connectionFiltersType).toBeDefined();

            const { aggregate, some, none, all, single } = connectionFiltersType.getFields();

            expect(some).toBeDefined();
            expect(none).toBeDefined();
            expect(all).toBeDefined();
            expect(single).toBeDefined();

            expect(aggregate).toBeUndefined();
        });

        test("enable value and aggregation filters", async () => {
            const typeDefs = /* GraphQL */ `
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
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            expect(actorsConnection).toBeDefined();

            const connectionFiltersType = schema.getType("MovieActorsConnectionFilters") as GraphQLInputObjectType;
            expect(connectionFiltersType).toBeDefined();

            const { aggregate, some, none, all, single } = connectionFiltersType.getFields();

            expect(some).toBeDefined();
            expect(none).toBeDefined();
            expect(all).toBeDefined();
            expect(single).toBeDefined();

            expect(aggregate).toBeDefined();
        });

        test("enable only value filters", async () => {
            const typeDefs = /* GraphQL */ `
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
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            expect(actorsConnection).toBeDefined();

            const connectionFiltersType = schema.getType("MovieActorsConnectionFilters") as GraphQLInputObjectType;
            expect(connectionFiltersType).toBeDefined();

            const { aggregate, some, none, all, single } = connectionFiltersType.getFields();

            expect(some).toBeDefined();
            expect(none).toBeDefined();
            expect(all).toBeDefined();
            expect(single).toBeDefined();

            expect(aggregate).toBeUndefined();
        });

        test("disable value and aggregation filters", async () => {
            const typeDefs = /* GraphQL */ `
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
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            expect(actorsConnection).toBeUndefined(); // both connection and aggregate are disabled so the filter field should be removed

            const connectionFiltersType = schema.getType("MovieActorsConnectionFilters") as GraphQLInputObjectType;
            expect(connectionFiltersType).toBeUndefined();
        });
    });

    describe("on UNION RELATIONSHIP FIELD, (aggregation are no generated for abstract types)", () => {
        test("default arguments should disable aggregation", async () => {
            const typeDefs = /* GraphQL */ `
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
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            expect(actorsConnection).toBeDefined();

            const connectionFiltersType = schema.getType("MovieActorsConnectionFilters") as GraphQLInputObjectType;
            expect(connectionFiltersType).toBeDefined();

            const { aggregate, some, none, all, single } = connectionFiltersType.getFields();

            expect(some).toBeDefined();
            expect(none).toBeDefined();
            expect(all).toBeDefined();
            expect(single).toBeDefined();

            expect(aggregate).toBeUndefined();
        });

        test("enable value and aggregation filters (not generated for abstract types)", async () => {
            const typeDefs = /* GraphQL */ `
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
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            expect(actorsConnection).toBeDefined();

            const connectionFiltersType = schema.getType("MovieActorsConnectionFilters") as GraphQLInputObjectType;
            expect(connectionFiltersType).toBeDefined();

            const { aggregate, some, none, all, single } = connectionFiltersType.getFields();

            expect(some).toBeDefined();
            expect(none).toBeDefined();
            expect(all).toBeDefined();
            expect(single).toBeDefined();

            expect(aggregate).toBeUndefined();
        });

        test("enable only value filters", async () => {
            const typeDefs = /* GraphQL */ `
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
                extend schema @subscription
            `;
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    subscriptions: new TestCDCEngine(),
                    excludeDeprecatedFields: {
                        aggregationFiltersOutsideConnection: true,
                    },
                },
            });
            const schema = await neoSchema.getSchema();

            const movieWhereType = schema.getType("MovieWhere") as GraphQLInputObjectType;
            expect(movieWhereType).toBeDefined();

            const movieWhereFields = movieWhereType.getFields();

            const actorsConnection = movieWhereFields["actorsConnection"];
            expect(actorsConnection).toBeDefined();

            const connectionFiltersType = schema.getType("MovieActorsConnectionFilters") as GraphQLInputObjectType;
            expect(connectionFiltersType).toBeDefined();

            const { aggregate, some, none, all, single } = connectionFiltersType.getFields();

            expect(some).toBeDefined();
            expect(none).toBeDefined();
            expect(all).toBeDefined();
            expect(single).toBeDefined();

            expect(aggregate).toBeUndefined();
        });
    });

    describe("snapshot tests", () => {
        describe("on SCALAR", () => {
            test("default arguments should disable aggregation", async () => {
                const typeDefs = /* GraphQL */ `
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String @filterable
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
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
                const typeDefs = /* GraphQL */ `
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String @filterable(byValue: true, byAggregate: true)
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
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
                const typeDefs = /* GraphQL */ `
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String @filterable(byValue: false, byAggregate: true)
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    }
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated: MovieCreatedEvent!
                      movieDeleted: MovieDeletedEvent!
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
                const typeDefs = /* GraphQL */ `
                    type Actor @node {
                        username: String!
                        password: String!
                        movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Movie @node {
                        title: String
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN) @filterable
                    }
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
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
                const typeDefs = /* GraphQL */ `
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
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
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
                const typeDefs = /* GraphQL */ `
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
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
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
                const typeDefs = /* GraphQL */ `
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
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
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

        describe("on INTERFACE RELATIONSHIP FIELD", () => {
            test("default arguments should disable aggregation", async () => {
                const typeDefs = /* GraphQL */ `
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
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
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
                const typeDefs = /* GraphQL */ `
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
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
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
                const typeDefs = /* GraphQL */ `
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
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorEdge {
                      cursor: String!
                      node: Actor!
                    }

                    type ActorEventPayload {
                      password: String!
                      username: String!
                    }

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    input MovieUpdateInput {
                      actors: [MovieActorsUpdateFieldInput!]
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
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

        describe("on UNION RELATIONSHIP FIELD, (aggregation does not exists on union types)", () => {
            test("default arguments should disable aggregation", async () => {
                const typeDefs = /* GraphQL */ `
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
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    type AppearanceMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: AppearanceMovieMoviesNodeAggregateSelection
                    }

                    type AppearanceMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input AppearanceSubscriptionWhere {
                      AND: [AppearanceSubscriptionWhere!]
                      NOT: AppearanceSubscriptionWhere
                      OR: [AppearanceSubscriptionWhere!]
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

                    input AppearanceUpdateInput {
                      movies: [AppearanceMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      appearanceCreated(where: AppearanceSubscriptionWhere): AppearanceCreatedEvent!
                      appearanceDeleted(where: AppearanceSubscriptionWhere): AppearanceDeletedEvent!
                      appearanceUpdated(where: AppearanceSubscriptionWhere): AppearanceUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
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
                const typeDefs = /* GraphQL */ `
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
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    type AppearanceMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: AppearanceMovieMoviesNodeAggregateSelection
                    }

                    type AppearanceMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input AppearanceSubscriptionWhere {
                      AND: [AppearanceSubscriptionWhere!]
                      NOT: AppearanceSubscriptionWhere
                      OR: [AppearanceSubscriptionWhere!]
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

                    input AppearanceUpdateInput {
                      movies: [AppearanceMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      appearanceCreated(where: AppearanceSubscriptionWhere): AppearanceCreatedEvent!
                      appearanceDeleted(where: AppearanceSubscriptionWhere): AppearanceDeletedEvent!
                      appearanceUpdated(where: AppearanceSubscriptionWhere): AppearanceUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
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
                const typeDefs = /* GraphQL */ `
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
                    extend schema @subscription
                `;
                const neoSchema = new Neo4jGraphQL({
                    typeDefs,
                    features: {
                        subscriptions: new TestCDCEngine(),
                        excludeDeprecatedFields: {
                            aggregationFiltersOutsideConnection: true,
                        },
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

                    type ActorMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: ActorMovieMoviesNodeAggregateSelection
                    }

                    type ActorMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input ActorSubscriptionWhere {
                      AND: [ActorSubscriptionWhere!]
                      NOT: ActorSubscriptionWhere
                      OR: [ActorSubscriptionWhere!]
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

                    input ActorUpdateInput {
                      movies: [ActorMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    type AppearanceMovieMoviesAggregateSelection {
                      count: CountConnection!
                      node: AppearanceMovieMoviesNodeAggregateSelection
                    }

                    type AppearanceMovieMoviesNodeAggregateSelection {
                      title: StringAggregateSelection!
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

                    input AppearanceSubscriptionWhere {
                      AND: [AppearanceSubscriptionWhere!]
                      NOT: AppearanceSubscriptionWhere
                      OR: [AppearanceSubscriptionWhere!]
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

                    input AppearanceUpdateInput {
                      movies: [AppearanceMoviesUpdateFieldInput!]
                      password: StringScalarMutations
                      password_SET: String @deprecated(reason: \\"Please use the generic mutation 'password: { set: ... } }' instead.\\")
                      username: StringScalarMutations
                      username_SET: String @deprecated(reason: \\"Please use the generic mutation 'username: { set: ... } }' instead.\\")
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
                      movies: MovieRelationshipFilters
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

                    enum EventType {
                      CREATE
                      CREATE_RELATIONSHIP
                      DELETE
                      DELETE_RELATIONSHIP
                      UPDATE
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

                    input MovieSubscriptionWhere {
                      AND: [MovieSubscriptionWhere!]
                      NOT: MovieSubscriptionWhere
                      OR: [MovieSubscriptionWhere!]
                      title: StringScalarFilters
                      title_CONTAINS: String @deprecated(reason: \\"Please use the relevant generic filter title: { contains: ... }\\")
                      title_ENDS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { endsWith: ... }\\")
                      title_EQ: String @deprecated(reason: \\"Please use the relevant generic filter title: { eq: ... }\\")
                      title_IN: [String] @deprecated(reason: \\"Please use the relevant generic filter title: { in: ... }\\")
                      title_STARTS_WITH: String @deprecated(reason: \\"Please use the relevant generic filter title: { startsWith: ... }\\")
                    }

                    input MovieUpdateInput {
                      actors: MovieActorsUpdateInput
                      title: StringScalarMutations
                      title_SET: String @deprecated(reason: \\"Please use the generic mutation 'title: { set: ... } }' instead.\\")
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

                    type Subscription {
                      actorCreated(where: ActorSubscriptionWhere): ActorCreatedEvent!
                      actorDeleted(where: ActorSubscriptionWhere): ActorDeletedEvent!
                      actorUpdated(where: ActorSubscriptionWhere): ActorUpdatedEvent!
                      appearanceCreated(where: AppearanceSubscriptionWhere): AppearanceCreatedEvent!
                      appearanceDeleted(where: AppearanceSubscriptionWhere): AppearanceDeletedEvent!
                      appearanceUpdated(where: AppearanceSubscriptionWhere): AppearanceUpdatedEvent!
                      movieCreated(where: MovieSubscriptionWhere): MovieCreatedEvent!
                      movieDeleted(where: MovieSubscriptionWhere): MovieDeletedEvent!
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
