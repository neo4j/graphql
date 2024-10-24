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

import type { GraphQLFieldMap } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";

describe("@subscription directive", () => {
    describe("on OBJECT", () => {
        test("default arguments should enable subscription for CREATE, UPDATE, DELETE", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Movie @subscription @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { subscriptions: new TestCDCEngine() },
            });
            const schema = await neoSchema.getSchema();

            const subscriptionFields = schema.getSubscriptionType()?.getFields() as GraphQLFieldMap<any, any>;

            const actorCreated = subscriptionFields["actorCreated"];
            const movieCreated = subscriptionFields["movieCreated"];

            expect(actorCreated).toBeDefined();
            expect(movieCreated).toBeDefined();

            const actorUpdated = subscriptionFields["actorUpdated"];
            const movieUpdated = subscriptionFields["movieUpdated"];

            expect(actorUpdated).toBeDefined();
            expect(movieUpdated).toBeDefined();

            const actorDeleted = subscriptionFields["actorDeleted"];
            const movieDeleted = subscriptionFields["movieDeleted"];

            expect(actorDeleted).toBeDefined();
            expect(movieDeleted).toBeDefined();
        });

        test("should disable subscription for CREATE", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Movie @subscription(events: [UPDATED, DELETED]) @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });
            const schema = await neoSchema.getSchema();
            const subscriptionFields = schema.getSubscriptionType()?.getFields() as GraphQLFieldMap<any, any>;

            const actorCreated = subscriptionFields["actorCreated"];
            const movieCreated = subscriptionFields["movieCreated"];

            expect(actorCreated).toBeDefined();
            expect(movieCreated).toBeUndefined();

            const actorUpdated = subscriptionFields["actorUpdated"];
            const movieUpdated = subscriptionFields["movieUpdated"];

            expect(actorUpdated).toBeDefined();
            expect(movieUpdated).toBeDefined();

            const actorDeleted = subscriptionFields["actorDeleted"];
            const movieDeleted = subscriptionFields["movieDeleted"];

            expect(actorDeleted).toBeDefined();
            expect(movieDeleted).toBeDefined();
        });

        test("should disable subscription for UPDATE", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Movie @subscription(events: [CREATED, DELETED]) @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });
            const schema = await neoSchema.getSchema();
            const subscriptionFields = schema.getSubscriptionType()?.getFields() as GraphQLFieldMap<any, any>;

            const actorCreated = subscriptionFields["actorCreated"];
            const movieCreated = subscriptionFields["movieCreated"];

            expect(actorCreated).toBeDefined();
            expect(movieCreated).toBeDefined();

            const actorUpdated = subscriptionFields["actorUpdated"];
            const movieUpdated = subscriptionFields["movieUpdated"];

            expect(actorUpdated).toBeDefined();
            expect(movieUpdated).toBeUndefined();

            const actorDeleted = subscriptionFields["actorDeleted"];
            const movieDeleted = subscriptionFields["movieDeleted"];

            expect(actorDeleted).toBeDefined();
            expect(movieDeleted).toBeDefined();
        });

        test("should disable subscription for DELETE", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Movie @subscription(events: [CREATED, UPDATED]) @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });
            const schema = await neoSchema.getSchema();
            const subscriptionFields = schema.getSubscriptionType()?.getFields() as GraphQLFieldMap<any, any>;

            const actorCreated = subscriptionFields["actorCreated"];
            const movieCreated = subscriptionFields["movieCreated"];

            expect(actorCreated).toBeDefined();
            expect(movieCreated).toBeDefined();

            const actorUpdated = subscriptionFields["actorUpdated"];
            const movieUpdated = subscriptionFields["movieUpdated"];

            expect(actorUpdated).toBeDefined();
            expect(movieUpdated).toBeDefined();

            const actorDeleted = subscriptionFields["actorDeleted"];
            const movieDeleted = subscriptionFields["movieDeleted"];

            expect(actorDeleted).toBeDefined();
            expect(movieDeleted).toBeUndefined();
        });

        test("should not throw an Error when is mixed with @query", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Movie @query(read: true) @subscription(events: []) @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });

            const schema = await neoSchema.getSchema();
            expect(schema).toBeDefined();
        });
    });

    describe("on SCHEMA", () => {
        test("default arguments should enable subscription for CREATE, UPDATE, DELETE", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
                extend schema @subscription
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });
            const schema = await neoSchema.getSchema();

            const subscriptionFields = schema.getSubscriptionType()?.getFields() as GraphQLFieldMap<any, any>;

            const actorCreated = subscriptionFields["actorCreated"];
            const movieCreated = subscriptionFields["movieCreated"];

            expect(actorCreated).toBeDefined();
            expect(movieCreated).toBeDefined();

            const actorUpdated = subscriptionFields["actorUpdated"];
            const movieUpdated = subscriptionFields["movieUpdated"];

            expect(actorUpdated).toBeDefined();
            expect(movieUpdated).toBeDefined();

            const actorDeleted = subscriptionFields["actorDeleted"];
            const movieDeleted = subscriptionFields["movieDeleted"];

            expect(actorDeleted).toBeDefined();
            expect(movieDeleted).toBeDefined();
        });

        test("should disable subscription for CREATE", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
                extend schema @subscription(events: [UPDATED, DELETED])
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });
            const schema = await neoSchema.getSchema();
            const subscriptionFields = schema.getSubscriptionType()?.getFields() as GraphQLFieldMap<any, any>;

            const actorCreated = subscriptionFields["actorCreated"];
            const movieCreated = subscriptionFields["movieCreated"];

            expect(actorCreated).toBeUndefined();
            expect(movieCreated).toBeUndefined();

            const actorUpdated = subscriptionFields["actorUpdated"];
            const movieUpdated = subscriptionFields["movieUpdated"];

            expect(actorUpdated).toBeDefined();
            expect(movieUpdated).toBeDefined();

            const actorDeleted = subscriptionFields["actorDeleted"];
            const movieDeleted = subscriptionFields["movieDeleted"];

            expect(actorDeleted).toBeDefined();
            expect(movieDeleted).toBeDefined();
        });

        test("should disable subscription for UPDATE", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
                extend schema @subscription(events: [CREATED, DELETED])
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });
            const schema = await neoSchema.getSchema();
            const subscriptionFields = schema.getSubscriptionType()?.getFields() as GraphQLFieldMap<any, any>;

            const actorCreated = subscriptionFields["actorCreated"];
            const movieCreated = subscriptionFields["movieCreated"];

            expect(actorCreated).toBeDefined();
            expect(movieCreated).toBeDefined();

            const actorUpdated = subscriptionFields["actorUpdated"];
            const movieUpdated = subscriptionFields["movieUpdated"];

            expect(actorUpdated).toBeUndefined();
            expect(movieUpdated).toBeUndefined();

            const actorDeleted = subscriptionFields["actorDeleted"];
            const movieDeleted = subscriptionFields["movieDeleted"];

            expect(actorDeleted).toBeDefined();
            expect(movieDeleted).toBeDefined();
        });

        test("should disable subscription for DELETE", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
                extend schema @subscription(events: [CREATED, UPDATED])
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });
            const schema = await neoSchema.getSchema();
            const subscriptionFields = schema.getSubscriptionType()?.getFields() as GraphQLFieldMap<any, any>;

            const actorCreated = subscriptionFields["actorCreated"];
            const movieCreated = subscriptionFields["movieCreated"];

            expect(actorCreated).toBeDefined();
            expect(movieCreated).toBeDefined();

            const actorUpdated = subscriptionFields["actorUpdated"];
            const movieUpdated = subscriptionFields["movieUpdated"];

            expect(actorUpdated).toBeDefined();
            expect(movieUpdated).toBeDefined();

            const actorDeleted = subscriptionFields["actorDeleted"];
            const movieDeleted = subscriptionFields["movieDeleted"];

            expect(actorDeleted).toBeUndefined();
            expect(movieDeleted).toBeUndefined();
        });

        test("should not throw an Error when is mixed with @query", async () => {
            const typeDefs = gql`
                type Actor @node {
                    username: String!
                    password: String!
                    actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Movie @node {
                    title: String
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
                extend schema @query(read: true) @subscription(events: [])
            `;
            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { subscriptions: new TestCDCEngine() } });

            const schema = await neoSchema.getSchema();
            expect(schema).toBeDefined();
        });
    });
});
