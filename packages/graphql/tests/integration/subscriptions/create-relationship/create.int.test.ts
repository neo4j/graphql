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

import { TestSubscriptionsEngine } from "../../../utils/TestSubscriptionsEngine";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Subscriptions connect with create", () => {
    const testHelper = new TestHelper();
    let plugin: TestSubscriptionsEngine;

    let typeDefs: string;
    let typeActor: UniqueType;
    let typeMovie: UniqueType;
    let typePerson: UniqueType;
    let typeInfluencer: UniqueType;

    beforeEach(async () => {
        plugin = new TestSubscriptionsEngine();
        typeActor = testHelper.createUniqueType("Actor");
        typeMovie = testHelper.createUniqueType("Movie");
        typePerson = testHelper.createUniqueType("Person");
        typeInfluencer = testHelper.createUniqueType("Influencer");

        typeDefs = `
            type ${typeMovie} {
                id: ID!
                title: String!
                actors: [${typeActor}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: [Director!]! @relationship(type: "DIRECTED", properties: "Directed", direction: IN)
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                
            }
            
            type ${typeActor} {
                id: ID!
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
                id: ID!
                name: String!
                reputation: Int!
            }
            
            type ${typeInfluencer} implements Reviewer {
                id: ID!
                reputation: Int!
                url: String!
            }
            
            union Director = ${typePerson} | ${typeActor}
            
            interface Reviewer {
                reputation: Int!

            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: plugin,
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
        plugin.close();
    });

    test("creates nested connection to normal type", async () => {
        const query = `
        mutation {
            ${typeActor.operations.create}(
                input: [
                    {
                        id: 1
                        name: "Actor 1"
                        movies: { 
                            create: [{ 
                                node: { 
                                    id: 11
                                    title: "Movie 1", 
                                    actors: { 
                                        create: [{ 
                                            node: { 
                                                id: 2
                                                name: "Actor 2" 
                                            },
                                            edge: {
                                                screenTime: 199
                                            }
                                        }] 
                                    } 
                                },
                                edge: {
                                    screenTime: 100
                                } 
                            }] 
                        }
                    }
                    {
                        id: 3
                        name: "Actor 3"
                        movies: { 
                            create: [{ 
                                node: { 
                                    id: 12
                                    title: "Movie 2", 
                                    actors: { 
                                        create: [{ 
                                            node: { 
                                                id: 4
                                                name: "Actor 4" 
                                            },
                                            edge: {
                                                screenTime: 90
                                            }
                                        }] 
                                    } 
                                },
                                edge: {
                                    screenTime: 202
                                } 
                            }] 
                        }
                    }
                ]
            ) {
                ${typeActor.plural} {
                    name
                    movies {
                        title
                    }
                }
            }
        }
        `;

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "Actor 1",
                            id: "1",
                        },
                        to: {
                            title: "Movie 1",
                            id: "11",
                        },
                        relationship: {
                            screenTime: 100,
                        },
                    },
                    relationshipName: "ACTED_IN",
                    fromTypename: typeActor.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "Actor 2",
                            id: "2",
                        },
                        to: {
                            title: "Movie 1",
                            id: "11",
                        },
                        relationship: {
                            screenTime: 199,
                        },
                    },
                    relationshipName: "ACTED_IN",
                    fromTypename: typeActor.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "Actor 3",
                            id: "3",
                        },
                        to: {
                            title: "Movie 2",
                            id: "12",
                        },
                        relationship: {
                            screenTime: 202,
                        },
                    },
                    relationshipName: "ACTED_IN",
                    fromTypename: typeActor.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "Actor 4",
                            id: "4",
                        },
                        to: {
                            title: "Movie 2",
                            id: "12",
                        },
                        relationship: {
                            screenTime: 90,
                        },
                    },
                    relationshipName: "ACTED_IN",
                    fromTypename: typeActor.name,
                    toTypename: typeMovie.name,
                },
            ])
        );
    });

    test("creates connection to union type", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.create}(
                input: [
                    {
                        id: "11"
                        title: "Movie",
                        directors: {
                          ${typeActor}: {
                            create: [
                              {
                                node: {
                                    id: "1"
                                    name: "ActorDirector"
                                },
                                edge: {
                                  year: 1999
                                }
                              }
                            ]
                          },
                          ${typePerson}: {
                            create: [
                              {
                                node: {
                                    id: "2"
                                    name: "PersonDirector",
                                    reputation: 100
                                },
                                edge: {
                                  year: 1990
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
                    directors {
                        ... on ${typePerson.name} {
                          name
                          reputation
                        }
                        ... on ${typeActor.name} {
                          name
                        }
                      }
                }
            }
        }
        `;

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "ActorDirector",
                            id: "1",
                        },
                        to: {
                            title: "Movie",
                            id: "11",
                        },
                        relationship: {
                            year: 1999,
                        },
                    },
                    relationshipName: "DIRECTED",
                    fromTypename: typeActor.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "PersonDirector",
                            reputation: 100,
                            id: "2",
                        },
                        to: {
                            title: "Movie",
                            id: "11",
                        },
                        relationship: {
                            year: 1990,
                        },
                    },
                    relationshipName: "DIRECTED",
                    fromTypename: typePerson.name,
                    toTypename: typeMovie.name,
                },
            ])
        );
    });

    test("creates connection to interface type", async () => {
        const query = `
        mutation {
            ${typeMovie.operations.create}(
                input: [
                    {
                        id: "11"
                        title: "Movie",
                        reviewers: {
                            create: [
                              {
                                node: {
                                    ${typePerson}: {
                                        id: "1"
                                        name: "PersonReviewer"
                                        reputation: 420
                                    },
                                    ${typeInfluencer}: {
                                        id: "2"
                                        url: "dummy"
                                        reputation: 1
                                    }
                                },
                                edge: {
                                  score: 42
                                }
                              }
                            ]
                        }
                      }
                ]
            ) {
                ${typeMovie.plural} {
                    title
                    reviewers {
                      reputation
                      ... on ${typeInfluencer} {
                        url
                      }
                      ... on ${typePerson} {
                        name
                      }
                    }
                }
            }
        }
        `;

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "PersonReviewer",
                            id: "1",
                            reputation: 420,
                        },
                        to: {
                            title: "Movie",
                            id: "11",
                        },
                        relationship: {
                            score: 42,
                        },
                    },
                    relationshipName: "REVIEWED",
                    fromTypename: typePerson.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            reputation: 1,
                            id: "2",
                            url: "dummy",
                        },
                        to: {
                            title: "Movie",
                            id: "11",
                        },
                        relationship: {
                            score: 42,
                        },
                    },
                    relationshipName: "REVIEWED",
                    fromTypename: typeInfluencer.name,
                    toTypename: typeMovie.name,
                },
            ])
        );
    });

    test("nested create with connection include normal, union, interface types", async () => {
        const query = `
        mutation {
            ${typeActor.operations.create}(
                input: [
                  {
                    id: 1
                    name: "Actor",
                    movies: {
                      create: [
                        {
                          edge: {
                            screenTime: 10
                          },
                          node: {
                            id: 11
                            title: "Movie",
                            reviewers: {
                              create: [
                                {
                                  edge: {
                                    score: 10
                                  },
                                  node: {
                                    ${typePerson}: {
                                        id: 2
                                        name: "PersonReviewer"
                                        reputation: 142
                                    },
                                    ${typeInfluencer}: {
                                        id: 3
                                        url: "InfluencerReviewerUrl"
                                        reputation: 0
                                    }
                                  }
                                }
                              ]
                            },
                            directors: {
                              ${typeActor}: {
                                create: [
                                  {
                                    node: {
                                      id: 4
                                      name: "ActorDirector",
                                      movies: {
                                        create: [
                                          {
                                            edge: {
                                              screenTime: 360
                                            },
                                            node: {
                                              id: 12
                                              title: "Other Movie",
                                              directors: {
                                                ${typeActor}: {
                                                  create: [
                                                    {
                                                      edge: {
                                                        year: 1990
                                                      },
                                                      node: {
                                                        id: 5
                                                        name: "OtherActorDirector"
                                                      }
                                                    }
                                                  ]
                                                },
                                                ${typePerson}: {
                                                  create: [
                                                    {
                                                      edge: {
                                                        year: 1990
                                                      },
                                                      node: {
                                                        id: 6
                                                        name: "OtherPersonDirector"
                                                        reputation: 120
                                                      }
                                                    }
                                                  ]
                                                }
                                              }
                                            }
                                          }
                                        ]
                                      }
                                    },
                                    edge: {
                                      year: 2020
                                    }
                                  }
                                ]
                              },
                              ${typePerson}: {
                                create: [
                                  {
                                    edge: {
                                      year: 2000
                                    },
                                    node: {
                                      id: 7
                                      name: "PersonDirector"
                                      reputation: 100
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
        `;

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(plugin.eventList).toEqual(
            expect.arrayContaining([
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "PersonDirector",
                            id: "7",
                            reputation: 100,
                        },
                        to: {
                            title: "Movie",
                            id: "11",
                        },
                        relationship: {
                            year: 2000,
                        },
                    },
                    relationshipName: "DIRECTED",
                    fromTypename: typePerson.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "ActorDirector",
                            id: "4",
                        },
                        to: {
                            title: "Movie",
                            id: "11",
                        },
                        relationship: {
                            year: 2020,
                        },
                    },
                    relationshipName: "DIRECTED",
                    fromTypename: typeActor.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "ActorDirector",
                            id: "4",
                        },
                        to: {
                            title: "Other Movie",
                            id: "12",
                        },
                        relationship: {
                            screenTime: 360,
                        },
                    },
                    relationshipName: "ACTED_IN",
                    fromTypename: typeActor.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "OtherActorDirector",
                            id: "5",
                        },
                        to: {
                            title: "Other Movie",
                            id: "12",
                        },
                        relationship: {
                            year: 1990,
                        },
                    },
                    relationshipName: "DIRECTED",
                    fromTypename: typeActor.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "OtherPersonDirector",
                            id: "6",
                            reputation: 120,
                        },
                        to: {
                            title: "Other Movie",
                            id: "12",
                        },
                        relationship: {
                            year: 1990,
                        },
                    },
                    relationshipName: "DIRECTED",
                    fromTypename: typePerson.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "PersonReviewer",
                            id: "2",
                            reputation: 142,
                        },
                        to: {
                            title: "Movie",
                            id: "11",
                        },
                        relationship: {
                            score: 10,
                        },
                    },
                    relationshipName: "REVIEWED",
                    fromTypename: typePerson.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            url: "InfluencerReviewerUrl",
                            id: "3",
                            reputation: 0,
                        },
                        to: {
                            title: "Movie",
                            id: "11",
                        },
                        relationship: {
                            score: 10,
                        },
                    },
                    relationshipName: "REVIEWED",
                    fromTypename: typeInfluencer.name,
                    toTypename: typeMovie.name,
                },
                {
                    id: expect.any(String),
                    id_from: expect.any(String),
                    id_to: expect.any(String),
                    timestamp: expect.any(Number),
                    event: "create_relationship",
                    properties: {
                        from: {
                            name: "Actor",
                            id: "1",
                        },
                        to: {
                            title: "Movie",
                            id: "11",
                        },
                        relationship: {
                            screenTime: 10,
                        },
                    },
                    relationshipName: "ACTED_IN",
                    fromTypename: typeActor.name,
                    toTypename: typeMovie.name,
                },
            ])
        );
    });
});
