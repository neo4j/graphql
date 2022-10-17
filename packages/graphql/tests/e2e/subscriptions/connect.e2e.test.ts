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

import type { Driver } from "neo4j-driver";
import supertest from "supertest";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";
import type { TestGraphQLServer } from "../setup/apollo-server";
import { ApolloTestServer } from "../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../utils/TestSubscriptionPlugin";
import { WebSocketTestClient } from "../setup/ws-client";
import Neo4j from "../setup/neo4j";

describe("Connect Subscription", () => {
    let neo4j: Neo4j;
    let driver: Driver;
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let wsClient2: WebSocketTestClient;
    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    let typePerson: UniqueType;
    let typeInfluencer: UniqueType;
    let typeDefs: string;

    beforeEach(async () => {
        typeActor = generateUniqueType("Actor");
        typeMovie = generateUniqueType("Movie");
        typePerson = generateUniqueType("Person");
        typeInfluencer = generateUniqueType("Influencer");

        typeDefs = `
            type ${typeMovie} {
                title: String!
                actors: [${typeActor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                
            }
            
            type ${typeActor} {
                name: String!
                movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }
            
            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }
            
            interface Directed @relationshipProperties {
                year: Int!
            }
            
            interface Review {
                score: Int!
            }
        
            type ${typePerson} implements Reviewer {
                name: String!
                reputation: Int!
            }
            
            type ${typeInfluencer} implements Reviewer {
                reputation: Int!
                url: String!
            }
            
            union Director = ${typePerson} | ${typeActor}
            
            interface Reviewer {
                reputation: Int!

            }
        `;

        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            config: {
                driverConfig: {
                    database: neo4j.getIntegrationDatabaseName(),
                },
            },
            plugins: {
                subscriptions: new TestSubscriptionsPlugin(),
            },
        });
        server = new ApolloTestServer(neoSchema);
        await server.start();

        wsClient = new WebSocketTestClient(server.wsPath);
        wsClient2 = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();
        await wsClient2.close();

        await server.close();
        await driver.close();
    });

    // TODO: filtering!
    // TODO next-up: connectOrCreate

    test("connect with create subscription sends events both ways", async () => {
        await wsClient.subscribe(`
            subscription SubscriptionActor {
                ${typeActor.operations.subscribe.connected} {
                    relationshipName
                    event
                    direction
                    ${typeActor.operations.subscribe.payload.connected} {
                        name
                    }
                    relationship {
                        movies {
                            screenTime
                            node {
                                title
                            }
                        }
                    }
                } 
            }                
        `);

        await wsClient2.subscribe(`
        subscription SubscriptionMovie {
            ${typeMovie.operations.subscribe.connected} {
                direction
                relationshipName
                event
                ${typeMovie.operations.subscribe.payload.connected} {
                    title
                }
                relationship {
                    reviewers {
                        score
                        node {
                            ... on ${typePerson.name}EventPayload {
                                name
                            }
                            ... on ${typeInfluencer.name}EventPayload {
                                url
                            }
                            reputation
                        }
                    }
                    actors {
                        screenTime
                        node {
                            name
                        }
                    }
                    directors {
                        year
                        node {
                            ... on ${typePerson.name}EventPayload {
                                name
                                reputation
                            }
                            ... on ${typeActor.name}EventPayload {
                                name
                            }
                        }
                    }
                }
            }
        }
    `);

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    actors: {
                                    create: [
                                        {
                                        node: {
                                            name: "Keanu"
                                        },
                                        edge: {
                                            screenTime: 1000
                                        }
                                        }
                                    ]
                                    },
                                    title: "Matrix",
                                }
                            ]
                        ) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.connected]: {
                    [typeActor.operations.subscribe.payload.connected]: { name: "Keanu" },
                    event: "CONNECT",
                    direction: "OUT",
                    relationshipName: "ActedIn",
                    relationship: {
                        movies: {
                            screenTime: 1000,
                            node: {
                                title: "Matrix",
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.connected]: {
                    [typeMovie.operations.subscribe.payload.connected]: { title: "Matrix" },
                    event: "CONNECT",
                    direction: "IN",
                    relationshipName: "ActedIn",
                    relationship: {
                        actors: {
                            screenTime: 1000,
                            node: {
                                name: "Keanu",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("connect with create subscription does not send event if relationship not reciprocal", async () => {
        await wsClient.subscribe(`
            subscription SubscriptionActor {
                ${typeActor.operations.subscribe.connected} {
                    relationshipName
                    event
                    direction
                    ${typeActor.operations.subscribe.payload.connected} {
                        name
                    }
                    relationship {
                        movies {
                            screenTime
                            node {
                                title
                            }
                        }
                    }
                } 
            }                
        `);

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "The Matrix",
                                    directors: {
                                      ${typeActor.name}: {
                                        create: [
                                          {
                                            edge: {
                                              year: 2020
                                            },
                                            node: {
                                              name: "Tim"
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  }
                            ]
                        ) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });

    test("connect with nested create subscription", async () => {
        await wsClient.subscribe(`
            subscription SubscriptionActor {
                ${typeActor.operations.subscribe.connected} {
                    relationshipName
                    event
                    direction
                    ${typeActor.operations.subscribe.payload.connected} {
                        name
                    }
                    relationship {
                        movies {
                            screenTime
                            node {
                                title
                            }
                        }
                    }
                } 
            }                
        `);

        await wsClient2.subscribe(`
        subscription SubscriptionMovie {
            ${typeMovie.operations.subscribe.connected} {
                direction
                relationshipName
                event
                ${typeMovie.operations.subscribe.payload.connected} {
                    title
                }
                relationship {
                    reviewers {
                        score
                        node {
                            ... on ${typePerson.name}EventPayload {
                                name
                            }
                            ... on ${typeInfluencer.name}EventPayload {
                                url
                            }
                            reputation
                        }
                    }
                    actors {
                        screenTime
                        node {
                            name
                        }
                    }
                    directors {
                        year
                        node {
                            ... on ${typePerson.name}EventPayload {
                                name
                                reputation
                            }
                            ... on ${typeActor.name}EventPayload {
                                name
                            }
                        }
                    }
                }
            }
        }
    `);

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    actors: {
                                        create: [
                                            {
                                              edge: {
                                                screenTime: 1200
                                              },
                                              node: {
                                                name: "Keanu Reeves",
                                                movies: {
                                                  create: [
                                                    {
                                                      edge: {
                                                        screenTime: 4200
                                                      },
                                                      node: {
                                                        title: "John Wick"
                                                      }
                                                    }
                                                  ]
                                                }
                                              }
                                            }
                                          ]
                                    },
                                    title: "The Matrix",
                                }
                            ]
                        ) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient.events).toHaveLength(2);
        expect(wsClient2.events).toHaveLength(2);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.connected]: {
                    [typeMovie.operations.subscribe.payload.connected]: { title: "The Matrix" },
                    event: "CONNECT",
                    direction: "IN",
                    relationshipName: "ActedIn",
                    relationship: {
                        actors: {
                            screenTime: 1200,
                            node: {
                                name: "Keanu Reeves",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.connected]: {
                    [typeMovie.operations.subscribe.payload.connected]: { title: "John Wick" },
                    event: "CONNECT",
                    direction: "IN",
                    relationshipName: "ActedIn",
                    relationship: {
                        actors: {
                            screenTime: 4200,
                            node: {
                                name: "Keanu Reeves",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.connected]: {
                    [typeActor.operations.subscribe.payload.connected]: { name: "Keanu Reeves" },
                    event: "CONNECT",
                    direction: "OUT",
                    relationshipName: "ActedIn",
                    relationship: {
                        movies: {
                            screenTime: 1200,
                            node: {
                                title: "The Matrix",
                            },
                        },
                    },
                },
            },
            {
                [typeActor.operations.subscribe.connected]: {
                    [typeActor.operations.subscribe.payload.connected]: { name: "Keanu Reeves" },
                    event: "CONNECT",
                    direction: "OUT",
                    relationshipName: "ActedIn",
                    relationship: {
                        movies: {
                            screenTime: 4200,
                            node: {
                                title: "John Wick",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect with create subscription: interface type", async () => {
        await wsClient.subscribe(`
        subscription SubscriptionMovie {
            ${typeMovie.operations.subscribe.connected} {
                direction
                relationshipName
                event
                ${typeMovie.operations.subscribe.payload.connected} {
                    title
                }
                relationship {
                    reviewers {
                        score
                        node {
                            ... on ${typePerson.name}EventPayload {
                                name
                            }
                            ... on ${typeInfluencer.name}EventPayload {
                                url
                            }
                            reputation
                        }
                    }
                    actors {
                        screenTime
                        node {
                            name
                        }
                    }
                    directors {
                        year
                        node {
                            ... on ${typePerson.name}EventPayload {
                                name
                                reputation
                            }
                            ... on ${typeActor.name}EventPayload {
                                name
                            }
                        }
                    }
                }
            }
        }
    `);

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "The Matrix",
                                    reviewers: {
                                        create: [
                                          {
                                            edge: {
                                              score: 9
                                            },
                                            node: {
                                              ${typePerson.name}: {
                                                name: "Valeria",
                                                reputation: 99
                                              },
                                              ${typeInfluencer.name}: {
                                                url: "cool.guy",
                                                reputation: 1
                                              }
                                            }
                                          }
                                        ]
                                    }
                                }
                            ]
                        ) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.connected]: {
                    [typeMovie.operations.subscribe.payload.connected]: { title: "The Matrix" },
                    event: "CONNECT",
                    direction: "IN",
                    relationshipName: "Review",
                    relationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 9,
                            node: {
                                name: "Valeria",
                                reputation: 99,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.connected]: {
                    [typeMovie.operations.subscribe.payload.connected]: { title: "The Matrix" },
                    event: "CONNECT",
                    direction: "IN",
                    relationshipName: "Review",
                    relationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 9,
                            node: {
                                url: "cool.guy",
                                reputation: 1,
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect with create subscription: union type", async () => {
        await wsClient.subscribe(`
        subscription SubscriptionMovie {
            ${typeMovie.operations.subscribe.connected} {
                direction
                relationshipName
                event
                ${typeMovie.operations.subscribe.payload.connected} {
                    title
                }
                relationship {
                    reviewers {
                        score
                        node {
                            ... on ${typePerson.name}EventPayload {
                                name
                            }
                            ... on ${typeInfluencer.name}EventPayload {
                                url
                            }
                            reputation
                        }
                    }
                    actors {
                        screenTime
                        node {
                            name
                        }
                    }
                    directors {
                        year
                        node {
                            ... on ${typePerson.name}EventPayload {
                                name
                                reputation
                            }
                            ... on ${typeActor.name}EventPayload {
                                name
                            }
                        }
                    }
                }
            }
        }
    `);

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "The Matrix",
                                    directors: {
                                        ${typeActor.name}: {
                                        create: [
                                          {
                                            edge: {
                                              year: 2020
                                            },
                                            node: {
                                              name: "Tim"
                                            }
                                          }
                                        ]
                                      }
                                    }
                                  }
                            ]
                        ) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.connected]: {
                    [typeMovie.operations.subscribe.payload.connected]: { title: "The Matrix" },
                    event: "CONNECT",
                    direction: "IN",
                    relationshipName: "Directed",
                    relationship: {
                        actors: null,
                        reviewers: null,
                        directors: {
                            year: 2020,
                            node: {
                                name: "Tim",
                            },
                        },
                    },
                },
            },
        ]);
        // expect(wsClient.events)[0]?.[typeMovie.operations.connection]?.toEqual({
        //     connectedMovie: { title: "The Matrix" },
        //     event: "CONNECT",
        //     direction: "IN",
        //     relationshipName: "Directed",
        //     relationship: {
        //         actors: null,
        //         reviewers: null,
        //         directors: {
        //             year: 2020,
        //             node: {
        //                 name: "Tim",
        //             },
        //         },
        //     },
        // });
    });

    test("connect with update - update - create subscription sends events both ways", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                actors: {
                                create: [
                                    {
                                    node: {
                                        name: "Keanu Reeves"
                                    },
                                    edge: {
                                        screenTime: 42
                                    }
                                    }
                                ]
                                },
                                title: "John Wick",
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                        }
                    }
                }
            `,
            })
            .expect(200);

        // 2. subscribe both ways
        await wsClient2.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.connected} {
                    direction
                    relationshipName
                    event
                    ${typeMovie.operations.subscribe.payload.connected} {
                        title
                    }
                    relationship {
                        reviewers {
                            score
                            node {
                                ... on ${typePerson.name}EventPayload {
                                    name
                                }
                                ... on ${typeInfluencer.name}EventPayload {
                                    url
                                }
                                reputation
                            }
                        }
                        actors {
                            screenTime
                            node {
                                name
                            }
                        }
                        directors {
                            year
                            node {
                                ... on ${typePerson.name}EventPayload {
                                    name
                                    reputation
                                }
                                ... on ${typeActor.name}EventPayload {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `);

        await wsClient.subscribe(`
            subscription SubscriptionActor {
                ${typeActor.operations.subscribe.connected} {
                    relationshipName
                    event
                    direction
                    ${typeActor.operations.subscribe.payload.connected} {
                        name
                    }
                    relationship {
                        movies {
                            screenTime
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `);

        // 3. perform update on created node
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.update}(
                                where: {
                                  title: "John Wick"
                                },
                                update: {
                                  title: "John Wick 2",
                                  actors: [
                                    {
                                      where: {
                                        node: {
                                          name: "Keanu Reeves"
                                        }
                                      },
                                      update: {
                                        node: {
                                          movies: [
                                            {
                                              create: [
                                                {
                                                  edge: {
                                                    screenTime: 420
                                                  },
                                                  node: {
                                                    title: "Constantine",
                                                    actors: {
                                                      create: [
                                                        {
                                                          edge: {
                                                            screenTime: 12
                                                          },
                                                          node: {
                                                            name: "Jose Molina"
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  }
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                      }
                                    }
                                  ]
                                }
                        ) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient.events).toHaveLength(2);
        expect(wsClient2.events).toHaveLength(2);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.connected]: {
                    [typeMovie.operations.subscribe.payload.connected]: { title: "Constantine" },
                    event: "CONNECT",
                    direction: "IN",
                    relationshipName: "ActedIn",
                    relationship: {
                        actors: {
                            screenTime: 420,
                            node: {
                                name: "Keanu Reeves",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.connected]: {
                    [typeMovie.operations.subscribe.payload.connected]: { title: "Constantine" },
                    event: "CONNECT",
                    direction: "IN",
                    relationshipName: "ActedIn",
                    relationship: {
                        actors: {
                            screenTime: 12,
                            node: {
                                name: "Jose Molina",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.connected]: {
                    [typeActor.operations.subscribe.payload.connected]: { name: "Keanu Reeves" },
                    event: "CONNECT",
                    direction: "OUT",
                    relationshipName: "ActedIn",
                    relationship: {
                        movies: {
                            screenTime: 420,
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
            {
                [typeActor.operations.subscribe.connected]: {
                    [typeActor.operations.subscribe.payload.connected]: { name: "Jose Molina" },
                    event: "CONNECT",
                    direction: "OUT",
                    relationshipName: "ActedIn",
                    relationship: {
                        movies: {
                            screenTime: 12,
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect with update - create subscription sends events one way: union type", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                actors: {
                                create: [
                                    {
                                    node: {
                                        name: "Keanu Reeves"
                                    },
                                    edge: {
                                        screenTime: 42
                                    }
                                    }
                                ]
                                },
                                title: "John Wick",
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                        }
                    }
                }
            `,
            })
            .expect(200);

        // 2. subscribe both ways
        await wsClient2.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.connected} {
                    direction
                    relationshipName
                    event
                    ${typeMovie.operations.subscribe.payload.connected} {
                        title
                    }
                    relationship {
                        reviewers {
                            score
                            node {
                                ... on ${typePerson.name}EventPayload {
                                    name
                                }
                                ... on ${typeInfluencer.name}EventPayload {
                                    url
                                }
                                reputation
                            }
                        }
                        actors {
                            screenTime
                            node {
                                name
                            }
                        }
                        directors {
                            year
                            node {
                                ... on ${typePerson.name}EventPayload {
                                    name
                                    reputation
                                }
                                ... on ${typeActor.name}EventPayload {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `);

        await wsClient.subscribe(`
            subscription SubscriptionPerson {
                ${typePerson.operations.subscribe.connected} {
                    relationshipName
                    event
                    direction
                    ${typePerson.operations.subscribe.payload.connected} {
                        name
                    }
                    relationship {
                        movies {
                            screenTime
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `);

        // 3. perform update on created node
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.update}(
                                where: {
                                  title: "John Wick"
                                },
                                create: {
                                    directors: {
                                      ${typeActor.name}: [
                                        {
                                          edge: {
                                            year: 2014
                                          },
                                          node: {
                                            movies: {
                                              create: [
                                                {
                                                  edge: {
                                                    screenTime: 1234
                                                  },
                                                  node: {
                                                    title: "Mulan"
                                                  }
                                                }
                                              ]
                                            },
                                            name: "Donnie Yen"
                                          }
                                        }
                                      ],
                                      ${typePerson.name}: [
                                        {
                                          edge: {
                                            year: 2014
                                          },
                                          node: {
                                            name: "Chad",
                                            reputation: 120
                                          }
                                        }
                                      ]
                                    }
                                }
                        ) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient.events).toEqual([]);

        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.connected]: {
                    [typeMovie.operations.subscribe.payload.connected]: { title: "Mulan" },
                    event: "CONNECT",
                    direction: "IN",
                    relationshipName: "ActedIn",
                    relationship: {
                        actors: {
                            screenTime: 1234,
                            node: {
                                name: "Donnie Yen",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.connected]: {
                    [typeMovie.operations.subscribe.payload.connected]: { title: "John Wick" },
                    event: "CONNECT",
                    direction: "IN",
                    relationshipName: "Directed",
                    relationship: {
                        actors: null,
                        directors: {
                            year: 2014,
                            node: {
                                name: "Donnie Yen",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.connected]: {
                    [typeMovie.operations.subscribe.payload.connected]: { title: "John Wick" },
                    event: "CONNECT",
                    direction: "IN",
                    relationshipName: "Directed",
                    relationship: {
                        actors: null,
                        directors: {
                            year: 2014,
                            node: {
                                name: "Chad",
                                reputation: 120,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    // update - update - create w/ union?

    // FIXME: uncovers bug on interfaces
    test.skip("connect with update - create subscription sends events one way: interface type", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                actors: {
                                create: [
                                    {
                                    node: {
                                        name: "Keanu Reeves"
                                    },
                                    edge: {
                                        screenTime: 42
                                    }
                                    }
                                ]
                                },
                                title: "John Wick",
                            }
                        ]
                    ) {
                        ${typeMovie.plural} {
                            title
                        }
                    }
                }
            `,
            })
            .expect(200);

        // 2. subscribe both ways
        await wsClient2.subscribe(`
            subscription SubscriptionMovie {
                ${typeMovie.operations.subscribe.connected} {
                    direction
                    relationshipName
                    event
                    ${typeMovie.operations.subscribe.payload.connected} {
                        title
                    }
                    relationship {
                        reviewers {
                            score
                            node {
                                ... on ${typePerson.name}EventPayload {
                                    name
                                }
                                ... on ${typeInfluencer.name}EventPayload {
                                    url
                                }
                                reputation
                            }
                        }
                        actors {
                            screenTime
                            node {
                                name
                            }
                        }
                        directors {
                            year
                            node {
                                ... on ${typePerson.name}EventPayload {
                                    name
                                    reputation
                                }
                                ... on ${typeActor.name}EventPayload {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `);

        await wsClient.subscribe(`
            subscription SubscriptionPerson {
                ${typePerson.operations.subscribe.connected} {
                    relationshipName
                    event
                    direction
                    ${typePerson.operations.subscribe.payload.connected} {
                        name
                    }
                    relationship {
                        movies {
                            screenTime
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `);

        // 3. perform update on created node
        const r = await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.update}(
                                where: {
                                  title: "John Wick"
                                },
                                update: {
                                    reviewers: [{
                                      create: [{
                                        edge: {
                                            score: 10
                                        },
                                        node: {
                                            ${typePerson}: {
                                                reputation: 100,
                                                name: "Ana"
                                            }
                                        }
                                      }]
                                    }]
                                }
                        ) {
                            ${typeMovie.plural} {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        expect(JSON.parse(r.text).errors).toEqual([]);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        // expect(wsClient.events).toEqual([]);
        // expect(wsClient2.events).toHaveLength(3);
        // expect(wsClient2.events).toIncludeSameMembers([
        //     {
        //         [typeMovie.operations.subscribe.connected]: {
        //             [typeMovie.operations.subscribe.payload.connected]: { title: "Mulan" },
        //             event: "CONNECT",
        //             direction: "IN",
        //             relationshipName: "ActedIn",
        //             relationship: {
        //                 actors: {
        //                     screenTime: 1234,
        //                     node: {
        //                         name: "Donnie Yen",
        //                     },
        //                 },
        //                 directors: null,
        //                 reviewers: null,
        //             },
        //         },
        //     },
        //     {
        //         [typeMovie.operations.subscribe.connected]: {
        //             [typeMovie.operations.subscribe.payload.connected]: { title: "John Wick" },
        //             event: "CONNECT",
        //             direction: "IN",
        //             relationshipName: "Directed",
        //             relationship: {
        //                 actors: null,
        //                 directors: {
        //                     year: 2014,
        //                     node: {
        //                         name: "Donnie Yen",
        //                     },
        //                 },
        //                 reviewers: null,
        //             },
        //         },
        //     },
        //     {
        //         [typeMovie.operations.subscribe.connected]: {
        //             [typeMovie.operations.subscribe.payload.connected]: { title: "John Wick" },
        //             event: "CONNECT",
        //             direction: "IN",
        //             relationshipName: "Directed",
        //             relationship: {
        //                 actors: null,
        //                 directors: {
        //                     year: 2014,
        //                     node: {
        //                         name: "Chad",
        //                         reputation: 120,
        //                     },
        //                 },
        //                 reviewers: null,
        //             },
        //         },
        //     },
        // ]);
    });
});
