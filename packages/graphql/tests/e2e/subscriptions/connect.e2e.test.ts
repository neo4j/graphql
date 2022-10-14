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

    // TODO: to unique types

    beforeEach(async () => {
        typeActor = generateUniqueType("Actor");
        typeMovie = generateUniqueType("Movie");
        typePerson = generateUniqueType("Person");
        typeInfluencer = generateUniqueType("Influencer");

        typeDefs = `
            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                
            }
            
            type Actor {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
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
        
            type Person implements Reviewer {
                name: String!
                reputation: Int!
            }
            
            type Influencer implements Reviewer {
                reputation: Int!
                url: String!
            }
            
            union Director = Person | Actor
            
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

    // TODO: should send to the same wsClient?
    test("connect subscription sends events both ways", async () => {
        await wsClient.subscribe(`
            subscription SubscriptionActor {
                actorConnected {
                    relationshipName
                    event
                    direction
                    connectedActor {
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
                movieConnected {
                    direction
                    relationshipName
                    connectedMovie {
                        title
                    }
                    relationship {
                        reviewers {
                            score
                            node {
                                ... on PersonEventPayload {
                                    name
                                }
                                ... on InfluencerEventPayload {
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
                                ... on PersonEventPayload {
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
                        createMovies(
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
                            movies {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        console.log("sent");
        console.log(wsClient.events);
        console.log(wsClient2.events);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events)[0]?.movieConnected?.toEqual({
            connectedMovie: { title: "Matrix" },
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
        });
        expect(wsClient.events)[0]?.actorConnected?.toEqual({
            connectedActor: { name: "Keanu" },
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
        });
    });

    // TODO: this fails until code added to filter sending events only if relationship exists on node
    test("connect subscription does not send event if relationship not reciprocal", async () => {
        await wsClient.subscribe(`
            subscription SubscriptionActor {
                actorConnected {
                    relationshipName
                    event
                    direction
                    connectedActor {
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
                        createMovies(
                            input: [
                                {
                                    title: "The Matrix",
                                    directors: {
                                      Actor: {
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
                            movies {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        console.log(wsClient.events);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });

    // TODO: filtering!

    // TODO: unions & interfaces
    test("connect subscription: interface type", async () => {
        await wsClient.subscribe(`
            subscription SubscriptionMovie {
                movieConnected {
                    direction
                    relationshipName
                    connectedMovie {
                        title
                    }
                    relationship {
                        reviewers {
                            score
                            node {
                                ... on PersonEventPayload {
                                    name
                                }
                                ... on InfluencerEventPayload {
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
                                ... on PersonEventPayload {
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
                        createMovies(
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
                                              Person: {
                                                name: "Valeria",
                                                reputation: 99
                                              },
                                              Influencer: {
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
                            movies {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        console.log(wsClient.events);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });

    test.only("connect subscription: union type", async () => {
        await wsClient.subscribe(`
            subscription SubscriptionMovie {
                movieConnected {
                    direction
                    relationshipName
                    connectedMovie {
                        title
                    }
                    relationship {
                        reviewers {
                            score
                            node {
                                ... on PersonEventPayload {
                                    name
                                }
                                ... on InfluencerEventPayload {
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
                                ... on PersonEventPayload {
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
                        createMovies(
                            input: [
                                {
                                    title: "The Matrix",
                                    directors: {
                                      Actor: {
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
                            movies {
                                title
                            }
                        }
                    }
                `,
            })
            .expect(200);

        console.log(wsClient.events);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });
});
