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
import { UniqueType } from "../../utils/graphql-types";
import type { TestGraphQLServer } from "../setup/apollo-server";
import { ApolloTestServer } from "../setup/apollo-server";
import { TestSubscriptionsEngine } from "../../utils/TestSubscriptionsEngine";
import { WebSocketTestClient } from "../setup/ws-client";
import Neo4j from "../setup/neo4j";
import { cleanNodes } from "../../utils/clean-nodes";
import { delay } from "../../../src/utils/utils";

describe("Delete Subscriptions when relationships are targeted- with interfaces, unions and nested operations", () => {
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
            
            interface Review @relationshipProperties {
                score: Int!
            }
        
            type ${typePerson} implements Reviewer {
                name: String!
                reputation: Int!
                movies: [${typeMovie}!]! @relationship(type: "REVIEWED", direction: OUT, properties: "Review")
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
            features: {
                subscriptions: new TestSubscriptionsEngine(),
            },
        });
        // eslint-disable-next-line @typescript-eslint/require-await
        server = new ApolloTestServer(neoSchema, async ({ req }) => ({
            sessionConfig: {
                database: neo4j.getIntegrationDatabaseName(),
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

        const session = driver.session();
        await cleanNodes(session, [typeActor, typeMovie, typePerson, typeInfluencer]);

        await server.close();
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

    test("disconnect via delete - with relationships - standard type", async () => {
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
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
                            nodesDeleted
                            relationshipsDeleted
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

    test("disconnect via delete nested - with relationships - standard type", async () => {
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
                                        name: "Keanu Reeves",
                                        movies: {
                                            create: [
                                                {
                                                    node: {
                                                        title: "Matrix"
                                                    },
                                                    edge: {
                                                        screenTime: 1000
                                                    }
                                                }
                                            ]
                                        }
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    actors:  [
                                        {
                                          where: {
                                                node: {
                                                    name: "Keanu Reeves"
                                                }
                                            },
                                            delete: {
                                                movies:  [
                                                    {
                                                      where: {
                                                            node: {
                                                                title: "Matrix"
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                        ) {
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(2);
        await wsClient2.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient.events).toHaveLength(2);

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
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 1000,
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
            {
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Keanu Reeves",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
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
    });

    test("disconnect via delete - with relationships - union type", async () => {
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
                                            },
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
                                            },
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
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
                                            node: {
                                              reputation: 10
                                            }
                                          }
                                        }
                                      ]
                                    }
                                  }
                        ) {
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                `,
            })
            .expect(200);

        // forcing a delay to ensure events do not exist
        await delay(4);
        await wsClient2.waitForEvents(4);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(4);
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
                                name: "Jill",
                                reputation: 10,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("disconnect via delete nested - with relationships - union type", async () => {
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
                                                    name: "Keanu Reeves",
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix"
                                                                },
                                                                edge: {
                                                                    screenTime: 1000
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2019
                                                }
                                            },
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
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix2"
                                                                },
                                                                edge: {
                                                                    score: 42
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2020
                                                }
                                            },
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    directors: {
                                      ${typeActor.name}: [
                                        {
                                          where: {
                                            node: {
                                              name: "Keanu Reeves"
                                            }
                                          },
                                          delete: {
                                            movies: [
                                                {
                                                    where: {
                                                        node: {
                                                            title_STARTS_WITH: "Matrix"
                                                        }
                                                    }
                                                }
                                            ]
                                          }
                                        }
                                      ],
                                      ${typePerson.name}: [
                                        {
                                          where: {
                                            node: {
                                              reputation: 10
                                            }
                                          },
                                          delete: {
                                            movies: [
                                                {
                                                    where: {
                                                        node: {
                                                            title_STARTS_WITH: "Matrix"
                                                        }
                                                    }
                                                }
                                            ]
                                          }
                                        }
                                      ]
                                    }
                                  }
                        ) {
                            nodesDeleted
                            relationshipsDeleted
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 1000,
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
                                name: "Jill",
                                reputation: 10,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Jim",
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
                        name: "Jim",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 42,
                            node: {
                                title: "Matrix2",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("disconnect via delete - with relationships - interface type, by common type", async () => {
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    reviewers: [
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
                            nodesDeleted
                            relationshipsDeleted
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

    test("disconnect via delete nested - with relationships - interface type, by common type", async () => {
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
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix2"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            },
                                                            {
                                                                node: {
                                                                    title: "Matrix3"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            }
                                                        ]
                                                    }
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    reviewers: [
                                        {
                                            where: {
                                                node: {
                                                    reputation: 10
                                                }
                                            },
                                            delete: {
                                                _on: {
                                                    ${typePerson.name}: [
                                                        {
                                                            movies: [
                                                                {
                                                                    where: {
                                                                        edge: {
                                                                            score: 420
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
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(3);
        await wsClient2.waitForEvents(4);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(4);
        expect(wsClient.events).toHaveLength(3);

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
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
                            node: {
                                name: "Ana",
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
                            score: 420,
                            node: {
                                title: "Matrix3",
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
                            score: 420,
                            node: {
                                title: "Matrix2",
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

    test("disconnect via delete - with relationships - interface type, by specific type", async () => {
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
                                            },
                                            {
                                                node: {
                                                    ${typePerson.name}: {
                                                        name: "Ana",
                                                        reputation: 10
                                                    }
                                                },
                                                edge: {
                                                    score: 42
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    reviewers: [
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
                                            }
                                        }
                                    ]
                                  }
                        ) {
                            nodesDeleted
                            relationshipsDeleted
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
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
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

    test("disconnect via delete nested - with relationships - interface type, by specific type", async () => {
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
                                                        reputation: 10,
                                                        movies: {
                                                            create: [
                                                                {
                                                                    node: {
                                                                        title: "Matrix2"
                                                                    },
                                                                    edge: {
                                                                        score: 420
                                                                    }
                                                                },
                                                                {
                                                                    node: {
                                                                        title: "Matrix3"
                                                                    },
                                                                    edge: {
                                                                        score: 420
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    ${typeInfluencer.name}: {
                                                        url: "/bob",
                                                        reputation: 10
                                                    }
                                                },
                                                edge: {
                                                    score: 100
                                                }
                                            },
                                            {
                                                node: {
                                                    ${typePerson.name}: {
                                                        name: "Ana",
                                                        reputation: 10,
                                                        movies: {
                                                            create: [
                                                                {
                                                                    node: {
                                                                        title: "Other Movie"
                                                                    },
                                                                    edge: {
                                                                        score: 420
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                },
                                                edge: {
                                                    score: 42
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    reviewers: [
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
                                            delete: {
                                                _on: {
                                                    ${typePerson.name}: [
                                                        {
                                                            movies: [
                                                                {
                                                                    where: {
                                                                        edge: {
                                                                            score: 420
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
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(5);
        await wsClient2.waitForEvents(6);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(6);
        expect(wsClient.events).toHaveLength(5);

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
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Other Movie" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
                            node: {
                                name: "Ana",
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
                            score: 420,
                            node: {
                                title: "Matrix3",
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
                            score: 420,
                            node: {
                                title: "Matrix2",
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
                            score: 420,
                            node: {
                                title: "Other Movie",
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

    test("disconnect via delete nested - with relationships - interface type - nothing matched", async () => {
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
                                                        reputation: 10,
                                                        movies: {
                                                            create: [
                                                                {
                                                                    node: {
                                                                        title: "Matrix2"
                                                                    },
                                                                    edge: {
                                                                        score: 420
                                                                    }
                                                                },
                                                                {
                                                                    node: {
                                                                        title: "Matrix3"
                                                                    },
                                                                    edge: {
                                                                        score: 420
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    ${typeInfluencer.name}: {
                                                        url: "/bob",
                                                        reputation: 10
                                                    }
                                                },
                                                edge: {
                                                    score: 100
                                                }
                                            },
                                            {
                                                node: {
                                                    ${typePerson.name}: {
                                                        name: "Ana",
                                                        reputation: 10,
                                                        movies: {
                                                            create: [
                                                                {
                                                                    node: {
                                                                        title: "Other Movie"
                                                                    },
                                                                    edge: {
                                                                        score: 420
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                },
                                                edge: {
                                                    score: 42
                                                }
                                        },
                                        {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Julie",
                                                    reputation: 20,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Other Movie"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            },
                                            edge: {
                                                score: 42
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    reviewers: [
                                        {
                                            where: {
                                                node: {
                                                    reputation: 10,
                                                    _on: {
                                                        ${typePerson.name}: {
                                                            name: "Julie"
                                                        },
                                                        ${typeInfluencer.name}: {
                                                            url: "/john"
                                                        }
                                                    }
                                                }
                                            },
                                            delete: {
                                                _on: {
                                                    ${typePerson.name}: [
                                                        {
                                                            movies: [
                                                                {
                                                                    where: {
                                                                        edge: {
                                                                            score: 420
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
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                `,
            })
            .expect(200);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(0);
        expect(wsClient.events).toHaveLength(0);
    });

    test("disconnect via delete nested - with relationships - interface type", async () => {
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
                                                        reputation: 10,
                                                        movies: {
                                                            create: [
                                                                {
                                                                    node: {
                                                                        title: "Matrix2"
                                                                    },
                                                                    edge: {
                                                                        score: 420
                                                                    }
                                                                },
                                                                {
                                                                    node: {
                                                                        title: "Matrix3"
                                                                    },
                                                                    edge: {
                                                                        score: 420
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    },
                                                    ${typeInfluencer.name}: {
                                                        url: "/bob",
                                                        reputation: 10
                                                    }
                                                },
                                                edge: {
                                                    score: 100
                                                }
                                            },
                                            {
                                                node: {
                                                    ${typePerson.name}: {
                                                        name: "Ana",
                                                        reputation: 10,
                                                        movies: {
                                                            create: [
                                                                {
                                                                    node: {
                                                                        title: "Other Movie"
                                                                    },
                                                                    edge: {
                                                                        score: 420
                                                                    }
                                                                }
                                                            ]
                                                        }
                                                    }
                                                },
                                                edge: {
                                                    score: 42
                                                }
                                        },
                                        {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Julie",
                                                    reputation: 20,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Other Movie"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            },
                                            edge: {
                                                score: 42
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    reviewers: [
                                        {
                                            where: {
                                                node: {
                                                    reputation: 10,
                                                    _on: {
                                                        ${typePerson.name}: {
                                                            name: "Ana"
                                                        },
                                                        ${typeInfluencer.name}: {
                                                            url: "/john"
                                                        }
                                                    }
                                                }
                                            },
                                            delete: {
                                                _on: {
                                                    ${typePerson.name}: [
                                                        {
                                                            movies: [
                                                                {
                                                                    where: {
                                                                        edge: {
                                                                            score: 420
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
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(5);
        await wsClient2.waitForEvents(5);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(5);
        expect(wsClient.events).toHaveLength(5);

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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Other Movie" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
                            node: {
                                name: "Ana",
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
                            score: 420,
                            node: {
                                title: "Matrix3",
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
                            score: 420,
                            node: {
                                title: "Matrix2",
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
                            score: 420,
                            node: {
                                title: "Other Movie",
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

    test("disconnect via delete nested - with relationships -  union type + interface type, by common type", async () => {
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
                                                    name: "Keanu Reeves",
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix"
                                                                },
                                                                edge: {
                                                                    screenTime: 1000
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2019
                                                }
                                            },
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
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix2"
                                                                },
                                                                edge: {
                                                                    score: 42
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2020
                                                }
                                            },
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
                                reviewers: {
                                    create: [
                                            {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Ana",
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix2"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            },
                                                            {
                                                                node: {
                                                                    title: "Matrix3"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                ${typeInfluencer.name}: {
                                                    url: "/bob",
                                                    reputation: 10
                                                }
                                            },
                                            edge: {
                                                score: 100
                                            }
                                        },
                                        {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Julia",
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Other Matrix"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            }
                                                        ]
                                                    }
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    directors: {
                                        ${typeActor.name}: [
                                          {
                                            where: {
                                              node: {
                                                name: "Keanu Reeves"
                                              }
                                            },
                                            delete: {
                                              movies: [
                                                  {
                                                      where: {
                                                          node: {
                                                              title_STARTS_WITH: "Matrix"
                                                          }
                                                      }
                                                  }
                                              ]
                                            }
                                          }
                                        ],
                                        ${typePerson.name}: [
                                          {
                                            where: {
                                              node: {
                                                reputation: 10
                                              }
                                            },
                                            delete: {
                                              movies: [
                                                  {
                                                      where: {
                                                          node: {
                                                              title_STARTS_WITH: "Matrix"
                                                          }
                                                      }
                                                  }
                                              ]
                                            }
                                          }
                                        ]
                                      },
                                    reviewers: [
                                        {
                                            where: {
                                                node: {
                                                    reputation: 10
                                                }
                                            },
                                            delete: {
                                                _on: {
                                                    ${typePerson.name}: [
                                                        {
                                                            movies: [
                                                                {
                                                                    where: {
                                                                        edge: {
                                                                            score: 420
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
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(6);
        await wsClient2.waitForEvents(12);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(12);
        expect(wsClient.events).toHaveLength(6);

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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 1000,
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
                                name: "Jill",
                                reputation: 10,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Jim",
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
                                name: "Julia",
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
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Other Matrix" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
                            node: {
                                name: "Julia",
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
                            score: 420,
                            node: {
                                title: "Matrix3",
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
                            score: 420,
                            node: {
                                title: "Matrix2",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Jim",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 42,
                            node: {
                                title: "Matrix2",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Julia",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 420,
                            node: {
                                title: "Other Matrix",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Julia",
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

    test("disconnect via delete - with relationships - standard type + interface type, by common type", async () => {
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

        // 2. subscribe both ways
        await wsClient2.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson }));

        await wsClient.subscribe(personSubscriptionQuery(typePerson));

        // 3. perform update on created node
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    actors:  [
                                        {
                                          where: {
                                                node: {
                                                    name: "Keanu"
                                                }
                                            }
                                        }
                                    ],
                                    reviewers: [
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
                            nodesDeleted
                            relationshipsDeleted
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
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
    test("disconnect via delete nested - with relationships -  standard type + interface type, by specific type", async () => {
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
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix2"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            },
                                                            {
                                                                node: {
                                                                    title: "Matrix3"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            }
                                                        ]
                                                    }
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    actors:  [
                                        {
                                          where: {
                                                node: {
                                                    name: "Keanu"
                                                }
                                            }
                                        }
                                    ],
                                    reviewers: [
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
                                            delete: {
                                                _on: {
                                                    ${typePerson.name}: [
                                                        {
                                                            movies: [
                                                                {
                                                                    where: {
                                                                        edge: {
                                                                            score: 420
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
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(3);
        await wsClient2.waitForEvents(5);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(5);
        expect(wsClient.events).toHaveLength(3);

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
                                name: "Keanu",
                            },
                        },
                        directors: null,
                        reviewers: null,
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
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
                            node: {
                                name: "Ana",
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
                            score: 420,
                            node: {
                                title: "Matrix3",
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
                            score: 420,
                            node: {
                                title: "Matrix2",
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

    test("disconnect via delete nested - with relationships -  standard type + union type + interface type, by specific type", async () => {
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
                                                    name: "Keanu Reeves",
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix"
                                                                },
                                                                edge: {
                                                                    screenTime: 1000
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2019
                                                }
                                            },
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
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix2"
                                                                },
                                                                edge: {
                                                                    score: 42
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2020
                                                }
                                            },
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
                                reviewers: {
                                    create: [
                                            {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Ana",
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix2"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            },
                                                            {
                                                                node: {
                                                                    title: "Matrix3"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            }
                                                        ]
                                                    }
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    actors:  [
                                        {
                                          where: {
                                                node: {
                                                    name: "Keanu"
                                                }
                                            }
                                        }
                                    ],
                                    directors: {
                                        ${typeActor.name}: [
                                          {
                                            where: {
                                              node: {
                                                name: "Keanu Reeves"
                                              }
                                            },
                                            delete: {
                                              movies: [
                                                  {
                                                      where: {
                                                          node: {
                                                              title_STARTS_WITH: "Matrix"
                                                          }
                                                      }
                                                  }
                                              ]
                                            }
                                          }
                                        ],
                                        ${typePerson.name}: [
                                          {
                                            where: {
                                              node: {
                                                reputation: 10
                                              }
                                            },
                                            delete: {
                                              movies: [
                                                  {
                                                      where: {
                                                          node: {
                                                              title_STARTS_WITH: "Matrix"
                                                          }
                                                      }
                                                  }
                                              ]
                                            }
                                          }
                                        ]
                                      },
                                    reviewers: [
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
                                            delete: {
                                                _on: {
                                                    ${typePerson.name}: [
                                                        {
                                                            movies: [
                                                                {
                                                                    where: {
                                                                        edge: {
                                                                            score: 420
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
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(4);
        await wsClient2.waitForEvents(11);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(11);
        expect(wsClient.events).toHaveLength(4);

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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 1000,
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
                                name: "Jill",
                                reputation: 10,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Jim",
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
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
                            node: {
                                name: "Ana",
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
                            score: 420,
                            node: {
                                title: "Matrix3",
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
                            score: 420,
                            node: {
                                title: "Matrix2",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Jim",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 42,
                            node: {
                                title: "Matrix2",
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
    test("disconnect via delete nested - with relationships -  standard type + union type + interface type, by common type", async () => {
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
                                directors: {
                                    ${typeActor.name}: {
                                        create: [
                                            {
                                                node: {
                                                    name: "Keanu Reeves",
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix"
                                                                },
                                                                edge: {
                                                                    screenTime: 1000
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2019
                                                }
                                            },
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
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix2"
                                                                },
                                                                edge: {
                                                                    score: 42
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2020
                                                }
                                            },
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
                                reviewers: {
                                    create: [
                                            {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Ana",
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Matrix2"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            },
                                                            {
                                                                node: {
                                                                    title: "Matrix3"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            }
                                                        ]
                                                    }
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    actors:  [
                                        {
                                          where: {
                                                node: {
                                                    name: "Keanu Reeves"
                                                }
                                            }
                                        }
                                    ],
                                    directors: {
                                        ${typeActor.name}: [
                                          {
                                            where: {
                                              node: {
                                                name: "Keanu Reeves"
                                              }
                                            },
                                            delete: {
                                              movies: [
                                                  {
                                                      where: {
                                                          node: {
                                                              title_STARTS_WITH: "Matrix"
                                                          }
                                                      }
                                                  }
                                              ]
                                            }
                                          }
                                        ],
                                        ${typePerson.name}: [
                                          {
                                            where: {
                                              node: {
                                                reputation: 10
                                              }
                                            },
                                            delete: {
                                              movies: [
                                                  {
                                                      where: {
                                                          node: {
                                                              title_STARTS_WITH: "Matrix"
                                                          }
                                                      }
                                                  }
                                              ]
                                            }
                                          }
                                        ]
                                      },
                                    reviewers: [
                                        {
                                            where: {
                                                node: {
                                                    reputation: 10
                                                }
                                            },
                                            delete: {
                                                _on: {
                                                    ${typePerson.name}: [
                                                        {
                                                            movies: [
                                                                {
                                                                    where: {
                                                                        edge: {
                                                                            score: 420
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
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(4);
        await wsClient2.waitForEvents(11);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(11);
        expect(wsClient.events).toHaveLength(4);

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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 1000,
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
                                name: "Jill",
                                reputation: 10,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Jim",
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
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
                            node: {
                                name: "Ana",
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
                            score: 420,
                            node: {
                                title: "Matrix3",
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
                            score: 420,
                            node: {
                                title: "Matrix2",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Jim",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 42,
                            node: {
                                title: "Matrix2",
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

    test("disconnect via delete nested - with relationships: union to interface type", async () => {
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
                                    },
                                    {
                                        node: {
                                            ${typePerson.name}: {
                                                name: "Julia",
                                                reputation: 10
                                            }
                                        },
                                        edge: {
                                            score: 100
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
                                                    name: "Keanu Reeves",
                                                    movies: {
                                                        connect: [
                                                            {
                                                                where: {
                                                                    node: {
                                                                        title: "Constantine"
                                                                    }
                                                                },
                                                                edge: {
                                                                    screenTime: 420
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2019
                                                }
                                            },
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
                                                    reputation: 10,
                                                    movies: {
                                                        connect: [
                                                            {
                                                                where: {
                                                                    node: {
                                                                        title: "Constantine"
                                                                    }
                                                                },
                                                                edge: {
                                                                    score: 10
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2020
                                                }
                                            },
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    directors: {
                                        ${typeActor.name}: [
                                          {
                                            where: {
                                              node: {
                                                name: "Keanu Reeves"
                                              }
                                            },
                                            delete: {
                                              movies: [
                                                  {
                                                      where: {
                                                          node: {
                                                              title_STARTS_WITH: "Constantine"
                                                          }
                                                      },
                                                      delete: {
                                                        reviewers: [
                                                            {
                                                                where: {
                                                                    node: {
                                                                        reputation: 10
                                                                    }
                                                                }
                                                            }
                                                        ]
                                                      }
                                                  }
                                              ]
                                            }
                                          }
                                        ],
                                        ${typePerson.name}: [
                                          {
                                            where: {
                                              node: {
                                                reputation: 10
                                              }
                                            },
                                            delete: {
                                              movies: [
                                                  {
                                                      where: {
                                                          node: {
                                                              title_STARTS_WITH: "Constantine"
                                                          }
                                                      },
                                                      delete: {
                                                        reviewers: [
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
                                                                }
                                                            }
                                                        ]
                                                      }
                                                  }
                                              ]
                                            }
                                          }
                                        ]
                                    }
                                }
                        ) {
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(3);
        await wsClient2.waitForEvents(8);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(8);
        expect(wsClient.events).toHaveLength(3);

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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
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
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "John Wick" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2020,
                            node: {
                                name: "Jill",
                                reputation: 10,
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

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 10,
                            node: {
                                name: "Jim",
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
                            score: 100,
                            node: {
                                name: "Julia",
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
                        name: "Julia",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 100,
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
                            score: 100,
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
                        name: "Jim",
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
    test("disconnect via delete nested - with relationships: interface to union type", async () => {
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
                                                    name: "Keanu Reeves",
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Constantine"
                                                                },
                                                                edge: {
                                                                    screenTime: 1000
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2019
                                                }
                                            },
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
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Constantine2"
                                                                },
                                                                edge: {
                                                                    score: 42
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2020
                                                }
                                            },
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
                                title: "Matrix2",
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
                                                    name: "Keanu Reeves",
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Constantine"
                                                                },
                                                                edge: {
                                                                    screenTime: 1000
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2019
                                                }
                                            },
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
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Constantine2"
                                                                },
                                                                edge: {
                                                                    score: 42
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                edge: {
                                                    year: 2020
                                                }
                                            },
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
                                title: "Matrix3",
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
                                    create: [
                                            {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Ana",
                                                    reputation: 10,
                                                    movies: {
                                                        connect: [
                                                            {
                                                                where: {
                                                                    node: {
                                                                        title: "Matrix2"
                                                                    }
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            },
                                                            {
                                                                where: {
                                                                    node: {
                                                                        title: "Matrix3"
                                                                    }
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            }
                                                        ]
                                                    }
                                                },
                                                ${typeInfluencer.name}: {
                                                    url: "/bob",
                                                    reputation: 10
                                                }
                                            },
                                            edge: {
                                                score: 100
                                            }
                                        },
                                        {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Julia",
                                                    reputation: 10,
                                                    movies: {
                                                        create: [
                                                            {
                                                                node: {
                                                                    title: "Other Matrix"
                                                                },
                                                                edge: {
                                                                    score: 420
                                                                }
                                                            }
                                                        ]
                                                    }
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
                        ${typeMovie.operations.delete}(
                                where: {
                                  title: "John Wick"
                                },
                                delete: {
                                    reviewers: [
                                        {
                                            where: {
                                                node: {
                                                    reputation: 10,
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
                                            delete: {
                                                _on: {
                                                    ${typePerson.name}: [
                                                        {
                                                            movies: [
                                                                {
                                                                    where: {
                                                                        edge: {
                                                                            score: 420
                                                                        }
                                                                    },
                                                                    delete: {
                                                                        directors: {
                                                                            ${typeActor.name}: [
                                                                              {
                                                                                where: {
                                                                                  node: {
                                                                                    name: "Keanu Reeves"
                                                                                  }
                                                                                },
                                                                                delete: {
                                                                                  movies: [
                                                                                      {
                                                                                          where: {
                                                                                              node: {
                                                                                                  title_STARTS_WITH: "Constantine"
                                                                                              }
                                                                                          }
                                                                                      }
                                                                                  ]
                                                                                }
                                                                              }
                                                                            ],
                                                                            ${typePerson.name}: [
                                                                              {
                                                                                where: {
                                                                                  node: {
                                                                                    reputation: 10
                                                                                  }
                                                                                },
                                                                                delete: {
                                                                                  movies: [
                                                                                      {
                                                                                          where: {
                                                                                              node: {
                                                                                                  title_STARTS_WITH: "Constantine"
                                                                                              }
                                                                                          }
                                                                                      }
                                                                                  ]
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
                            nodesDeleted
                            relationshipsDeleted
                        }
                    }
                `,
            })
            .expect(200);

        await wsClient.waitForEvents(5);
        await wsClient2.waitForEvents(16);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(16);
        expect(wsClient.events).toHaveLength(5);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix3" },
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix3" },
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 1000,
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
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            screenTime: 1000,
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
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2020,
                            node: {
                                name: "Jill",
                                reputation: 10,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix3" },
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        actors: null,
                        directors: {
                            year: 2020,
                            node: {
                                name: "Jill",
                                reputation: 10,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Jim",
                                reputation: 10,
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 42,
                            node: {
                                name: "Jim",
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
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
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
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Matrix3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "reviewers",
                    deletedRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 420,
                            node: {
                                name: "Ana",
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
                            score: 420,
                            node: {
                                title: "Matrix3",
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
                            score: 420,
                            node: {
                                title: "Matrix2",
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
                        name: "Jim",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 42,
                            node: {
                                title: "Constantine2",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Jim",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            score: 42,
                            node: {
                                title: "Constantine2",
                            },
                        },
                    },
                },
            },
        ]);
    });
});
