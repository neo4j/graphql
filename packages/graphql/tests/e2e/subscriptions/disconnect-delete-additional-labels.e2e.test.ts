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
import { cleanNodes } from "../../utils/clean-nodes";

describe("Delete Subscriptions when only nodes are targeted - when nodes employ @node directive to configure db label and additionalLabels", () => {
    let neo4j: Neo4j;
    let driver: Driver;
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
        typeActor = generateUniqueType("Actor");
        typePerson = generateUniqueType("Person");
        typeDinosaur = generateUniqueType("Dinosaur");
        typeMovie = generateUniqueType("Movie");
        typeFilm = generateUniqueType("Film");
        typeSeries = generateUniqueType("Series");
        typeProduction = generateUniqueType("Production");

        typeDefs = `
             type ${typeActor} @node(additionalLabels: ["${typePerson}"]) {
                 name: String
                 movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                 productions: [${typeProduction}!]! @relationship(type: "PART_OF", direction: OUT)
             }

            type ${typeDinosaur} @node(label: "${typePerson}") {
                name: String
                movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${typePerson} {
                name: String
                movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${typeMovie} @node(label: "${typeFilm}", additionalLabels: ["Multimedia"]) {
                id: ID
                title: String
                actors: [${typeActor}!]! @relationship(type: "ACTED_IN", direction: IN)
                directors: [${typePerson}!]! @relationship(type: "DIRECTED", direction: IN)
            }

             type ${typeSeries} @node(additionalLabels: ["${typeProduction}"]) {
                 title: String
                 actors: [${typeActor}!]! @relationship(type: "ACTED_IN", direction: IN)
                 productions: [${typeProduction}!]! @relationship(type: "IS_A", direction: OUT)
             }

             type ${typeProduction} @node(additionalLabels: ["${typeSeries}"]) {
                 title: String
                 actors: [${typeActor}!]! @relationship(type: "ACTED_IN", direction: IN)
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

        const session = driver.session();
        await cleanNodes(session, [typeActor, typeMovie, typePerson, typeFilm, typeSeries, typeProduction]);

        await server.close();
        await driver.close();
    });

    const actorSubscriptionQuery = (typeActor) => `
        subscription SubscriptionActor {
            ${typeActor.operations.subscribe.disconnected} {
                relationshipFieldName
                event
                ${typeActor.operations.subscribe.payload.disconnected} {
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

    const movieSubscriptionQuery = (typeMovie) => `
subscription SubscriptionMovie {
    ${typeMovie.operations.subscribe.disconnected} {
        relationshipFieldName
        event
        ${typeMovie.operations.subscribe.payload.disconnected} {
            title
        }
        deletedRelationship {
            actors {
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
    ${typePerson.operations.subscribe.disconnected} {
        relationshipFieldName
        event
        ${typePerson.operations.subscribe.payload.disconnected} {
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

    const productionSubscriptionQuery = (typeProduction) => `
subscription SubscriptionProduction {
    ${typeProduction.operations.subscribe.disconnected} {
        relationshipFieldName
        event
        ${typeProduction.operations.subscribe.payload.disconnected} {
            title
        }
        deletedRelationship {
            actors {
                node {
                    name
                }
            }
        }
    }
}
`;

    const seriesSubscriptionQuery = (typeSeries) => `
subscription SubscriptionSeries {
    ${typeSeries.operations.subscribe.disconnected} {
        relationshipFieldName
        event
        ${typeSeries.operations.subscribe.payload.disconnected} {
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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.disconnected]: {
                    [typeMovie.operations.subscribe.payload.disconnected]: { title: "John Wick" },
                    event: "DISCONNECT",

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
                [typeActor.operations.subscribe.disconnected]: {
                    [typeActor.operations.subscribe.payload.disconnected]: {
                        name: "Keanu Reeves",
                    },
                    event: "DISCONNECT",

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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.disconnected]: {
                    [typeMovie.operations.subscribe.payload.disconnected]: { title: "John Wick" },
                    event: "DISCONNECT",

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
                [typeActor.operations.subscribe.disconnected]: {
                    [typeActor.operations.subscribe.payload.disconnected]: {
                        name: "Keanu Reeves",
                    },
                    event: "DISCONNECT",

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

    // all are dinosaur
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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(3);
        expect(wsClient.events).toHaveLength(3);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.disconnected]: {
                    [typeMovie.operations.subscribe.payload.disconnected]: { title: "Constantine 3" },
                    event: "DISCONNECT",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        directors: {
                            node: {
                                name: "Person someone",
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.disconnected]: {
                    [typeMovie.operations.subscribe.payload.disconnected]: { title: "Constantine 3" },
                    event: "DISCONNECT",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        directors: {
                            node: {
                                name: "Dinosaur someone",
                            },
                        },
                    },
                },
            },
            {
                [typeMovie.operations.subscribe.disconnected]: {
                    [typeMovie.operations.subscribe.payload.disconnected]: { title: "Constantine 2" },
                    event: "DISCONNECT",

                    relationshipFieldName: "directors",
                    deletedRelationship: {
                        directors: {
                            node: {
                                name: "Dinosaur or Person",
                            },
                        },
                    },
                },
            },
        ]);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeActor.operations.subscribe.disconnected]: {
                    [typeActor.operations.subscribe.payload.disconnected]: {
                        name: "Person someone 3",
                    },
                    event: "DISCONNECT",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
            {
                [typeActor.operations.subscribe.disconnected]: {
                    [typeActor.operations.subscribe.payload.disconnected]: {
                        name: "Dinosaur someone 3",
                    },
                    event: "DISCONNECT",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
            {
                [typeActor.operations.subscribe.disconnected]: {
                    [typeActor.operations.subscribe.payload.disconnected]: {
                        name: "Dinosaur or Person 2",
                    },
                    event: "DISCONNECT",

                    relationshipFieldName: "movies",
                    deletedRelationship: {
                        movies: {
                            node: {
                                title: "Constantine",
                            },
                        },
                    },
                },
            },
        ]);
    });

    // all are series
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
        // console.log(r.error);

        // 2. subscribe both ways
        await wsClient2.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient.subscribe(productionSubscriptionQuery(typeProduction));

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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.disconnected]: {
                    [typeMovie.operations.subscribe.payload.disconnected]: { title: "John Wick" },
                    event: "DISCONNECT",

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
                [typeActor.operations.subscribe.disconnected]: {
                    [typeActor.operations.subscribe.payload.disconnected]: {
                        name: "Keanu Reeves",
                    },
                    event: "DISCONNECT",

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

    // all are series
    test.only("disconnect via delete - relation to self via other type with same labels", async () => {
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

        await wsClient.subscribe(productionSubscriptionQuery(typeProduction));

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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);

        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);

        expect(wsClient2.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.disconnected]: {
                    [typeMovie.operations.subscribe.payload.disconnected]: { title: "John Wick" },
                    event: "DISCONNECT",

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
                [typeActor.operations.subscribe.disconnected]: {
                    [typeActor.operations.subscribe.payload.disconnected]: {
                        name: "Keanu Reeves",
                    },
                    event: "DISCONNECT",

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
});
