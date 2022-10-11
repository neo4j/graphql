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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import { generateUniqueType, UniqueType } from "../../../utils/graphql-types";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { cleanNodes } from "../../../utils/clean-nodes";

describe("@alias directive", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    let typeActor: UniqueType;
    let typeMovie: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
        typeMovie = generateUniqueType("Movie");
        typeActor = generateUniqueType("Actor");

        const typeDefs = `
            type ${typeActor} {
                name: String!
                nameAgain: String @alias(property: "name")
                movies: [${typeMovie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
            
            type ${typeMovie} {
                title: String
                titleAgain: String @alias(property: "title")
                id: ID! @id
                actors: [${typeActor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [typeMovie, typeActor]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Update mutation with top-level connectOrCreate alias referring to existing field, include both fields as inputs", async () => {
        const query = `
            mutation {
              ${typeActor.operations.update}(
                update: {
                    name: "Tom Hanks 2"
                },
                connectOrCreate: {
                    movies: {
                        where: { node: { id: 5 } }
                        onCreate: { node: { title: "The Terminal", titleAgain: "oops" } }
                    }
                }
                where: { name: "Tom Hanks"}
              ) {
                ${typeActor.plural} {
                  name
                }
              }
            }
            `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0].message).toBe(
            `Conflicting modification of the same database property multiple times`
        );
    });

    test("Create mutation with alias referring to existing field, include only field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeActor.operations.create}(input: {
                    name: "Tom Hanks",
                    movies: {
                        connectOrCreate: {
                            where: { node: { id: "1234" } }
                            onCreate: { node: { title: "Forrest Gump" } }
                        }
                    }
                }) {
                info {
                    nodesCreated
                }
            }
        }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult?.data as any)?.[typeActor.operations.create]?.info.nodesCreated).toBe(2);
    });
    test("Create mutation with alias referring to existing field, include only alias as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeActor.operations.create}(input: {
                    name: "Hanks",
                    movies: {
                        connectOrCreate: {
                            where: { node: { id: "2341" } }
                            onCreate: { node: { titleAgain: "Forrest Run" } }
                        }
                    }
                }) {
                info {
                    nodesCreated
                }
            }
        }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult?.data as any)?.[typeActor.operations.create]?.info.nodesCreated).toBe(2);
    });
    test("Create mutation with alias referring to existing field, include both fields as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeActor.operations.create}(input: {
                    name: "Tom Hanks",
                    movies: {
                        connectOrCreate: {
                            where: { node: { id: "3412" } }
                            onCreate: { node: { title: "Forrest Gump", titleAgain: "Forrest G" } }
                        }
                    }
                }) {
                info {
                    nodesCreated
                }
            }
        }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0].message).toBe(
            `Conflicting modification of the same database property multiple times`
        );
        expect((gqlResult?.data as any)?.[typeActor.operations.create]?.actors).toBeUndefined();
    });

    test("Update mutation with alias referring to existing field, include only one field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeActor.operations.update}(update: {
                    name: "a",
                    movies: [
                      {
                        connectOrCreate: [
                          {
                            onCreate: {
                              node: {
                                title: "b"
                              }
                            },
                            where: {
                              node: {
                                id: "123"
                              }
                            }
                          }
                        ]
                      }
                    ]
                  }) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
    });
    test("Update mutation with alias referring to existing field, include both fields as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeActor.operations.update}(update: {
                    name: "a",
                    movies: [
                      {
                        connectOrCreate: [
                          {
                            onCreate: {
                              node: {
                                title: "b",
                                titleAgain: "bad"
                              }
                            },
                            where: {
                              node: {
                                id: "123"
                              }
                            }
                          }
                        ]
                      }
                    ]
                }) {
                    info {
                        nodesCreated
                    }
                }
            }`;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0].message).toBe(
            `Conflicting modification of the same database property multiple times`
        );
        expect((gqlResult?.data as any)?.[typeActor.operations.update]?.info).toBeUndefined();
    });
    test("Update mutation nested with create, alias referring to existing field, include both fields as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeActor.operations.update}(update: {
                    name: "a",
                    movies: [
                        {
                            update: {
                              node: {
                                title: "b",
                                actors: [
                                  {
                                    create: [
                                      {
                                        node: {
                                          name: "c",
                                          movies: {
                                            connectOrCreate: [
                                              {
                                                onCreate: {
                                                  node: {
                                                    title: "d",
                                                    titleAgain: "bad"
                                                  }
                                                },
                                                where: {
                                                  node: {
                                                    id: "1"
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
                              }
                            }
                          }
                    ]
                }) {
                    info {
                        nodesCreated
                    }
                }
            }`;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(gqlResult.errors).toHaveLength(1);
        expect(gqlResult.errors?.[0].message).toBe(
            `Conflicting modification of the same database property multiple times`
        );
        expect((gqlResult?.data as any)?.[typeActor.operations.update]?.info).toBeUndefined();
    });
    test("Update mutation nested with create, alias referring to existing field, include only one field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeActor.operations.update}(update: {
                    name: "a",
                    movies: [
                        {
                            update: {
                              node: {
                                title: "b",
                                actors: [
                                  {
                                    create: [
                                      {
                                        node: {
                                          name: "c",
                                          movies: {
                                            connectOrCreate: [
                                              {
                                                onCreate: {
                                                  node: {
                                                    title: "d",
                                                  }
                                                },
                                                where: {
                                                  node: {
                                                    id: "1"
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
                              }
                            }
                          }
                    ]
                }) {
                    info {
                        nodesCreated
                    }
                }
            }`;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(gqlResult.errors).toBeUndefined();
    });
});
