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

import type { Driver, Session } from "neo4j-driver";
import supertest from "supertest";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import type { TestGraphQLServer } from "../setup/apollo-server";
import { ApolloTestServer } from "../setup/apollo-server";
import { TestSubscriptionsPlugin } from "../../utils/TestSubscriptionPlugin";
import { WebSocketTestClient } from "../setup/ws-client";
import Neo4j from "../setup/neo4j";
import { cleanNodes } from "../../utils/clean-nodes";
import { delay } from "../../../src/utils/utils";

describe("Delete Relationship Subscription", () => {
    let neo4j: Neo4j;
    let session: Session;
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
        typeActor = new UniqueType("Actor");
        typeMovie = new UniqueType("Movie");
        typePerson = new UniqueType("Person");
        typeInfluencer = new UniqueType("Influencer");

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
            
            interface ActedIn @relationshipProperties {
                screenTime: Int!
            }
            
            interface Directed @relationshipProperties {
                year: Int!
            }
            
            interface Review @relationshipProperties {
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

        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        session = driver.session();

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            config: {
                driverConfig: {
                    database: neo4j.getIntegrationDatabaseName(),
                },
            },
            features: {
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

        await cleanNodes(session, [typeActor, typeMovie, typePerson, typeInfluencer]);

        await server.close();
        await session.close();
        await driver.close();
    });

    const actorSubscriptionQuery = (typeActor) => `
    subscription SubscriptionActor {
        ${typeActor.operations.subscribe.relationship_deleted} {
            relationshipFieldName
            event
            ${typeActor.operations.subscribe.payload.relationship_deleted} {
                name
            }
            deletedRelationship {
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
    ${typeMovie.operations.subscribe.relationship_deleted} {
        relationshipFieldName
        event
        ${typeMovie.operations.subscribe.payload.relationship_deleted} {
            title
        }
        deletedRelationship {
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
    ${typePerson.operations.subscribe.relationship_deleted} {
        relationshipFieldName
        event
        ${typePerson.operations.subscribe.payload.relationship_deleted} {
            name
        }
        deletedRelationship {
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

    test("disconnect via update - disconnect subscription sends events both ways", async () => {
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
                                disconnect: {
                                    actors:  [
                                        {
                                          where: {
                                                node: {
                                                    name: "Keanu Reeves"
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

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 42,
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
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Keanu Reeves",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            screenTime: 42,
                            node: {
                                title: "John Wick",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("disconnect via update - disconnect subscription sends events one way: union type", async () => {
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
                                                    year: 2019
                                                }
                                            }
                                        ]
                                    },
                                    ${typePerson.name}: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Jim",
                                                    reputation: 10
                                                },
                                                edge: {
                                                    year: 2020
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
                                disconnect: {
                                    directors: {
                                        ${typeActor.name}: [
                                          {
                                            where: {
                                              node: {
                                                name: "Keanu Reeves"
                                              }
                                            }
                                          }
                                        ],
                                        ${typePerson.name}: [
                                          {
                                            where: {
                                              edge: {
                                                year: 2020
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
        await delay(4);
        await wsClient2.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient.events).toHaveLength(0);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2019,
                            node: {
                                name: "Keanu Reeves",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2020,
                            node: {
                                name: "Jim",
                                reputation: 10,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("disconnect via update - disconnect subscription sends events one way: interface type, by common field", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                reviewers: {
                                create: [
                                    {
                                    node: {
                                        ${typePerson.name}: {
                                            name: "Ana",
                                            reputation: 10
                                        },
                                        ${typeInfluencer.name}: {
                                            url: "/bob",
                                            reputation: 10
                                        }
                                    },
                                    edge: {
                                        score: 100
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
                                disconnect: {
                                    reviewers:  [
                                        {
                                          where: {
                                                node: {
                                                    reputation: 10
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

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 100,
                            node: {
                                name: "Ana",
                                reputation: 10,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 100,
                            node: {
                                url: "/bob",
                                reputation: 10,
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 100,
                            node: {
                                title: "John Wick",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("disconnect via update - disconnect subscription sends events one way: interface type, by specific fields", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                reviewers: {
                                create: [
                                    {
                                    node: {
                                        ${typePerson.name}: {
                                            name: "Ana",
                                            reputation: 100
                                        },
                                        ${typeInfluencer.name}: {
                                            url: "/bob",
                                            reputation: 1
                                        }
                                    },
                                    edge: {
                                        score: 10
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
                                disconnect: {
                                    reviewers:  [
                                        {
                                          where: {
                                                node: {
                                                    _on: {
                                                        ${typePerson}: {
                                                            name: "Ana"
                                                        },
                                                        ${typeInfluencer}: {
                                                            reputation: 1
                                                        }
                                                    }
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

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(2);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
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
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                url: "/bob",
                                reputation: 1,
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 10,
                            node: {
                                title: "John Wick",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("disconnect via update - nested disconnect subscription sends events one way: interface type, by common field", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                reviewers: {
                                create: [
                                        {
                                        node: {
                                            ${typePerson.name}: {
                                                name: "Ana",
                                                reputation: 10
                                            },
                                            ${typeInfluencer.name}: {
                                                url: "/bob",
                                                reputation: 10
                                            }
                                        },
                                        edge: {
                                            score: 100
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
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                reviewers: {
                                    connect: [
                                        {
                                            where: {
                                                node: {
                                                    reputation: 10
                                                }
                                            },
                                            edge: {
                                                score: 42
                                            }
                                        }
                                    ]
                                },
                                title: "Constantine",
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
                                disconnect: {
                                    reviewers:  [
                                        {
                                          where: {
                                                node: {
                                                    reputation: 10
                                                }
                                            },
                                            disconnect: {
                                                _on: {
                                                    ${typePerson}: [
                                                        {
                                                            movies: [
                                                                {
                                                                    where: {
                                                                        node: {
                                                                            title: "Constantine"
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
        await wsClient2.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toHaveLength(2);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 100,
                            node: {
                                name: "Ana",
                                reputation: 10,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Ana",
                                reputation: 10,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 100,
                            node: {
                                url: "/bob",
                                reputation: 10,
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 100,
                            node: {
                                title: "John Wick",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 42,
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("disconnect via update - nested disconnect subscription sends events one way: interface type, by specific field", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                reviewers: {
                                create: [
                                        {
                                        node: {
                                            ${typePerson.name}: {
                                                name: "Ana",
                                                reputation: 100
                                            },
                                            ${typeInfluencer.name}: {
                                                url: "/bob",
                                                reputation: 100
                                            }
                                        },
                                        edge: {
                                            score: 10
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
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                reviewers: {
                                    connect: [
                                        {
                                            where: {
                                                node: {
                                                    _on: {
                                                        ${typePerson.name}: {
                                                            name: "Ana"
                                                        },
                                                        ${typeInfluencer.name}: {
                                                            url: "/bob"
                                                        }
                                                    }
                                                }
                                            },
                                            edge: {
                                                score: 42
                                            }
                                        }
                                    ]
                                },
                                title: "Constantine",
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
                                disconnect: {
                                    reviewers:  [
                                        {
                                          where: {
                                                node: {
                                                    reputation: 100
                                                }
                                            },
                                            disconnect: {
                                                _on: {
                                                    ${typePerson}: [
                                                        {
                                                            movies: [
                                                                {
                                                                    where: {
                                                                        edge: {
                                                                            score: 42
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
        await wsClient2.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toHaveLength(2);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Ana",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
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
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                url: "/bob",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 42,
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 10,
                            node: {
                                title: "John Wick",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("disconnect via nested update - disconnect subscription sends events one way: union type", async () => {
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
                                            name: "Keanu"
                                        },
                                        edge: {
                                            screenTime: 42
                                        }
                                        }
                                    ]
                                },
                                directors: {
                                    ${typeActor.name}: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Jill"
                                                },
                                                edge: {
                                                    year: 2020
                                                }
                                            }
                                        ]
                                    },
                                    ${typePerson.name}: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Jim",
                                                    reputation: 10
                                                },
                                                edge: {
                                                    year: 2020
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
                                    title: "John WICK",
                                    directors: {
                                      ${typeActor.name}: [
                                        {
                                          disconnect: [
                                            {
                                              where: {
                                                edge: {
                                                  year: 2020
                                                }
                                              }
                                            }
                                          ]
                                        }
                                      ],
                                      ${typePerson.name}: [
                                        {
                                          disconnect: [
                                            {
                                              where: {
                                                node: {
                                                  name: "Jim"
                                                }
                                              }
                                            }
                                          ]
                                        }
                                      ]
                                    },
                                    actors: [
                                      {
                                        disconnect: [
                                          {
                                            where: {
                                              node: {
                                                name: "Keanu"
                                              }
                                            }
                                          }
                                        ]
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

        // forcing a delay to ensure events do not exist
        await delay(3);
        await wsClient2.waitForEvents(3);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toHaveLength(0);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John WICK" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2020,
                            node: {
                                name: "Jill",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John WICK" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2020,
                            node: {
                                name: "Jim",
                                reputation: 10,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John WICK" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 42,
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

    test("disconnect via nested update - disconnect subscription sends events one way: interface type", async () => {
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
                                            name: "Keanu"
                                        },
                                        edge: {
                                            screenTime: 42
                                        }
                                        }
                                    ]
                                },
                                reviewers: {
                                    create: [
                                            {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Ana",
                                                    reputation: 10
                                                },
                                                ${typeInfluencer.name}: {
                                                    url: "/bob",
                                                    reputation: 10
                                                }
                                            },
                                            edge: {
                                                score: 100
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
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                reviewers: {
                                    connect: [
                                        {
                                            where: {
                                                node: {
                                                    _on: {
                                                        ${typePerson.name}: {
                                                            name: "Ana"
                                                        },
                                                        ${typeInfluencer.name}: {
                                                            url: "/bob"
                                                        }
                                                    }
                                                }
                                            },
                                            edge: {
                                                score: 42
                                            }
                                        }
                                    ]
                                },
                                title: "Constantine",
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
                                    title: "John WICK",
                                    reviewers: [
                                        {
                                          update: {
                                            node: {
                                              _on: {
                                                ${typePerson.name}: {
                                                  movies: [
                                                    {
                                                      disconnect: [
                                                        {
                                                          where: {
                                                            edge: {
                                                              score: 42
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
                                        }
                                      ],
                                    actors: [
                                      {
                                        disconnect: [
                                          {
                                            where: {
                                              node: {
                                                name: "Keanu"
                                              }
                                            }
                                          }
                                        ]
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

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(2);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Ana",
                                reputation: 10,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John WICK" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 42,
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

    test("disconnect via nested update - disconnect subscription sends events one way: interface to union type", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
            mutation {
                ${typeMovie.operations.create}(
                    input: [
                        {
                            reviewers: {
                                create: [
                                        {
                                        node: {
                                            ${typePerson.name}: {
                                                name: "Ana",
                                                reputation: 10
                                            },
                                            ${typeInfluencer.name}: {
                                                url: "/bob",
                                                reputation: 10
                                            }
                                        },
                                        edge: {
                                            score: 100
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
                ${typeMovie.operations.create}(
                    input: [
                        {
                            reviewers: {
                                connect: [
                                    {
                                        where: {
                                            node: {
                                                _on: {
                                                    ${typePerson.name}: {
                                                        name: "Ana"
                                                    },
                                                    ${typeInfluencer.name}: {
                                                        url: "/bob"
                                                    }
                                                }
                                            }
                                        },
                                        edge: {
                                            score: 42
                                        }
                                    }
                                ]
                            },
                            directors: {
                                ${typeActor.name}: {
                                    create: [
                                        {
                                            node: {
                                                name: "Jill"
                                            },
                                            edge: {
                                                year: 2018
                                            }
                                        }
                                    ]
                                },
                                ${typePerson.name}: {
                                    create: [
                                        {
                                            node: {
                                                name: "Jim",
                                                reputation: 10
                                            },
                                            edge: {
                                                year: 2019
                                            }
                                        }
                                    ]
                                }
                            },
                            title: "Constantine",
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
                                    title: "John WICK",
                                    reviewers: [
                                        {
                                          update: {
                                            node: {
                                              _on: {
                                                ${typePerson.name}: {
                                                  movies: [
                                                    {
                                                      disconnect: [
                                                        {
                                                          where: {
                                                            node: {
                                                              title: "Constantine"
                                                            }
                                                          },
                                                          disconnect: {
                                                            directors: {
                                                              ${typePerson.name}: [
                                                                {
                                                                  where: {
                                                                    edge: {
                                                                      year: 2019
                                                                    }
                                                                  }
                                                                }
                                                              ],
                                                              ${typeActor.name}: [
                                                                {
                                                                  where: {
                                                                    node: {
                                                                      name: "Jill"
                                                                    }
                                                                  }
                                                                }
                                                              ]
                                                            }
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                },
                                                ${typeInfluencer.name}: {
                                                  url: "/bob"
                                                }
                                              }
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

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(3);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Ana",
                                reputation: 10,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2018,
                            node: {
                                name: "Jill",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2019,
                            node: {
                                name: "Jim",
                                reputation: 10,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 42,
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("disconnect via nested update - disconnect subscription sends events one way: interface to union type - duplicate union nodes", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
            mutation {
                ${typeMovie.operations.create}(
                    input: [
                        {
                            reviewers: {
                                create: [
                                        {
                                        node: {
                                            ${typePerson.name}: {
                                                name: "Ana",
                                                reputation: 10
                                            },
                                            ${typeInfluencer.name}: {
                                                url: "/bob",
                                                reputation: 10
                                            }
                                        },
                                        edge: {
                                            score: 100
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
                ${typeMovie.operations.create}(
                    input: [
                        {
                            reviewers: {
                                connect: [
                                    {
                                        where: {
                                            node: {
                                                _on: {
                                                    ${typePerson.name}: {
                                                        name: "Ana"
                                                    },
                                                    ${typeInfluencer.name}: {
                                                        url: "/bob"
                                                    }
                                                }
                                            }
                                        },
                                        edge: {
                                            score: 42
                                        }
                                    }
                                ]
                            },
                            directors: {
                                ${typeActor.name}: {
                                    create: [
                                        {
                                            node: {
                                                name: "Jill"
                                            },
                                            edge: {
                                                year: 2018
                                            }
                                        },
                                        {
                                            node: {
                                                name: "Jill"
                                            },
                                            edge: {
                                                year: 2018
                                            }
                                        }
                                    ]
                                },
                                ${typePerson.name}: {
                                    create: [
                                        {
                                            node: {
                                                name: "Jim",
                                                reputation: 10
                                            },
                                            edge: {
                                                year: 2019
                                            }
                                        }
                                    ]
                                }
                            },
                            title: "Constantine",
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
                                    title: "John WICK",
                                    reviewers: [
                                        {
                                          update: {
                                            node: {
                                              _on: {
                                                ${typePerson.name}: {
                                                  movies: [
                                                    {
                                                      disconnect: [
                                                        {
                                                          where: {
                                                            node: {
                                                              title: "Constantine"
                                                            }
                                                          },
                                                          disconnect: {
                                                            directors: {
                                                              ${typePerson.name}: [
                                                                {
                                                                  where: {
                                                                    edge: {
                                                                      year: 2019
                                                                    }
                                                                  }
                                                                }
                                                              ],
                                                              ${typeActor.name}: [
                                                                {
                                                                  where: {
                                                                    node: {
                                                                      name: "Jill"
                                                                    }
                                                                  }
                                                                }
                                                              ]
                                                            }
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                },
                                                ${typeInfluencer.name}: {
                                                  url: "/bob"
                                                }
                                              }
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

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(4);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(4);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Ana",
                                reputation: 10,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2018,
                            node: {
                                name: "Jill",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2018,
                            node: {
                                name: "Jill",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2019,
                            node: {
                                name: "Jim",
                                reputation: 10,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 42,
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("disconnect via nested update - disconnect subscription sends events one way: interface to union type - duplicate interface nodes", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
            mutation {
                ${typeMovie.operations.create}(
                    input: [
                        {
                            reviewers: {
                                create: [
                                        {
                                        node: {
                                            ${typePerson.name}: {
                                                name: "Ana",
                                                reputation: 10
                                            },
                                            ${typeInfluencer.name}: {
                                                url: "/bob",
                                                reputation: 10
                                            }
                                        },
                                        edge: {
                                            score: 100
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
        // duplicate node
        await supertest(server.path)
            .post("")
            .send({
                query: `
            mutation {
                ${typePerson.operations.create}(
                    input: [
                        {
                            name: "Ana",
                            reputation: 10,
                            movies: {
                                connect: [
                                    {
                                        where: {
                                            node: {
                                                title: "John Wick"
                                            }
                                        },
                                        edge: {
                                            score: 110
                                        }
                                    }
                                ]
                            }
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
        await supertest(server.path)
            .post("")
            .send({
                query: `
            mutation {
                ${typeMovie.operations.create}(
                    input: [
                        {
                            reviewers: {
                                connect: [
                                    {
                                        where: {
                                            node: {
                                                _on: {
                                                    ${typePerson.name}: {
                                                        name: "Ana"
                                                    },
                                                    ${typeInfluencer.name}: {
                                                        url: "/bob"
                                                    }
                                                }
                                            }
                                        },
                                        edge: {
                                            score: 42
                                        }
                                    }
                                ]
                            },
                            directors: {
                                ${typeActor.name}: {
                                    create: [
                                        {
                                            node: {
                                                name: "Jill"
                                            },
                                            edge: {
                                                year: 2018
                                            }
                                        }
                                    ]
                                },
                                ${typePerson.name}: {
                                    create: [
                                        {
                                            node: {
                                                name: "Jim",
                                                reputation: 10
                                            },
                                            edge: {
                                                year: 2019
                                            }
                                        }
                                    ]
                                }
                            },
                            title: "Constantine",
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
                                    title: "John WICK",
                                    reviewers: [
                                        {
                                          update: {
                                            node: {
                                              _on: {
                                                ${typePerson.name}: {
                                                  movies: [
                                                    {
                                                      disconnect: [
                                                        {
                                                          where: {
                                                            node: {
                                                              title: "Constantine"
                                                            }
                                                          },
                                                          disconnect: {
                                                            directors: {
                                                              ${typePerson.name}: [
                                                                {
                                                                  where: {
                                                                    edge: {
                                                                      year: 2019
                                                                    }
                                                                  }
                                                                }
                                                              ],
                                                              ${typeActor.name}: [
                                                                {
                                                                  where: {
                                                                    node: {
                                                                      name: "Jill"
                                                                    }
                                                                  }
                                                                }
                                                              ]
                                                            }
                                                          }
                                                        }
                                                      ]
                                                    }
                                                  ]
                                                },
                                                ${typeInfluencer.name}: {
                                                  url: "/bob"
                                                }
                                              }
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
        await wsClient2.waitForEvents(4);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(4);
        expect(wsClient.events).toHaveLength(2);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Ana",
                                reputation: 10,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Ana",
                                reputation: 10,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2018,
                            node: {
                                name: "Jill",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2019,
                            node: {
                                name: "Jim",
                                reputation: 10,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 42,
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 42,
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("disconnect via nested update - disconnect subscription sends events one way: union to interface type", async () => {
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
                                            name: "Jim",
                                        },
                                        edge: {
                                            screenTime: 234
                                        }
                                        }
                                    ]
                                },
                                reviewers: {
                                    create: [
                                            {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Ana",
                                                    reputation: 100
                                                },
                                                ${typeInfluencer.name}: {
                                                    url: "/bob",
                                                    reputation: 100
                                                }
                                            },
                                            edge: {
                                                score: 10
                                            }
                                        }
                                    ]
                                },
                                title: "Constantine",
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
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                directors: {
                                    ${typeActor.name}: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Jim",
                                                    movies: {
                                                        connect: {
                                                          where: {
                                                            node: {
                                                              title: "Constantine"
                                                            }
                                                          },
                                                          edge: {
                                                            screenTime: 234
                                                          }
                                                        }
                                                      }
                                                },
                                                edge: {
                                                    year: 2020
                                                }
                                            }
                                        ]
                                    },
                                    ${typePerson.name}: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Jill",
                                                    reputation: 10
                                                },
                                                edge: {
                                                    year: 2020
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
                                    title: "John WICK",
                                    directors: {
                                        ${typeActor.name}: [
                                          {
                                            update: {
                                              node: {
                                                movies: [
                                                  {
                                                    disconnect: [
                                                      {
                                                        where: {
                                                          edge: {
                                                            screenTime: 234
                                                          }
                                                        },
                                                        disconnect: {
                                                          reviewers: [
                                                            {
                                                              where: {
                                                                node: {
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

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(3);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
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
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                url: "/bob",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 234,
                            node: {
                                name: "Jim",
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
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 10,
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
        ]);
    });
    test("disconnect via nested update - disconnect subscription sends events one way: union to interface type - duplicate nodes in outer match", async () => {
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
                                            name: "Jim",
                                        },
                                        edge: {
                                            screenTime: 234
                                        }
                                        },
                                        {
                                            node: {
                                                name: "Jim",
                                            },
                                            edge: {
                                                screenTime: 234
                                            }
                                            }
                                    ]
                                },
                                reviewers: {
                                    create: [
                                            {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Ana",
                                                    reputation: 100
                                                },
                                                ${typeInfluencer.name}: {
                                                    url: "/bob",
                                                    reputation: 100
                                                }
                                            },
                                            edge: {
                                                score: 10
                                            }
                                        }
                                    ]
                                },
                                title: "Constantine",
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
                    ${typeMovie.operations.create}(
                        input: [
                            {
                                directors: {
                                    ${typeActor.name}: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Jim",
                                                    movies: {
                                                        connect: {
                                                          where: {
                                                            node: {
                                                              title: "Constantine"
                                                            }
                                                          },
                                                          edge: {
                                                            screenTime: 234
                                                          }
                                                        }
                                                      }
                                                },
                                                edge: {
                                                    year: 2020
                                                }
                                            },
                                            {
                                                node: {
                                                    name: "Jim",
                                                    movies: {
                                                        connect: {
                                                          where: {
                                                            node: {
                                                              title: "Constantine"
                                                            }
                                                          },
                                                          edge: {
                                                            screenTime: 234
                                                          }
                                                        }
                                                      }
                                                },
                                                edge: {
                                                    year: 2020
                                                }
                                            }
                                        ]
                                    },
                                    ${typePerson.name}: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Jill",
                                                    reputation: 10
                                                },
                                                edge: {
                                                    year: 2020
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
                                    title: "John WICK",
                                    directors: {
                                        ${typeActor.name}: [
                                          {
                                            update: {
                                              node: {
                                                movies: [
                                                  {
                                                    disconnect: [
                                                      {
                                                        where: {
                                                          edge: {
                                                            screenTime: 234
                                                          }
                                                        },
                                                        disconnect: {
                                                          reviewers: [
                                                            {
                                                              where: {
                                                                node: {
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

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(4);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(4);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
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
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                url: "/bob",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 234,
                            node: {
                                name: "Jim",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 234,
                            node: {
                                name: "Jim",
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
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 10,
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
        ]);
    });
    test("disconnect via nested update - disconnect subscription sends events one way: union to interface type - duplicate nodes in inner match", async () => {
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
                                            name: "Jim",
                                        },
                                        edge: {
                                            screenTime: 234
                                        }
                                        },
                                    ]
                                },
                                reviewers: {
                                    create: [
                                            {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Ana",
                                                    reputation: 100
                                                },
                                                ${typeInfluencer.name}: {
                                                    url: "/bob",
                                                    reputation: 100
                                                }
                                            },
                                            edge: {
                                                score: 10
                                            }
                                        }
                                    ]
                                },
                                title: "Constantine",
                            },
                            {
                                title: "Other Movie",
                                actors: {
                                    create: [
                                        {
                                        node: {
                                            name: "Jim",
                                        },
                                        edge: {
                                            screenTime: 234
                                        }
                                        },
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
                                        connect: [
                                            {
                                               where: {
                                                    node: {
                                                        name: "Jim"
                                                    }
                                               },
                                                connect: [
                                                    {
                                                        movies: [
                                                            {
                                                                where: {
                                                                    node: {
                                                                      title: "Other Movie"
                                                                    }
                                                                  },
                                                                  edge: {
                                                                    screenTime: 234
                                                                  }
                                                            }
                                                        ]
                                                    }
                                                ],
                                                edge: {
                                                    year: 1999
                                                }
                                            }
                                        ],
                                        create: [
                                            {
                                                node: {
                                                    name: "Jim",
                                                    movies: {
                                                        connect: {
                                                          where: {
                                                            node: {
                                                              title: "Constantine"
                                                            }
                                                          },
                                                          edge: {
                                                            screenTime: 23
                                                          }
                                                        }
                                                      }
                                                },
                                                edge: {
                                                    year: 2020
                                                }
                                            }
                                        ]
                                    },
                                    ${typePerson.name}: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Jill",
                                                    reputation: 10
                                                },
                                                edge: {
                                                    year: 2020
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
                                    title: "John WICK",
                                    directors: {
                                        ${typeActor.name}: [
                                          {
                                            update: {
                                              node: {
                                                movies: [
                                                  {
                                                    disconnect: [
                                                      {
                                                        where: {
                                                          edge: {
                                                            screenTime: 234
                                                          }
                                                        },
                                                        disconnect: {
                                                          reviewers: [
                                                            {
                                                              where: {
                                                                node: {
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

        await wsClient.waitForEvents(1);
        await wsClient2.waitForEvents(6);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(6);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
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
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                url: "/bob",
                                reputation: 100,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 234,
                            node: {
                                name: "Jim",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Other Movie" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 234,
                            node: {
                                name: "Jim",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Other Movie" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 234,
                            node: {
                                name: "Jim",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Other Movie" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 234,
                            node: {
                                name: "Jim",
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
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Ana",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 10,
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
        ]);
    });
});
