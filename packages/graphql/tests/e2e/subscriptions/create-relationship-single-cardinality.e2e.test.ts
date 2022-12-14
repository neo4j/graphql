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
import { delay } from "../../../src/utils/utils";

describe("Create Relationship Subscription for relationships of cardinality 1", () => {
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

        // create movie -> connect actor
        // create actor -> connect movie
        typeDefs = `
            type ${typeMovie} {
                title: String!
                actor: ${typeActor}! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                director: Director! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                reviewer: Reviewer! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
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
            
            interface Review {
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
                movieReviewed: ${typeMovie}! @relationship(type: "REVIEWED", direction: OUT, properties: "Review")
            }
            
            union Director = ${typePerson} | ${typeActor}
            
            interface Reviewer {
                reputation: Int!
                reviewerId: Int

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
        await cleanNodes(session, [typeActor, typeMovie, typePerson, typeInfluencer]);

        await server.close();
        await driver.close();
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
            reviewer {
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
            actor {
                screenTime
                node {
                    name
                }
            }
            director {
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

    test("connect via create - 1:*", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeMovie, typePerson, typeInfluencer }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                    name: "Kate"
                                }, {
                                    name: "John"
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

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Titanic",
                                    director: {
                                      ${typeActor.name}: {
                                        connect: {
                                          where: {
                                            node: {
                                              name: "John"
                                            }
                                          },
                                          edge: {
                                            year: 2010
                                          }
                                        }
                                      }
                                    },
                                    actor: {
                                      connect: {
                                        where: {
                                          node: {
                                            name: "Kate"
                                          }
                                         },
                                         edge: {
                                          screenTime: 10
                                         }
                                      }
                                    }
                                  },
                                  {
                                    title: "Avatar",
                                    actor: {
                                      connect: {
                                        where: {
                                          node: {
                                            name: "Kate"
                                          }
                                        },
                                        edge: {
                                          screenTime: 100
                                        },
                                        connect: {
                                          movies: [
                                            {
                                              where: {
                                                node: {
                                                  title: "Titanic"
                                                }
                                              },
                                              edge: {
                                                screenTime: 200
                                              }
                                            }
                                          ]
                                        }
                                      }
                                    },
                                    director: {
                                      ${typeActor.name}: {
                                        connect: {
                                          where: {
                                            node: {
                                              name: "John"
                                            }
                                          },
                                          edge: {
                                            year: 2010
                                          }
                                        }
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

        await delay(2);
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

    test("connect via create - 1:1", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeMovie, typePerson, typeInfluencer }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typePerson.operations.create}(
                            input: [
                                {
                                    name: "Ken",
                                    reputation: 10
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
                        ${typeActor.operations.create}(
                            input: [
                                {
                                    name: "Kate"
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

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Avatar 2",
                                    director: {
                                      ${typePerson.name}: {
                                        connect: {
                                          where: {
                                            node: {
                                              name: "Ken"
                                            }
                                          },
                                          edge: {
                                            year: 2021
                                          }
                                        }
                                      }
                                    },
                                    actor: {
                                      connect: {
                                        where: {
                                          node: {
                                            name: "Kate"
                                          }
                                        },
                                        edge: {
                                          screenTime: 10
                                        }
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

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeInfluencer.operations.create}(
                            input: [
                                {
                                    reputation: 10,
                                    url: "/bob",
                                    movieReviewed: {
                                      connect: {
                                        where: {
                                          node: {
                                            title: "Avatar 2"
                                          }
                                        },
                                        edge: {
                                          score: 100
                                        }
                                      }
                                    }
                                }
                            ]
                        ) {
                            ${typeInfluencer.plural} {
                                url
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await delay(2);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);
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

    test("connect via connectOrCreate - 1:*", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeMovie, typePerson, typeInfluencer }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                  name: "Kate",
                                  id: 2
                                }, 
                                {
                                  name: "John",
                                  id: 3
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

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeMovie.operations.create}(
                            input: [
                                {
                                    title: "Titanic",
                                    director: {
                                      ${typeActor.name}: {
                                        connectOrCreate: {
                                          where: {
                                            node: {
                                              id: 2
                                            }
                                          },
                                          onCreate: {
                                            node: {
                                              name: "Kate"
                                            },
                                            edge: {
                                              year: 2010
                                            }
                                          }
                                        }
                                      }
                                    },
                                    actor: {
                                      connectOrCreate: {
                                        where: {
                                          node: {
                                            id: 3
                                          }
                                        },
                                        onCreate: {
                                          node: {
                                            name: "John"
                                          },
                                          edge: {
                                            screenTime: 100
                                          }
                                        }
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

        await delay(2);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);
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

    test("connect via connectOrCreate - 1:1", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeMovie, typePerson, typeInfluencer }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                  name: "Kate",
                                  id: 2
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

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeInfluencer.operations.create}(
                            input: [
                                {
                                    reputation: 100,
                                    url: "/june",
                                    movieReviewed: {
                                      create: {
                                        node: {
                                          title: "Avatar",
                                          actor: {
                                            connect: {
                                              where: {
                                                node: {
                                                  name: "Kate"
                                                }
                                              },
                                              edge: {
                                                screenTime: 100
                                              }
                                            }
                                          },
                                          director: {
                                            ${typeActor.name}: {
                                              connect: {
                                                where: {
                                                  node: {
                                                    name: "Kate"
                                                  }
                                                },
                                                edge: {
                                                  year: 2020
                                                }
                                              }
                                            }
                                          }
                                        },
                                        edge: {
                                          score: 9
                                        }
                                      }
                                    }
                                  }
                            ]
                        ) {
                            ${typeInfluencer.plural} {
                                url
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
                                    title: "Titanic",
                                    director: {
                                      ${typeActor.name}: {
                                        connectOrCreate: {
                                          where: {
                                            node: {
                                              id: 2
                                            }
                                          },
                                          onCreate: {
                                            node: {
                                              name: "Kate"
                                            },
                                            edge: {
                                              year: 2010
                                            }
                                          }
                                        }
                                      }
                                    },
                                    actor: {
                                      connectOrCreate: {
                                        where: {
                                          node: {
                                            id: 3
                                          }
                                        },
                                        onCreate: {
                                          node: {
                                            name: "John"
                                          },
                                          edge: {
                                            screenTime: 100
                                          }
                                        }
                                      }
                                    },
                                    reviewer: {
                                      connect: {
                                        edge: {
                                          score: 10
                                        },
                                        where: {
                                          node: {
                                            reputation: 100
                                          }
                                        },
                                        connect: {
                                          _on: {
                                            ${typeInfluencer.name}: [
                                              {
                                                movieReviewed: {
                                                  where: {
                                                    node: {
                                                      title: "Titanic"
                                                    }
                                                  },
                                                  edge: {
                                                    score: 9
                                                  }
                                                }
                                              }
                                            ]
                                          }
                                        }
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

        await delay(2);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);
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

    test("connect via update-connect  - 1:*", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeMovie, typePerson, typeInfluencer }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                  name: "Robin Williams",
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

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typePerson.operations.create}(
                            input: [
                                {
                                    name: "Sam",
                                    reputation: 11
                                  },
                                  {
                                    name: "Brad",
                                    reputation: 12
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
                                    title: "Good Will Hunting",
                                    director: {
                                      ${typePerson.name}: {
                                        connect: {
                                          edge: {
                                            year: 1990
                                          },
                                          where: {
                                            node: {
                                              name: "Sam"
                                            }
                                          }
                                        }
                                      }
                                    },
                                    actor: {
                                      connect: {
                                        edge: {
                                          screenTime: 200
                                        },
                                        where: {
                                          node: {
                                            name: "Robin Williams"
                                          }
                                        }
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

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typePerson.operations.update}(
                            where: {
                              name: "Brad"
                            },
                            connect: {
                              movies: [
                                {
                                  edge: {
                                    score: 15
                                  },
                                  where: {
                                    node: {
                                      title: "Good Will Hunting"
                                    }
                                  },
                                  connect: [
                                    {
                                      reviewer: {
                                        edge: {
                                          score: 10
                                        },
                                        where: {
                                          node: {
                                            _on: {
                                              ${typePerson.name}: {
                                                reputation: 11
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  ]
                                }
                              ]
                            }
                        ) {
                            ${typePerson.plural} {
                                name
                            }
                        }
                    }
                `,
            })
            .expect(200);

        await delay(2);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);
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

    test.only("connect via update-connect  - 1:1", async () => {
        await wsClient.subscribe(actorSubscriptionQuery(typeActor));

        await wsClient2.subscribe(movieSubscriptionQuery({ typeMovie, typePerson, typeInfluencer }));

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeActor.operations.create}(
                            input: [
                                {
                                  name: "Robin Williams",
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

        await supertest(server.path)
            .post("")
            .send({
                query: `
                    mutation {
                        ${typeInfluencer.operations.create}(
                            input: [
                                {
                                    url: "/Sam",
                                    reputation: 11
                                  },
                                  {
                                    url: "/Brad",
                                    reputation: 12
                                  },
                            ]
                        ) {
                            ${typeInfluencer.plural} {
                                url
                            }
                        }
                    }
                `,
            })
            .expect(200);

        // await supertest(server.path)
        //     .post("")
        //     .send({
        //         query: `
        //             mutation {
        //                 ${typeMovie.operations.create}(
        //                     input: [
        //                         {
        //                             title: "Good Will Hunting",
        //                             director: {
        //                               ${typeActor.name}: {
        //                                 connect: {
        //                                   edge: {
        //                                     year: 1990
        //                                   },
        //                                   where: {
        //                                     node: {
        //                                       name: "Robin Williams"
        //                                     }
        //                                   }
        //                                 }
        //                               }
        //                             },
        //                             actor: {
        //                               connect: {
        //                                 edge: {
        //                                   screenTime: 200
        //                                 },
        //                                 where: {
        //                                   node: {
        //                                     name: "Robin Williams"
        //                                   }
        //                                 }
        //                               }
        //                             }
        //                           }
        //                     ]
        //                 ) {
        //                     ${typeMovie.plural} {
        //                         title
        //                     }
        //                 }
        //             }
        //         `,
        //     })
        //     .expect(200);

        // await supertest(server.path)
        //     .post("")
        //     .send({
        //         query: `
        //             mutation {
        //                 ${typeInfluencer.operations.update}(
        //                     where: {
        //                       url: "/Brad"
        //                     },
        //                     connect: {
        //                       movies: [
        //                         {
        //                           edge: {
        //                             score: 15
        //                           },
        //                           where: {
        //                             node: {
        //                               title: "Good Will Hunting"
        //                             }
        //                           },
        //                           connect: [
        //                             {
        //                               reviewer: {
        //                                 edge: {
        //                                   score: 10
        //                                 },
        //                                 where: {
        //                                   node: {
        //                                     _on: {
        //                                       ${typeInfluencer.name}: {
        //                                         reputation: 11
        //                                       }
        //                                     }
        //                                   }
        //                                 }
        //                               }
        //                             }
        //                           ]
        //                         }
        //                       ]
        //                     }
        //                 ) {
        //                     ${typeInfluencer.plural} {
        //                         url
        //                     }
        //                 }
        //             }
        //         `,
        //     })
        //     .expect(200);

        // console.log(r.error);

        await delay(2);
        expect(wsClient.errors).toEqual([]);
        expect(wsClient2.errors).toEqual([]);
        expect(wsClient2.events).toHaveLength(1);
        expect(wsClient.events).toHaveLength(1);
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

    // connect via update-update - 1:*

    // connect via update-create - 1:1
    // connect via update-create - 1:*
});
