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

import { type Driver } from "neo4j-driver";
import supertest from "supertest";
import type { Neo4jGraphQLSubscriptionsEngine } from "../../../../src";
import { Neo4jGraphQLSubscriptionsDefaultEngine } from "../../../../src/classes/subscription/Neo4jGraphQLSubscriptionsDefaultEngine";
import { delay } from "../../../../src/utils/utils";
import { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";
import type { TestGraphQLServer } from "../../setup/apollo-server";
import { ApolloTestServer } from "../../setup/apollo-server";
import { WebSocketTestClient } from "../../setup/ws-client";

describe.each([
    {
        name: "Neo4jGraphQLSubscriptionsDefaultEngine",
        engine: (_driver: Driver, _db: string) => new Neo4jGraphQLSubscriptionsDefaultEngine(),
    },
    // Relationship not supported on CDC
    // {
    //     name: "Neo4jGraphQLSubscriptionsCDCEngine",
    //     engine: (driver: Driver, db: string) =>
    //         new Neo4jGraphQLSubscriptionsCDCEngine({
    //             driver,
    //             pollTime: 100,
    //             queryConfig: {
    //                 database: db,
    //             },
    //         }),
    // },
])("$name - Connect Subscription with optional filters valid for all types", ({ engine }) => {
    const testHelper = new TestHelper();
    let server: TestGraphQLServer;
    let wsClient: WebSocketTestClient;
    let wsClient2: WebSocketTestClient;
    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    let typePerson: UniqueType;
    let typeInfluencer: UniqueType;
    let typeDefs: string;
    let subscriptionEngine: Neo4jGraphQLSubscriptionsEngine;

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

        const driver = await testHelper.getDriver();
        subscriptionEngine = engine(driver, testHelper.database);
        const neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: subscriptionEngine,
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
        subscriptionEngine.close();

        await server.close();
        await testHelper.close();
    });

    const movieSubscriptionQuery = ({ typeMovie, typePerson, typeInfluencer, where }) => `
subscription SubscriptionMovie {
    ${typeMovie.operations.subscribe.relationship_created}(where: ${where}) {
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

    test("node filter on standard type", async () => {
        const where = `{createdRelationship: {actors: {node: {name_NOT: "Keanu"}}}}`;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                            },
                                            {
                                                node: {
                                                    name: "Reeves"
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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 1000,
                            node: {
                                name: "Reeves",
                            },
                        },
                        directors: null,
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("where across source and target node", async () => {
        const where = `{ ${typeMovie.operations.subscribe.payload.relationship_created}: { title: "Matrix" }, createdRelationship: { actors: { node: { name: "Keanu" } } } }`;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                            },
                                            {
                                                node: {
                                                    name: "Reeves"
                                                },
                                                edge: {
                                                    screenTime: 1000
                                                }
                                            }
                                        ]
                                    },
                                    title: "Matrix",
                                },
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
                                            },
                                            {
                                                node: {
                                                    name: "Reeves"
                                                },
                                                edge: {
                                                    screenTime: 1000
                                                }
                                            }
                                        ]
                                    },
                                    title: "Speed",
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
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
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

    test("node filter on standard type - by connected field", async () => {
        const where = `{${typeMovie.operations.subscribe.payload.relationship_created}: {title: "Matrix"}}`;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                            },
                                            {
                                                node: {
                                                    name: "Reeves"
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

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 1000,
                            node: {
                                name: "Reeves",
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
    test("node filter on standard type - by connected field expecting none", async () => {
        const where = `{${typeMovie.operations.subscribe.payload.relationship_created}: {title_NOT: "Matrix"}}`;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                            },
                                            {
                                                node: {
                                                    name: "Reeves"
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

        // forcing a delay to ensure events do not exist
        await delay(3);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(0);
    });

    test("edge filter on standard type", async () => {
        const where = `{createdRelationship: {actors: {edge: {screenTime_IN: [42, 420]}}}}`;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                            },
                                            {
                                                node: {
                                                    name: "Reeves"
                                                },
                                                edge: {
                                                    screenTime: 420
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

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "actors",
                    createdRelationship: {
                        actors: {
                            screenTime: 420,
                            node: {
                                name: "Reeves",
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

    test("node and edge filter on standard type", async () => {
        const where = `{createdRelationship: {actors: {node: {name_STARTS_WITH: "K"}, edge: {screenTime_IN: [42, 420]}}}}`;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                            },
                                            {
                                                node: {
                                                    name: "Keanu Reeves"
                                                },
                                                edge: {
                                                    screenTime: 420
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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
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
        ]);
    });

    test("node filter on union type - both types", async () => {
        const where = `{createdRelationship: { directors: { ${typePerson.name}: { node: { reputation_GTE: 50 } }, ${typeActor.name}: { node: { name_NOT_IN: ["Keanu", "K"] } } } } }`;

        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                                name: "Jim"
                                              },
                                              edge: {
                                                year: 2001
                                              }
                                            },
                                            {
                                                node: {
                                                  name: "Keanu"
                                                },
                                                edge: {
                                                  year: 2010
                                                }
                                              }
                                          ]
                                        },
                                        ${typePerson.name}: {
                                          create: [
                                            {
                                              node: {
                                                name: "Jill",
                                                reputation: 5
                                              },
                                              edge: {
                                                year: 2001
                                              }
                                            },
                                            {
                                                node: {
                                                  name: "Kim",
                                                  reputation: 55
                                                },
                                                edge: {
                                                  year: 2005
                                                }
                                              }
                                          ]
                                        }
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

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 2001,
                            node: {
                                name: "Jim",
                            },
                        },
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
                            year: 2005,
                            node: {
                                name: "Kim",
                                reputation: 55,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("node filter on union type - single type", async () => {
        const where = `{ createdRelationship: { directors: { ${typePerson.name}: { node: { reputation_GTE: 50 } } } } }`;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                                name: "Jim"
                                              },
                                              edge: {
                                                year: 2001
                                              }
                                            },
                                            {
                                                node: {
                                                  name: "Keanu"
                                                },
                                                edge: {
                                                  year: 2010
                                                }
                                              }
                                          ]
                                        },
                                        ${typePerson.name}: {
                                          create: [
                                            {
                                              node: {
                                                name: "Jill",
                                                reputation: 5
                                              },
                                              edge: {
                                                year: 2001
                                              }
                                            },
                                            {
                                                node: {
                                                  name: "Kim",
                                                  reputation: 55
                                                },
                                                edge: {
                                                  year: 2005
                                                }
                                              }
                                          ]
                                        }
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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 2005,
                            node: {
                                name: "Kim",
                                reputation: 55,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("node & edge filter on union type - both types", async () => {
        const where = `{ createdRelationship: { directors: { ${typePerson.name}: { node: { reputation_GTE: 50 } }, ${typeActor.name}: { edge: { year_GT: 2005 } } } } }`;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                                name: "Jim"
                                              },
                                              edge: {
                                                year: 2001
                                              }
                                            },
                                            {
                                                node: {
                                                  name: "Keanu"
                                                },
                                                edge: {
                                                  year: 2010
                                                }
                                              }
                                          ]
                                        },
                                        ${typePerson.name}: {
                                          create: [
                                            {
                                              node: {
                                                name: "Jill",
                                                reputation: 5
                                              },
                                              edge: {
                                                year: 2001
                                              }
                                            },
                                            {
                                                node: {
                                                  name: "Kim",
                                                  reputation: 55
                                                },
                                                edge: {
                                                  year: 2005
                                                }
                                              }
                                          ]
                                        }
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

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 2010,
                            node: {
                                name: "Keanu",
                            },
                        },
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
                            year: 2005,
                            node: {
                                name: "Kim",
                                reputation: 55,
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("node & edge filter on union type - single types", async () => {
        const where = `{ createdRelationship: { directors: { ${typePerson}: { node: { reputation_GTE: 50 }, edge: { year_LT: 2005 } } } } } `;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                                name: "Jim"
                                              },
                                              edge: {
                                                year: 2001
                                              }
                                            },
                                            {
                                                node: {
                                                  name: "Keanu"
                                                },
                                                edge: {
                                                  year: 2010
                                                }
                                              }
                                          ]
                                        },
                                        ${typePerson.name}: {
                                          create: [
                                            {
                                              node: {
                                                name: "Jill",
                                                reputation: 5
                                              },
                                              edge: {
                                                year: 2001
                                              }
                                            },
                                            {
                                                node: {
                                                  name: "Kim",
                                                  reputation: 55
                                                },
                                                edge: {
                                                  year: 2005
                                                }
                                              }
                                          ]
                                        }
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

        // forcing a delay to ensure events do not exist
        await delay(3);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(0);
    });

    test("node & edge filter on union type - single types, include both types", async () => {
        const where = `{ createdRelationship: { directors: { ${typePerson}: { node: { reputation_GTE: 50 }, edge: { year_LT: 2005 } }, ${typeActor}: {} } } } `;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                                name: "Jim"
                                              },
                                              edge: {
                                                year: 2001
                                              }
                                            },
                                            {
                                                node: {
                                                  name: "Keanu"
                                                },
                                                edge: {
                                                  year: 2010
                                                }
                                              }
                                          ]
                                        },
                                        ${typePerson.name}: {
                                          create: [
                                            {
                                              node: {
                                                name: "Jill",
                                                reputation: 5
                                              },
                                              edge: {
                                                year: 2001
                                              }
                                            },
                                            {
                                                node: {
                                                  name: "Kim",
                                                  reputation: 55
                                                },
                                                edge: {
                                                  year: 2005
                                                }
                                              }
                                          ]
                                        }
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

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "directors",
                    createdRelationship: {
                        actors: null,
                        directors: {
                            year: 2010,
                            node: {
                                name: "Keanu",
                            },
                        },
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
                            year: 2001,
                            node: {
                                name: "Jim",
                            },
                        },
                        reviewers: null,
                    },
                },
            },
        ]);
    });

    test("edge filter on interface type", async () => {
        const where = `{createdRelationship: {reviewers: {edge: {score_IN: [10, 100, 42]}}}}`;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                            edge: {
                                              score: 100
                                            },
                                            node: {
                                              ${typePerson.name}: {
                                                name: "Ana",
                                                reputation: 10
                                              },
                                              ${typeInfluencer.name}: {
                                                  url: "/bob"
                                                  reputation: 9,
                                              }
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

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
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
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 100,
                            node: {
                                url: "/bob",
                                reputation: 9,
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("node filter on interface type - common fields only", async () => {
        const where = `{createdRelationship: {reviewers: {node: {reputation_LT: 10}}}}`;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                            edge: {
                                              score: 100
                                            },
                                            node: {
                                              ${typePerson.name}: {
                                                name: "Ana",
                                                reputation: 10
                                              },
                                              ${typeInfluencer.name}: {
                                                reputation: 9,
                                                url: "/bob"
                                              }
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

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(1);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
                        actors: null,
                        directors: null,
                        reviewers: {
                            score: 100,
                            node: {
                                url: "/bob",
                                reputation: 9,
                            },
                        },
                    },
                },
            },
        ]);
    });

    test("filter included type", async () => {
        const where = `{ createdRelationship: { reviewers: {}, actors: {} } }`;
        await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                            edge: {
                                              score: 100
                                            },
                                            node: {
                                              ${typePerson.name}: {
                                                name: "Ana",
                                                reputation: 10
                                              }
                                            }
                                          }
                                        ]
                                      },
                                      directors: {
                                        ${typeActor.name}: {
                                          create: [
                                            {
                                              node: {
                                                name: "Jim"
                                              },
                                              edge: {
                                                year: 2001
                                              }
                                            }
                                          ]
                                        }
                                    },
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

        await wsClient.waitForEvents(2);

        expect(wsClient.errors).toEqual([]);
        expect(wsClient.events).toHaveLength(2);
        expect(wsClient.events).toIncludeSameMembers([
            {
                [typeMovie.operations.subscribe.relationship_created]: {
                    [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Matrix" },
                    event: "CREATE_RELATIONSHIP",
                    relationshipFieldName: "reviewers",
                    createdRelationship: {
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

    describe("boolean operators", () => {
        test("OR", async () => {
            const where = `{ OR: [ { ${typeMovie.operations.subscribe.payload.relationship_created}: { title: "The Matrix" } }, { createdRelationship: { actors: { node: { name: "Keanu" } } } } ]}`;
            await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                                        name: "Lawrence"
                                                    },
                                                    edge: {
                                                        screenTime: 1000
                                                    }
                                                }
                                            ]
                                        },
                                        title: "The Matrix",
                                    },
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
                                        title: "John Wick",
                                    },
                                    {
                                        actors: {
                                            create: [
                                                {
                                                    node: {
                                                        name: "Hugh Grant"
                                                    },
                                                    edge: {
                                                        screenTime: 1000
                                                    }
                                                }
                                            ]
                                        },
                                        title: "Paddington",
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
                        relationshipFieldName: "actors",
                        createdRelationship: {
                            actors: {
                                screenTime: 1000,
                                node: {
                                    name: "Lawrence",
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

        test("NOT", async () => {
            const where = `{ NOT: { ${typeMovie.operations.subscribe.payload.relationship_created}: { title: "The Matrix" } } }`;
            await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                                        name: "Lawrence"
                                                    },
                                                    edge: {
                                                        screenTime: 1000
                                                    }
                                                }
                                            ]
                                        },
                                        title: "The Matrix",
                                    },
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
                                        title: "John Wick",
                                    },
                                    {
                                        actors: {
                                            create: [
                                                {
                                                    node: {
                                                        name: "Hugh Grant"
                                                    },
                                                    edge: {
                                                        screenTime: 1000
                                                    }
                                                }
                                            ]
                                        },
                                        title: "Paddington",
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
                        [typeMovie.operations.subscribe.payload.relationship_created]: { title: "Paddington" },
                        event: "CREATE_RELATIONSHIP",
                        relationshipFieldName: "actors",
                        createdRelationship: {
                            actors: {
                                screenTime: 1000,
                                node: {
                                    name: "Hugh Grant",
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

        test("Hybrid", async () => {
            const where = `{ AND: [{ OR: [{ ${typeMovie.operations.subscribe.payload.relationship_created}: { title: "The Matrix" } }, { ${typeMovie.operations.subscribe.payload.relationship_created}: { title: "Paddington" } }] }, { createdRelationship: { actors: { node: { name: "Lawrence" } } } }] }`;
            await wsClient.subscribe(movieSubscriptionQuery({ typeInfluencer, typeMovie, typePerson, where }));

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
                                                        name: "Lawrence"
                                                    },
                                                    edge: {
                                                        screenTime: 1000
                                                    }
                                                }
                                            ]
                                        },
                                        title: "The Matrix",
                                    },
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
                                        title: "John Wick",
                                    },
                                    {
                                        actors: {
                                            create: [
                                                {
                                                    node: {
                                                        name: "Hugh Grant"
                                                    },
                                                    edge: {
                                                        screenTime: 1000
                                                    }
                                                }
                                            ]
                                        },
                                        title: "Paddington",
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
                        relationshipFieldName: "actors",
                        createdRelationship: {
                            actors: {
                                screenTime: 1000,
                                node: {
                                    name: "Lawrence",
                                },
                            },
                            directors: null,
                            reviewers: null,
                        },
                    },
                },
            ]);
        });
    });
});
