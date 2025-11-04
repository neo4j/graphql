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
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";
import type { TestGraphQLServer } from "../setup/apollo-server";
import { ApolloTestServer } from "../setup/apollo-server";
import { WebSocketTestClient } from "../setup/ws-client";

describe("Delete Subscriptions - with interfaces, unions and nested operations", () => {
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
            }
            
            type ${typeActor} {
                name: String!
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
                movies: [${typeMovie}!]! @relationship(type: "REVIEWED", direction: OUT, properties: "Review")
            }
            
            type ${typeInfluencer} implements Reviewer {
                reputation: Int!
                url: String!
            }
            
            #union Director = ${typePerson} | ${typeActor}
            union Director =  ${typeActor} | ${typePerson}
            
            interface Reviewer {
                reputation: Int!

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

        await server.close();
        await testHelper.close();
    });

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
        await wsClient2.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted} {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    title
                }
                event
                timestamp
            }
        }
    `);
        await wsClient.subscribe(`
    subscription {
        ${typeActor.operations.subscribe.deleted} {
            ${typeActor.operations.subscribe.payload.deleted} {
                name
            }
            event
            timestamp
        }
    }
`);

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

        await wsClient2.waitForEvents(1);
        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "John Wick" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.deleted]: {
                    [typeActor.operations.subscribe.payload.deleted]: { name: "Keanu Reeves" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
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
        await wsClient2.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted} {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    title
                }
                event
                timestamp
            }
        }
    `);
        await wsClient.subscribe(`
    subscription {
        ${typeActor.operations.subscribe.deleted} {
            ${typeActor.operations.subscribe.payload.deleted} {
                name
            }
            event
            timestamp
        }
    }
`);

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

        await wsClient2.waitForEvents(2);
        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "John Wick" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "Matrix" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.deleted]: {
                    [typeActor.operations.subscribe.payload.deleted]: { name: "Keanu Reeves" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
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
        await wsClient2.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted} {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    title
                }
                event
                timestamp
            }
        }
    `);
        await wsClient.subscribe(`
    subscription {
        ${typePerson.operations.subscribe.deleted} {
            ${typePerson.operations.subscribe.payload.deleted} {
                name
            }
            event
            timestamp
        }
    }
`);

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

        await wsClient2.waitForEvents(1);
        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(2);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "John Wick" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.deleted]: {
                    [typePerson.operations.subscribe.payload.deleted]: { name: "Jim" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typePerson.operations.subscribe.deleted]: {
                    [typePerson.operations.subscribe.payload.deleted]: { name: "Jill" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
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
        await wsClient2.subscribe(`
                subscription {
                    ${typeMovie.operations.subscribe.deleted} {
                        ${typeMovie.operations.subscribe.payload.deleted} {
                            title
                        }
                        event
                        timestamp
                    }
                }
            `);
        await wsClient.subscribe(`
            subscription {
                ${typePerson.operations.subscribe.deleted} {
                    ${typePerson.operations.subscribe.payload.deleted} {
                        name
                    }
                    event
                    timestamp
                }
            }
        `);

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

        await wsClient2.waitForEvents(3);
        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toHaveLength(2);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "John Wick" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "Matrix" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "Matrix2" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.deleted]: {
                    [typePerson.operations.subscribe.payload.deleted]: { name: "Jim" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typePerson.operations.subscribe.deleted]: {
                    [typePerson.operations.subscribe.payload.deleted]: { name: "Jill" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
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
        await wsClient2.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted} {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    title
                }
                event
                timestamp
            }
        }
    `);
        await wsClient.subscribe(`
    subscription {
        ${typePerson.operations.subscribe.deleted} {
            ${typePerson.operations.subscribe.payload.deleted} {
                name
            }
            event
            timestamp
        }
    }
`);

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

        await wsClient2.waitForEvents(1);
        await wsClient.waitForEvents(1);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "John Wick" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.deleted]: {
                    [typePerson.operations.subscribe.payload.deleted]: { name: "Ana" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
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
                                        },
                                        {
                                            node: {
                                                ${typePerson.name}: {
                                                    name: "Ana",
                                                    reputation: 10
                                                }
                                            },
                                            edge: {
                                                score: 110
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
        subscription {
            ${typeMovie.operations.subscribe.deleted} {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    title
                }
                event
                timestamp
            }
        }
    `);
        await wsClient.subscribe(`
    subscription {
        ${typePerson.operations.subscribe.deleted} {
            ${typePerson.operations.subscribe.payload.deleted} {
                name
            }
            event
            timestamp
        }
    }
`);

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

        await wsClient2.waitForEvents(1);
        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(2);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "John Wick" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.deleted]: {
                    [typePerson.operations.subscribe.payload.deleted]: { name: "Ana" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typePerson.operations.subscribe.deleted]: {
                    [typePerson.operations.subscribe.payload.deleted]: { name: "Ana" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
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
        await wsClient2.subscribe(`
        subscription {
            ${typeMovie.operations.subscribe.deleted} {
                ${typeMovie.operations.subscribe.payload.deleted} {
                    title
                }
                event
                timestamp
            }
        }
    `);
        await wsClient.subscribe(`
    subscription {
        ${typePerson.operations.subscribe.deleted} {
            ${typePerson.operations.subscribe.payload.deleted} {
                name
            }
            event
            timestamp
        }
    }
`);

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

        await wsClient2.waitForEvents(2);
        await wsClient.waitForEvents(4);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient.events).toHaveLength(4);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "John Wick" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typeMovie.operations.subscribe.deleted]: {
                    [typeMovie.operations.subscribe.payload.deleted]: { title: "Constantine" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.deleted]: {
                    [typePerson.operations.subscribe.payload.deleted]: { name: "Ana" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typePerson.operations.subscribe.deleted]: {
                    [typePerson.operations.subscribe.payload.deleted]: { name: "Julia" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typePerson.operations.subscribe.deleted]: {
                    [typePerson.operations.subscribe.payload.deleted]: { name: "Jim" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
            {
                [typePerson.operations.subscribe.deleted]: {
                    [typePerson.operations.subscribe.payload.deleted]: { name: "Jill" },
                    event: "DELETE",
                    timestamp: expect.any(Number),
                },
            },
        ]);
    });
});
