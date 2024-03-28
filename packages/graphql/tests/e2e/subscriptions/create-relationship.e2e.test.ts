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

import supertest from "supertest";
import { Neo4jGraphQLSubscriptionsDefaultEngine } from "../../../src/classes/subscription/Neo4jGraphQLSubscriptionsDefaultEngine";
import { delay } from "../../../src/utils/utils";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";
import type { TestGraphQLServer } from "../setup/apollo-server";
import { ApolloTestServer } from "../setup/apollo-server";
import { WebSocketTestClient } from "../setup/ws-client";

describe("Create Relationship Subscription", () => {
    const testHelper = new TestHelper();
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let wsClient2: WebSocketTestClient;
    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    let typePerson: UniqueType;
    let typeInfluencer: UniqueType;
    let typeDefs: string;

    beforeEach(async () => {
        typeActor = testHelper.createUniqueType("Actor");
        typeMovie = testHelper.createUniqueType("Movie");
        typePerson = testHelper.createUniqueType("Person");
        typeInfluencer = testHelper.createUniqueType("Influencer");

        typeDefs = `
            type ${typeMovie} {
                title: String!
                actors: [${typeActor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                imdbId: Int @unique
            }
            
            type ${typeActor} {
                name: String!
                id: Int @unique
                movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }
            
            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
            
            type Directed @relationshipProperties {
                year: Int!
            }
            
            type Review @relationshipProperties {
                score: Int!
            }
        
            type ${typePerson} implements Reviewer {
                name: String!
                reputation: Int!
                id: Int @unique
                reviewerId: Int @unique
                movies: [${typeMovie}!]! @relationship(type: "REVIEWED", direction: OUT, properties: "Review")
            }
            
            type ${typeInfluencer} implements Reviewer {
                reputation: Int!
                url: String!
                reviewerId: Int
            }
            
            union Director = ${typePerson} | ${typeActor}
            
            interface Reviewer {
                reputation: Int!
                reviewerId: Int

            }
        `;

        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: new Neo4jGraphQLSubscriptionsDefaultEngine(),
            },
        });
        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async ({ req }) => ({
            sessionConfig: {
                database: testHelper.database,
            },
            token: req.headers.authorization,
        }));
        await server.start();

        wsClient = new WebSocketTestClient(server.wsPath);
        wsClient2 = new WebSocketTestClient(server.wsPath);
    });

    afterEach(async () => {
        await wsClient.close();
        await wsClient2.close();

        await testHelper.close();
        await server.close();
    });

    const actorSubscriptionQuery = (typeActor) => `
    subscription SubscriptionActor {
        ${typeActor.operations.subscribe.relationship_created} {
            relationshipFieldName
            event
            ${typeActor.operations.subscribe.payload.relationship_created} {
                name
            }
            createdRelationship {
                movies {
                    screenTime
                    node {
                        title
                    }
                }
            }
        } 
    }                
`;

    const movieSubscriptionQuery = ({ typeMovie, typePerson, typeInfluencer }) => `
subscription SubscriptionMovie {
    ${typeMovie.operations.subscribe.relationship_created} {
        relationshipFieldName
        event
        ${typeMovie.operations.subscribe.payload.relationship_created} {
            title
        }
        createdRelationship {
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
`;

    const personSubscriptionQuery = (typePerson) => `
subscription SubscriptionPerson {
    ${typePerson.operations.subscribe.relationship_created} {
        relationshipFieldName
        event
        ${typePerson.operations.subscribe.payload.relationship_created} {
            name
        }
        createdRelationship {
            movies {
                score
                node {
                    title
                }
            }
        }
    }
}
`;

    test("connect via create subscription sends events both ways", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeMovie, typePerson, typeInfluencer }));

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

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Keanu" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
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
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
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

    test("connect via create subscription does not send event if relationship not reciprocal", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

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

        // forcing a delay to ensure events do not exist
        await delay(4);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
    });

    test("connect via nested create subscription", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeMovie, typePerson, typeInfluencer }));

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

        await wsClient.waitForEvents(2);
        await wsClient2.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient.events).toHaveLength(2);
        expect(wsClient2.events).toHaveLength(2);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
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
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "John Wick" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
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
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Keanu Reeves" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
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
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Keanu Reeves" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
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

    test("connect via create subscription: interface type", async () => {
        await wsClient.subscribe(movieSubscriptionQuery({ typePerson, typeInfluencer, typeMovie }));

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

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
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
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
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

    test("connect via create subscription: union type", async () => {
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

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

        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
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
    });

    test("connect via update - update - create subscription sends events both ways", async () => {
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
        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

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

        await wsClient.waitForEvents(2);
        await wsClient2.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient.events).toHaveLength(2);
        expect(wsClient2.events).toHaveLength(2);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Constantine" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
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
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Constantine" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
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
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Keanu Reeves" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
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
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Jose Molina" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
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

    test("connect via update - create subscription sends events one way: union type", async () => {
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
        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await wsClient.subscribe(personSubscriptionQuery(typePerson));

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

        // forcing a delay to ensure events do not exist
        await delay(2);
        await wsClient2.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient.events).toEqual([]);

        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Mulan" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
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
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "John Wick" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
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
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "John Wick" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
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

    test("connect via update - update - create subscription sends events one way: union type", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                directors: {
                                    ${typeActor.name}: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Keanu Reeves"
                                                },
                                                edge: {
                                                    year: 2018
                                                }
                                            }
                                        ]
                                    }
                                    
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
        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await wsClient.subscribe(personSubscriptionQuery(typePerson));

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
                                    directors: {
                                      ${typeActor.name}: [
                                        {
                                            where: {
                                                node: {
                                                    name: "Keanu Reeves"
                                                }
                                            },
                                            update: {
                                                edge: {
                                                    year: 2020
                                                },
                                                node: {
                                                    name: "KEANU Reeves",
                                                    movies: [
                                                        {
                                                            create: [
                                                                {
                                                                    edge: { 
                                                                        screenTime: 2345
                                                                    },
                                                                    node: {
                                                                        title: "Constantine"
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

        // forcing a delay to ensure events do not exist
        await delay(2);
        await wsClient2.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient.events).toEqual([]);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Constantine" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 2345,
                            node: {
                                name: "KEANU Reeves",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("connect via update - create subscription sends events one way: interface type", async () => {
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
        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await wsClient.subscribe(personSubscriptionQuery(typePerson));

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
                                    reviewers: [{
                                      create: [{
                                        edge: {
                                            score: 10
                                        },
                                        node: {
                                            ${typePerson}: {
                                                reputation: 100,
                                                name: "Ana",
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

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient.events).toHaveLength(1);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "John Wick" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                name: "Ana",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect via nested update - create subscription sends events one way: interface type", async () => {
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
        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await wsClient.subscribe(personSubscriptionQuery(typePerson));

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
                                    reviewers: [{
                                      create: [{
                                        edge: {
                                            score: 10
                                        },
                                        node: {
                                            ${typePerson}: {
                                                reputation: 100,
                                                name: "Ana",
                                                movies: {
                                                    create: [
                                                        {
                                                            edge: {  
                                                                score: 9
                                                            },
                                                            node: {
                                                                title: "Matrix"
                                                            }
                                                        }
                                                    ]
                                                }
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

        await wsClient.waitForEvents(2);
        await wsClient2.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient.events).toHaveLength(2);
        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "John Wick" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                name: "Ana",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 9,
                            node: {
                                name: "Ana",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
        ]);
        // TODO: fix these
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.relationship_created]: {
                    [typePerson.operations.subscribe.payload.relationship_created]: { name: "Ana" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            score: 10,
                            node: {
                                title: "John Wick",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_created]: {
                    [typePerson.operations.subscribe.payload.relationship_created]: { name: "Ana" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            score: 9,
                            node: {
                                title: "Matrix",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect via create - connect subscription simple case", async () => {
        // 1. create resources that will be connected
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Matrix",
                                    imdbId: 1
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

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                            {
                              name: "Keanu",
                              movies: {
                                connect: [
                                  {
                                    where: {
                                      node: {
                                        title: "Matrix",
                                        imdbId: 1
                                      }
                                    },
                                    edge: {
                                      screenTime: 250
                                    },
                                  }
                                ]
                              }
                            }
                        ]
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 250,
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
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Keanu" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 250,
                            node: {
                                title: "Matrix",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect via create - connect subscription simple case + interface by own fields", async () => {
        // 1. create resources that will be connected
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typePerson.operations.create}(
                        input: [
                            {
                                name: "Ana",
                                reputation: 100
                            }
                        ]
                    ) {
                        ${typePerson.plural} {
                            reputation
                            name
                        }
                    }
                }
            `,
            })
            .expect(200);

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Matrix",
                                    imdbId: 1,
                                    reviewers: {
                                      connect: [
                                        {
                                          where: {
                                            node: {
                                                reputation: 100
                                            }
                                          },
                                          edge: {
                                            score: 10
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

        // forcing a delay to ensure events do not exist
        await delay(2);
        await wsClient2.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toEqual([]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                name: "Ana",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect via create - connect subscription simple case + interface by common field", async () => {
        // 1. create resources that will be connected
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typePerson.operations.create}(
                        input: [
                            {
                                name: "Ana",
                                reputation: 100
                            }
                        ]
                    ) {
                        ${typePerson.plural} {
                            reputation
                            name
                        }
                    }
                }
            `,
            })
            .expect(200);

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Matrix",
                                    imdbId: 1,
                                    reviewers: {
                                      connect: [
                                        {
                                          where: {
                                            node: {
                                              reputation: 100,
                                            }
                                          },
                                          edge: {
                                            score: 10
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

        // forcing a delay to ensure events do not exist
        await delay(2);
        await wsClient2.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toEqual([]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                name: "Ana",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect via create - connect subscription simple case with duplicate nodes + interface (NW)", async () => {
        // 1. create resources that will be connected
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typePerson.operations.create}(
                        input: [
                            {
                                name: "Ana",
                                reputation: 100
                            },
                            {
                                name: "Ana",
                                reputation: 100
                            }
                        ]
                    ) {
                        ${typePerson.plural} {
                            reputation
                            name
                        }
                    }
                }
            `,
            })
            .expect(200);

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Matrix",
                                    imdbId: 1,
                                    reviewers: {
                                      connect: [
                                        {
                                          where: {
                                            node: {
                                                reputation: 100
                                            }
                                          },
                                          edge: {
                                            score: 10
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

        // forcing a delay to ensure events do not exist
        await delay(2);
        await wsClient2.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient.events).toEqual([]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                name: "Ana",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                name: "Ana",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect via create - connect subscription simple case with 1 matching node + interface", async () => {
        // 1. create resources that will be connected
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typePerson.operations.create}(
                        input: [
                            {
                                name: "Ana",
                                reputation: 100
                            },
                            {
                                name: "Bob",
                                reputation: 101
                            }
                        ]
                    ) {
                        ${typePerson.plural} {
                            reputation
                            name
                        }
                    }
                }
            `,
            })
            .expect(200);

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Matrix",
                                    imdbId: 1,
                                    reviewers: {
                                      connect: [
                                        {
                                          where: {
                                            node: {
                                                reputation: 100
                                            }
                                          },
                                          edge: {
                                            score: 10
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

        // forcing a delay to ensure events do not exist
        await delay(2);
        await wsClient2.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toEqual([]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                name: "Ana",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect via create - connect subscription simple case with 2 matching nodes + interface (NW)", async () => {
        // 1. create resources that will be connected
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typePerson.operations.create}(
                        input: [
                            {
                                name: "Ana",
                                reputation: 100
                            },
                            {
                                name: "Bob",
                                reputation: 100
                            }
                        ]
                    ) {
                        ${typePerson.plural} {
                            reputation
                            name
                        }
                    }
                }
            `,
            })
            .expect(200);

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Matrix",
                                    imdbId: 1,
                                    reviewers: {
                                      connect: [
                                        {
                                          where: {
                                            node: {
                                              reputation: 100
                                            }
                                          },
                                          edge: {
                                            score: 10
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

        // forcing a delay to ensure events do not exist
        await delay(2);
        await wsClient2.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient.events).toEqual([]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                name: "Ana",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                name: "Bob",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect via create - connect subscription 2 levels deep + interface", async () => {
        // 1. create resources that will be connected
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Matrix",
                                    imdbId: 1
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
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typePerson.operations.create}(
                            input: [
                                {
                                    reputation: 100,
                                    name: "Ana"
                                }
                            ]
                        ) {
                            ${typePerson.plural} {
                                reputation
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                            {
                              name: "Keanu",
                              movies: {
                                connect: [
                                  {
                                    where: {
                                      node: {
                                        title: "Matrix",
                                      }
                                    },
                                    edge: {
                                      screenTime: 250
                                    },
                                    connect: [
                                        {
                                            reviewers: [
                                                {
                                                  edge: {
                                                    score: 10
                                                  },
                                                  where: {
                                                    node: {
                                                        reputation: 100
                                              
                                                    }
                                                  },
                                                }
                                            ]
                                        }
                                    ]
                                  }
                                ]
                              }
                            }
                        ]
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 250,
                            node: {
                                name: "Keanu",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                name: "Ana",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Keanu" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 250,
                            node: {
                                title: "Matrix",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect via create - connect subscription 3 levels deep + union", async () => {
        // 1. create resources that will be connected
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Matrix",
                                    imdbId: 1
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
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                    name: "Marion",
                                }
                            ]
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                            {
                              name: "Keanu",
                              movies: {
                                connect: [
                                  {
                                    where: {
                                      node: {
                                        title: "Matrix",
                                        imdbId: 1
                                      }
                                    },
                                    edge: {
                                      screenTime: 250
                                    },
                                    connect: [
                                        {
                                            directors: {
                                                ${typeActor.name}: [
                                                {
                                                  where: {
                                                    node: {
                                                      name: "Marion"
                                                    }
                                                  },
                                                  edge: {
                                                    year: 2015
                                                  },
                                                  connect: [
                                                    {
                                                      movies: [
                                                        {
                                                          where: {
                                                            node: {
                                                              title: "Matrix",
                                                              imdbId: 1
                                                            }
                                                          },
                                                          edge: {
                                                            screenTime: 199
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                }
                                              ]
                                            }  
                                        }
                                    ]
                                  }
                                ]
                              }
                            }
                        ]
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(2);
        await wsClient2.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 250,
                            node: {
                                name: "Keanu",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 199,
                            node: {
                                name: "Marion",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 2015,
                            node: {
                                name: "Marion",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Keanu" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 250,
                            node: {
                                title: "Matrix",
                            },
                        },
                    },
                },
            },
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Marion" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 199,
                            node: {
                                title: "Matrix",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("connect via update - connect subscription sends events both ways: union type", async () => {
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

        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typePerson.operations.create}(
                        input: [
                            {
                                name: "John",
                                reputation: 100
                            }
                        ]
                    ) {
                        ${typePerson.plural} {
                            reputation
                            name
                        }
                    }
                }
            `,
            })
            .expect(200);

        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeActor.operations.create}(
                        input: [
                            {
                                name: "Tom"
                            }
                        ]
                    ) {
                        ${typeActor.plural} {
                            name
                        }
                    }
                }
            `,
            })
            .expect(200);

        // 2. subscribe both ways
        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await wsClient.subscribe(personSubscriptionQuery(typePerson));

        // 3. perform update on created node
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.update}(
                                where: {
                                  name: "Keanu Reeves"
                                },
                                connect: {
                                    movies: [
                                      {
                                        edge: {
                                          screenTime: 420
                                        },
                                        where: {
                                          node: {
                                            title: "John Wick"
                                          }
                                        },
                                        connect: [
                                          {
                                            directors: {
                                              ${typeActor.name}: [
                                                {
                                                  edge: { 
                                                    year: 2019
                                                  },
                                                  where: {
                                                    node: {
                                                      name: "Tom"
                                                    }
                                                  }
                                                }
                                              ],
                                              ${typePerson.name}: [
                                                {
                                                  edge: {
                                                    year: 2020
                                                  },
                                                  where: {
                                                    node: {
                                                      name: "John",
                                                      reputation: 100
                                                    }
                                                  }
                                                }
                                              ]
                                            }
                                          }
                                        ]
                                      }
                                    ]
                                  }
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        // forcing a delay to ensure events do not exist
        await delay(3);
        await wsClient2.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(0);
        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "John Wick" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
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
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "John Wick" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 2019,

                            node: {
                                name: "Tom",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "John Wick" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 2020,

                            node: {
                                name: "John",
                                reputation: 100,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("connect via create - connectOrCreate, onCreate subscription sends events both ways", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                    name: "Keanu Reeves",
                                    movies: {
                                      connectOrCreate: [
                                        {
                                          onCreate: {
                                            edge: {
                                              screenTime: 1200
                                            },
                                            node: {
                                              title: "The Matrix",
                                              imdbId: 1
                                            }
                                          },
                                          where: {
                                            node: {
                                              imdbId: 1
                                            }
                                          }
                                        }
                                      ]
                                    }
                                  }
                            ]
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Keanu Reeves" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 1200,
                            node: {
                                title: "The Matrix",
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
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
        ]);
    });

    test("connect via nested create - connectOrCreate, onCreate subscription sends events both ways", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                    name: "Keanu",
                                    movies: {
                                      create: [
                                        {
                                          edge: {
                                            screenTime: 4200
                                          },
                                          node: {
                                            title: "The Matrix",
                                            imdbId: 1,
                                            actors: {
                                              create: [
                                                {
                                                  edge: {
                                                    screenTime: 200
                                                  },
                                                  node: {
                                                    name: "Tom",
                                                    movies: {
                                                      connectOrCreate: [
                                                        {
                                                          where: {
                                                            node: {
                                                              imdbId: 2
                                                            }
                                                          },
                                                          onCreate: {
                                                            edge: {
                                                              screenTime: 500
                                                            },
                                                            node: {
                                                              title: "Constantine",
                                                              imdbId: 2
                                                            }
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  }
                                                }
                                              ]
                                            }
                                          }
                                        }
                                      ]
                                    }
                                }
                            ]
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(3);
        await wsClient2.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(3);
        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Keanu" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 4200,
                            node: {
                                title: "The Matrix",
                            },
                        },
                    },
                },
            },
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Tom" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 200,
                            node: {
                                title: "The Matrix",
                            },
                        },
                    },
                },
            },
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Tom" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 500,
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 4200,
                            node: {
                                name: "Keanu",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 200,
                            node: {
                                name: "Tom",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Constantine" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 500,
                            node: {
                                name: "Tom",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("connect via create - connectOrCreate, onCreate subscription sends events one way: union type", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "The Matrix",
                                    imdbId: 1,
                                    directors: {
                                      ${typeActor.name}: {
                                        connectOrCreate: [
                                          {
                                            where: {
                                              node: {
                                                id: 1
                                              }
                                            },
                                            onCreate: {
                                              edge: {
                                                year: 1990
                                              },
                                              node: {
                                                id: 1,
                                                name: "Edgar"
                                              }
                                            }
                                          }
                                        ]
                                      },
                                      ${typePerson.name}: {
                                        connectOrCreate: [
                                          {
                                            where: {
                                              node: {
                                                id: 2
                                              }
                                            },
                                            onCreate: {
                                              node: {
                                                name: "Poe",
                                                reputation: 100
                                              },
                                              edge: {
                                                year: 1990
                                              }
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

        // forcing a delay to ensure events do not exist
        await delay(2);
        await wsClient2.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient.events).toEqual([]);
        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 1990,
                            node: {
                                name: "Edgar",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 1990,
                            node: {
                                name: "Poe",
                                reputation: 100,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("connect via nested create - connectOrCreate, onCreate subscription sends events one way: union type", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                    name: "Edgar",
                                    movies: {
                                      create: [
                                        {
                                          edge: {
                                            screenTime: 1234
                                          },
                                          node: {
                                            title: "The Raven",
                                            imdbId: 11,
                                            directors: {
                                              ${typeActor.name}: {
                                                create: [
                                                  {
                                                    edge: {
                                                      year: 1980
                                                    },
                                                    node: {
                                                      name: "Allen",
                                                      movies: {
                                                        connectOrCreate: [
                                                          {
                                                            where: {
                                                              node: {
                                                                imdbId: 21
                                                              }
                                                            },
                                                            onCreate: {
                                                              edge: {
                                                                screenTime: 420
                                                              },
                                                              node: {
                                                                title: "The House of Usher"
                                                                imdbId: 21
                                                              }
                                                            }
                                                          }
                                                        ]
                                                      }
                                                    }
                                                  }
                                                ]
                                              },
                                              ${typePerson.name}: {
                                                connectOrCreate: [
                                                  {
                                                    where: {
                                                      node: {
                                                        id: 1
                                                      }
                                                    },
                                                    onCreate: {
                                                      edge: {
                                                        year: 1678
                                                      },
                                                      node: {
                                                        name: "Poe",
                                                        reputation: 100
                                                      }
                                                    }
                                                  }
                                                ]
                                              }
                                            }
                                          }
                                        }
                                      ]
                                    }
                                }
                            ]
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(2);
        await wsClient2.waitForEvents(4);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient2.events).toHaveLength(4);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Edgar" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 1234,
                            node: {
                                title: "The Raven",
                            },
                        },
                    },
                },
            },
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Allen" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 420,
                            node: {
                                title: "The House of Usher",
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Raven" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 1234,
                            node: {
                                name: "Edgar",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The House of Usher" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 420,
                            node: {
                                name: "Allen",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Raven" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 1980,
                            node: {
                                name: "Allen",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Raven" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 1678,
                            node: {
                                name: "Poe",
                                reputation: 100,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("connect via update - top-level connectOrCreate, onCreate subscription sends events one way: union type", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: "The Raven",
                                imdbId: 11
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
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        // 3. perform update on created node
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.update}(
                            where: {
                                title: "The Raven"
                            },
                            connectOrCreate: {
                                actors: [
                                    {
                                        where: {
                                            node: {
                                                id: 111
                                            }
                                        },
                                        onCreate: {
                                            node: {
                                                name: "Lenore"
                                            },
                                            edge: {
                                                screenTime: 100
                                            }
                                        }
                                    }
                                ],
                                directors: {
                                    ${typeActor.name}: [{
                                        where: {
                                            node: {
                                                id: 112
                                            }
                                        },
                                        onCreate: {
                                            node: {
                                                name: "Nevermore"
                                            },
                                            edge: {
                                                year: 1845
                                            }
                                        }
                                    }],
                                    ${typePerson.name}: [{
                                        where: {
                                            node: {
                                                id: 113
                                            }
                                        },
                                        onCreate: {
                                            node: {
                                                name: "Raven",
                                                reputation: 99
                                            },
                                            edge: {
                                                year: 1845
                                            }
                                        }
                                    }]
                                }
                            }
                        ) {
                            ${typeMovie.plural} {
                                title
                                actors {
                                  name
                                }
                                directors {
                                  ... on ${typePerson.name} {
                                    name
                                    reputation
                                  }
                                  ... on ${typeActor.name} {
                                    name
                                    movies {
                                      title
                                    }
                                  }
                                }
                                
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Lenore" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 100,
                            node: {
                                title: "The Raven",
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Raven" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 100,
                            node: {
                                name: "Lenore",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Raven" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 1845,
                            node: {
                                name: "Nevermore",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Raven" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 1845,
                            node: {
                                name: "Raven",
                                reputation: 99,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("connect via nested update - connectOrCreate, onCreate subscription sends events one way: union type", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                    name: "Edgar",
                                    movies: {
                                      create: [
                                        {
                                          edge: {
                                            screenTime: 1234
                                          },
                                          node: {
                                            title: "The Raven",
                                            imdbId: 11,
                                            directors: {
                                              ${typeActor.name}: {
                                                create: [
                                                  {
                                                    edge: {
                                                      year: 1980
                                                    },
                                                    node: {
                                                      name: "Allen",
                                                      id: 1234,
                                                      movies: {
                                                        connectOrCreate: [
                                                          {
                                                            where: {
                                                              node: {
                                                                imdbId: 21
                                                              }
                                                            },
                                                            onCreate: {
                                                              edge: {
                                                                screenTime: 420
                                                              },
                                                              node: {
                                                                title: "The House of Usher"
                                                                imdbId: 21
                                                              }
                                                            }
                                                          }
                                                        ]
                                                      }
                                                    }
                                                  }
                                                ]
                                              },
                                              ${typePerson.name}: {
                                                connectOrCreate: [
                                                  {
                                                    where: {
                                                      node: {
                                                        id: 1
                                                      }
                                                    },
                                                    onCreate: {
                                                      edge: {
                                                        year: 1678
                                                      },
                                                      node: {
                                                        name: "Poe",
                                                        reputation: 100
                                                      }
                                                    }
                                                  }
                                                ]
                                              }
                                            }
                                          }
                                        }
                                      ]
                                    }
                                }
                            ]
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        // 2. subscribe both ways
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        // 3. perform update on created node
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.update}(
                            where: {
                                title: "The House of Usher"
                            },
                            update: {
                                directors: {
                                  ${typePerson.name}: [
                                    {
                                      connectOrCreate: [
                                        {
                                          onCreate: {
                                            edge: {
                                              year: 1950
                                            },
                                            node: {
                                              reputation: 110,
                                              name: "Edgar Allen Poe"
                                            }
                                          },
                                          where: {
                                            node: {
                                              id: 101
                                            }
                                          }
                                        }
                                      ]
                                    }
                                  ],
                                  ${typeActor.name}: [
                                    {
                                      connectOrCreate: [
                                        {
                                          where: {
                                            node: {
                                              id: 102
                                            }
                                          },
                                          onCreate: {
                                            edge: {
                                              year: 1951
                                            },
                                            node: {
                                              name: "Madeleine"
                                            }
                                          }
                                        }
                                      ]
                                    }
                                  ]
                                },
                                actors: {
                                    where: {
                                        node: {
                                          id:1234
                                        }
                                      },
                                      update: {
                                        edge: {
                                          screenTime: 1955
                                        },
                                        node: {
                                          name: "Allen Poe",
                                          movies: [
                                            {
                                              connectOrCreate: [
                                                {
                                                  where: {
                                                    node: {
                                                      imdbId: 15
                                                    }
                                                  },
                                                  onCreate: {
                                                    node: {
                                                      title: "The Fall"
                                                    },
                                                    edge: {
                                                      screenTime: 1254
                                                    }
                                                  }
                                                }
                                              ]
                                            }
                                          ]
                                        }
                                    }
                                }
                              }
                        ) {
                            ${typeMovie.plural} {
                                title
                                actors {
                                  name
                                }
                                directors {
                                  ... on ${typePerson.name} {
                                    name
                                    reputation
                                  }
                                  ... on ${typeActor.name} {
                                    name
                                    movies {
                                      title
                                    }
                                  }
                                }
                                
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Allen Poe" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 1254,
                            node: {
                                title: "The Fall",
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Fall" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 1254,
                            node: {
                                name: "Allen Poe",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The House of Usher" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 1950,
                            node: {
                                name: "Edgar Allen Poe",
                                reputation: 110,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The House of Usher" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 1951,
                            node: {
                                name: "Madeleine",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("connect via create - connectOrCreate, onConnect subscription sends events both ways", async () => {
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                title: "The Matrix",
                                imdbId: 1
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

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                    name: "Keanu Reeves",
                                    movies: {
                                      connectOrCreate: [
                                        {
                                          onCreate: {
                                            edge: {
                                              screenTime: 1200
                                            },
                                            node: {
                                              title: "The Matrix",
                                              imdbId: 1
                                            }
                                          },
                                          where: {
                                            node: {
                                              imdbId: 1
                                            }
                                          }
                                        }
                                      ]
                                    }
                                  }
                            ]
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Keanu Reeves" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 1200,
                            node: {
                                title: "The Matrix",
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
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
        ]);
    });

    test("connect via nested create - connectOrCreate, onConnect subscription sends events one way: union type", async () => {
        await supertest(server.path)
            .post("")
            .send({
                query: `
            mutation {
                ${typeMovie.operations.create}(
                    input: [
                        {
                            title: "The House of Usher",
                            imdbId: 21
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
        await supertest(server.path)
            .post("")
            .send({
                query: `
            mutation {
                ${typePerson.operations.create}(
                    input: [
                        {
                            name: "Poe",
                            reputation: 100
                        }
                    ]
                ) {
                    ${typePerson.plural} {
                        name
                    }
                }
            }
        `,
            })
            .expect(200);

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                    name: "Edgar",
                                    movies: {
                                      create: [
                                        {
                                          edge: {
                                            screenTime: 1234
                                          },
                                          node: {
                                            title: "The Raven",
                                            imdbId: 11,
                                            directors: {
                                              ${typeActor.name}: {
                                                create: [
                                                  {
                                                    edge: {
                                                      year: 1980
                                                    },
                                                    node: {
                                                      name: "Allen",
                                                      movies: {
                                                        connectOrCreate: [
                                                          {
                                                            where: {
                                                              node: {
                                                                imdbId: 21
                                                              }
                                                            },
                                                            onCreate: {
                                                                edge: {
                                                                screenTime: 420
                                                              },
                                                              node: {
                                                                title: "The House of Usher"
                                                                imdbId: 21
                                                              }
                                                            }
                                                          }
                                                        ]
                                                      }
                                                    }
                                                  }
                                                ]
                                              },
                                              ${typePerson.name}: {
                                                connectOrCreate: [
                                                  {
                                                    where: {
                                                      node: {
                                                        id: 1
                                                      }
                                                    },
                                                    onCreate: {
                                                      edge: {
                                                        year: 1678
                                                      },
                                                      node: {
                                                        name: "Poe",
                                                        reputation: 100
                                                      }
                                                    }
                                                  }
                                                ]
                                              }
                                            }
                                          }
                                        }
                                      ]
                                    }
                                }
                            ]
                        ) {
                            ${typeActor.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(2);
        await wsClient2.waitForEvents(4);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient2.events).toHaveLength(4);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Edgar" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 1234,
                            node: {
                                title: "The Raven",
                            },
                        },
                    },
                },
            },
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Allen" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 420,
                            node: {
                                title: "The House of Usher",
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Raven" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 1234,
                            node: {
                                name: "Edgar",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The House of Usher" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 420,
                            node: {
                                name: "Allen",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Raven" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 1980,
                            node: {
                                name: "Allen",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Raven" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 1678,
                            node: {
                                name: "Poe",
                                reputation: 100,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("connect via update - top-level connectOrCreate, onConnect subscription sends events one way: union type", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "The Raven",
                                    imdbId: 11
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
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        // 3. perform update on created node
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.update}(
                            where: {
                                title: "The Raven"
                            },
                            connectOrCreate: {
                                actors: [
                                    {
                                        where: {
                                            node: {
                                                id: 111
                                            }
                                        },
                                        onCreate: {
                                            node: {
                                                name: "Lenore"
                                            },
                                            edge: {
                                                screenTime: 100
                                            }
                                        }
                                    }
                                ],
                                directors: {
                                    ${typeActor.name}: [{
                                        where: {
                                            node: {
                                                id: 112
                                            }
                                        },
                                        onCreate: {
                                            node: {
                                                name: "Nevermore"
                                            },
                                            edge: {
                                                year: 1845
                                            }
                                        }
                                    }],
                                    ${typePerson.name}: [{
                                        where: {
                                            node: {
                                                id: 113
                                            }
                                        },
                                        onCreate: {
                                            node: {
                                                name: "Raven",
                                                reputation: 99
                                            },
                                            edge: {
                                                year: 1845
                                            }
                                        }
                                    }]
                                }
                            }
                        ) {
                            ${typeMovie.plural} {
                                title
                                actors {
                                  name
                                }
                                directors {
                                  ... on ${typePerson.name} {
                                    name
                                    reputation
                                  }
                                  ... on ${typeActor.name} {
                                    name
                                    movies {
                                      title
                                    }
                                  }
                                }
                                
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_created]: {
                    [typeActor.operations.subscribe.payload.relationship_created]: { name: "Lenore" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "movies",
                    createdRelationship: {
                        movies: {
                            screenTime: 100,
                            node: {
                                title: "The Raven",
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Raven" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 100,
                            node: {
                                name: "Lenore",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Raven" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 1845,
                            node: {
                                name: "Nevermore",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "The Raven" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 1845,
                            node: {
                                name: "Raven",
                                reputation: 99,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });
});
