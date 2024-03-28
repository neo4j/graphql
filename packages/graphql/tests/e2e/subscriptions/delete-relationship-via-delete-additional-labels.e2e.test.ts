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

describe("Delete Subscriptions when only nodes are targeted - when nodes employ @node directive to configure db label and additionalLabels", () => {
    const testHelper = new TestHelper();
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let wsClient2: WebSocketTestClient;
    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    let typePerson: UniqueType;
    let typeDinosaur: UniqueType;
    let typeFilm: UniqueType;
    let typeSeries: UniqueType;
    let typeProduction: UniqueType;
    let typeDefs: string;

    beforeEach(async () => {
        typeActor = testHelper.createUniqueType("Actor");
        typePerson = testHelper.createUniqueType("Person");
        typeDinosaur = testHelper.createUniqueType("Dinosaur");
        typeMovie = testHelper.createUniqueType("Movie");
        typeFilm = testHelper.createUniqueType("Film");
        typeSeries = testHelper.createUniqueType("Series");
        typeProduction = testHelper.createUniqueType("Production");

        typeDefs = `
             type ${typeActor} @node(labels: ["${typeActor}", "${typePerson}"]) {
                 name: String
                 movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                 productions: [${typeProduction}!]! @relationship(type: "PART_OF", direction: OUT)
             }

            type ${typeDinosaur} @node(labels: ["${typePerson}"]) {
                name: String
                movies: [${typeMovie}!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type ${typePerson} {
                name: String
                movies: [${typeMovie}!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type ${typeMovie} @node(labels: ["${typeFilm}", "Multimedia"]) {
                id: ID
                title: String
                actors: [${typeActor}!]! @relationship(type: "ACTED_IN", direction: IN)
                directors: [${typePerson}!]! @relationship(type: "DIRECTED", direction: IN)
            }

             type ${typeSeries} @node(labels: ["${typeSeries}", "${typeProduction}"]) {
                 title: String
                 actors: [${typeActor}!]! @relationship(type: "PART_OF", direction: IN)
                 productions: [${typeProduction}!]! @relationship(type: "IS_A", direction: OUT)
             }

             type ${typeProduction}  @node(labels: ["${typeProduction}", "${typeSeries}"])  {
                 title: String
                 actors: [${typeActor}!]! @relationship(type: "ACTED_IN", direction: IN)
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
                        node {
                            title
                        }
                    }
                    productions {
                        node {
                            title
                        }
                    }
                }
            }
        }
    `;

    const movieSubscriptionQuery = (typeMovie) => `
        subscription SubscriptionMovie {
            ${typeMovie.operations.subscribe.relationship_deleted} {
                relationshipFieldName
                event
                ${typeMovie.operations.subscribe.payload.relationship_deleted} {
                    title
                }
                deletedRelationship {
                    actors {
                        node {
                            name
                        }
                    }
                    directors {
                        node {
                            name
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
                        node {
                            title
                        }
                    }
                }
            }
        }
    `;

    const seriesSubscriptionQuery = (typeSeries) => `
        subscription SubscriptionSeries {
            ${typeSeries.operations.subscribe.relationship_deleted} {
                relationshipFieldName
                event
                ${typeSeries.operations.subscribe.payload.relationship_deleted} {
                    title
                }
                deletedRelationship {
                    actors {
                        node {
                            name
                        }
                    }
                    productions {
                        node {
                            title
                        }
                    }
                }
            }
        }
    `;

    test("disconnect via delete - find by label returns correct type when label specified", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
            mutation {
                ${typeActor.operations.create}(
                    input: [
                        {
                            movies: {
                                create: [
                                    {
                                        node: {
                                            title: "John Wick"
                                        }
                                    },
                                    {
                                        node: {
                                            title: "Constantine"
                                        }
                                    }
                                ]
                            },
                            name: "Keanu Reeves",
                        },
                        {
                            name: "Keanu Reeves",
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
        await wsClient2.subscribe(movieSubscriptionQuery(typeMovie));

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        // 3. perform update on created node
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeActor.operations.delete}(
                            where: {
                                name: "Keanu Reeves"
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
        await wsClient.waitForEvents(2);

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
                            node: {
                                name: "Keanu Reeves",
                            },
                        },
                        directors: null,
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
                            node: {
                                name: "Keanu Reeves",
                            },
                        },
                        directors: null,
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
                            node: {
                                title: "John Wick",
                            },
                        },
                        productions: null,
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
                            node: {
                                title: "Constantine",
                            },
                        },
                        productions: null,
                    },
                },
            },
        ]);
    });

    test("disconnect via delete - find by label returns correct type when additionalLabels specified", async () => {
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
                                            name: "Someone"
                                        }
                                    },
                                    {
                                        node: {
                                            name: "Someone else"
                                        }
                                    }
                                ]
                            },
                            title: "Constantine 3",
                        },
                        {
                            actors: {
                                create: [
                                    {
                                        node: {
                                            name: "Someone"
                                        }
                                    }
                                ]
                            },
                            title: "Constantine 2",
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
        await wsClient2.subscribe(movieSubscriptionQuery(typeMovie));

        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        // 3. perform update on created node
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeMovie.operations.delete}(
                            where: {
                                title_STARTS_WITH: "Constantine"
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
        await wsClient.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toHaveLength(3);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine 3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            node: {
                                name: "Someone",
                            },
                        },
                        directors: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine 3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            node: {
                                name: "Someone else",
                            },
                        },
                        directors: null,
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine 2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            node: {
                                name: "Someone",
                            },
                        },
                        directors: null,
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Someone",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            node: {
                                title: "Constantine 3",
                            },
                        },
                        productions: null,
                    },
                },
            },
            {
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Someone else",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            node: {
                                title: "Constantine 3",
                            },
                        },
                        productions: null,
                    },
                },
            },
            {
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Someone",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            node: {
                                title: "Constantine 2",
                            },
                        },
                        productions: null,
                    },
                },
            },
        ]);
    });

    test("disconnect via delete - relation to two types of same underlying db type", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typePerson.operations.create}(
                            input: [
                                {
                                    name: "Person someone",
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
                        ${typeDinosaur.operations.create}(
                            input: [
                                {
                                    name: "Dinosaur someone",
                                }
                            ]
                        ) {
                            ${typeDinosaur.plural} {
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
                            directors: {
                                connect: [
                                    {
                                       where: {
                                            node: {
                                                name: "Person someone"
                                            }
                                        }
                                    },
                                    {
                                        where: {
                                             node: {
                                                 name: "Dinosaur someone"
                                             }
                                         }
                                     }
                                ]
                            },
                            title: "Constantine 3",
                        },
                        {
                            directors: {
                                create: [
                                    {
                                        node: {
                                            name: "Dinosaur or Person"
                                        }
                                    }
                                ]
                            },
                            title: "Constantine 2",
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
        await wsClient2.subscribe(movieSubscriptionQuery(typeMovie));

        await wsClient.subscribe(personSubscriptionQuery(typePerson));

        // 3. perform update on created node
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeMovie.operations.delete}(
                            where: {
                                title_STARTS_WITH: "Constantine"
                            }
                    ) {
                        nodesDeleted
                        relationshipsDeleted
                    }
                }
            `,
            })
            .expect(200);

        await wsClient2.waitForEvents(6);
        await wsClient.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(6);
        expect(wsClient.events).toHaveLength(3);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                // 1. movie + person
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine 3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        directors: {
                            node: {
                                name: "Person someone",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 2. movie + dinosaur
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine 3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        directors: {
                            node: {
                                name: "Person someone",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 1. movie + person
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine 3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        directors: {
                            node: {
                                name: "Dinosaur someone",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 2. movie + dinosaur
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine 3" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        directors: {
                            node: {
                                name: "Dinosaur someone",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 1. movie + person
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine 2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        directors: {
                            node: {
                                name: "Dinosaur or Person",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 2. movie + dinosaur
                [typeMovie.operations.subscribe.relationship_deleted]: {
                    [typeMovie.operations.subscribe.payload.relationship_deleted]: { title: "Constantine 2" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        directors: {
                            node: {
                                name: "Dinosaur or Person",
                            },
                        },
                        actors: null,
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Person someone",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            node: {
                                title: "Constantine 3",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Dinosaur someone",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            node: {
                                title: "Constantine 3",
                            },
                        },
                    },
                },
            },
            {
                [typePerson.operations.subscribe.relationship_deleted]: {
                    [typePerson.operations.subscribe.payload.relationship_deleted]: {
                        name: "Dinosaur or Person",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            node: {
                                title: "Constantine 2",
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("disconnect via delete - relation to two types of matching with same labels", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeProduction.operations.create}(
                            input: [
                                {
                                    title: "A Production",
                                }
                            ]
                        ) {
                            ${typeProduction.plural} {
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
                        ${typeSeries.operations.create}(
                            input: [
                                {
                                    title: "A Series",
                                }
                            ]
                        ) {
                            ${typeSeries.plural} {
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
                            productions: {
                                connect: [
                                    {
                                       where: {
                                            node: {
                                                title: "A Production"
                                            }
                                        }
                                    },
                                    {
                                        where: {
                                             node: {
                                                 title: "A Series"
                                             }
                                         }
                                     }
                                ],
                                create: [
                                    {
                                        node: {
                                            title: "Constantine"
                                        }
                                    }
                                ]
                            },
                            name: "Keanu Reeves",
                        },
                        {
                            name: "Keanu Reeves",
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
        await wsClient2.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient.subscribe(seriesSubscriptionQuery(typeSeries));

        // 3. perform update on created node
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeActor.operations.delete}(
                            where: {
                                name: "Keanu Reeves"
                            }
                    ) {
                        nodesDeleted
                        relationshipsDeleted
                    }
                }
            `,
            })
            .expect(200);

        await wsClient2.waitForEvents(6);
        await wsClient.waitForEvents(3);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(6);
        expect(wsClient.events).toHaveLength(3);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                // 1. actor + series
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Keanu Reeves",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "Constantine",
                            },
                        },
                        movies: null,
                    },
                },
            },
            {
                // 2. actor + production
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Keanu Reeves",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "Constantine",
                            },
                        },
                        movies: null,
                    },
                },
            },
            {
                // 1. actor + series
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Keanu Reeves",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "A Series",
                            },
                        },
                        movies: null,
                    },
                },
            },
            {
                // 2. actor + production
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Keanu Reeves",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "A Series",
                            },
                        },
                        movies: null,
                    },
                },
            },
            {
                // 1. actor + series
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Keanu Reeves",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "A Production",
                            },
                        },
                        movies: null,
                    },
                },
            },
            {
                // 2. actor + production
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Keanu Reeves",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "A Production",
                            },
                        },
                        movies: null,
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "A Series" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            node: {
                                name: "Keanu Reeves",
                            },
                        },
                        productions: null,
                    },
                },
            },
            {
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "Constantine" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            node: {
                                name: "Keanu Reeves",
                            },
                        },
                        productions: null,
                    },
                },
            },
            {
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "A Production" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        actors: {
                            node: {
                                name: "Keanu Reeves",
                            },
                        },
                        productions: null,
                    },
                },
            },
        ]);
    });

    test("disconnect via delete - relation to self via other type with same labels", async () => {
        // 1. create
        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeProduction.operations.create}(
                            input: [
                                {
                                    title: "A Production",
                                }
                            ]
                        ) {
                            ${typeProduction.plural} {
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
                        ${typeSeries.operations.create}(
                            input: [
                                {
                                    title: "A Series",
                                }
                            ]
                        ) {
                            ${typeSeries.plural} {
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
                        ${typeSeries.operations.create}(
                            input: [
                                {
                                    title: "Another Series",
                                    productions: {
                                        connect: [
                                            {
                                                where: {
                                                    node: {
                                                        title: "A Production"
                                                    }
                                                }
                                            },
                                            {
                                                where: {
                                                    node: {
                                                        title: "A Series"
                                                    }
                                                }
                                            }
                                        ],
                                        create: [
                                            {
                                                node: {
                                                    title: "Another Production"
                                                }
                                            }
                                        ]
                                    }
                                }
                            ]
                        ) {
                            ${typeSeries.plural} {
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
                            productions: {
                                connect: [
                                    {
                                        where: {
                                             node: {
                                                 title: "Another Series"
                                             }
                                         }
                                     }
                                ],
                                create: [
                                    {
                                        node: {
                                            title: "Constantine"
                                        }
                                    }
                                ]
                            },
                            name: "Keanu Reeves",
                        },
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
        await wsClient2.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient.subscribe(seriesSubscriptionQuery(typeSeries));

        // 3. perform update on created node
        await supertest(server.path)
            .post("")
            .send({
                query: `
                mutation {
                    ${typeSeries.operations.delete}(
                            where: {
                                title: "Another Series"
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
        await wsClient.waitForEvents(10);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(2);
        expect(wsClient.events).toHaveLength(10);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Keanu Reeves",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "Another Series",
                            },
                        },
                        movies: null,
                    },
                },
            },
            {
                [typeActor.operations.subscribe.relationship_deleted]: {
                    [typeActor.operations.subscribe.payload.relationship_deleted]: {
                        name: "Keanu Reeves",
                    },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "Another Series",
                            },
                        },
                        movies: null,
                    },
                },
            },
        ]);

        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "Another Series" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "actors",
                    deletedRelationship: {
                        productions: null,
                        actors: {
                            node: {
                                name: "Keanu Reeves",
                            },
                        },
                    },
                },
            },
            {
                // 1. series + series
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "Another Series" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "A Series",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 2. series + production
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "Another Series" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "A Series",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 3. production + series
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "A Series" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "Another Series",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 1. series + series
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "Another Series" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "A Production",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 2. series + production
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "Another Series" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "A Production",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 3. production + series
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "A Production" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "Another Series",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 1. series + series
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "Another Series" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "Another Production",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 2. series + production
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "Another Series" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "Another Production",
                            },
                        },
                        actors: null,
                    },
                },
            },
            {
                // 3. production + series
                [typeSeries.operations.subscribe.relationship_deleted]: {
                    [typeSeries.operations.subscribe.payload.relationship_deleted]: { title: "Another Production" },
                    event: "DELETE_RELATIONSHIP",

                    relationshipFieldName: "productions",
                    deletedRelationship: {
                        productions: {
                            node: {
                                title: "Another Series",
                            },
                        },
                        actors: null,
                    },
                },
            },
        ]);
    });
});
