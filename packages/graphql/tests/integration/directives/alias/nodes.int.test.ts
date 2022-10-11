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
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { generateUniqueType, UniqueType } from "../../../utils/graphql-types";
import { cleanNodes } from "../../../utils/clean-nodes";

describe("@alias directive", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;

    let typeMovie: UniqueType;
    let typeDirector: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        typeMovie = generateUniqueType("Movie");
        typeDirector = generateUniqueType("Director");

        const typeDefs = `
            type ${typeDirector} {
                name: String
                nameAgain: String @alias(property: "name")
                movies: [${typeMovie}!]! @relationship(direction: OUT, type: "DIRECTED", properties: "Directed")
            }

            interface Directed @relationshipProperties {
                year: Int!
                movieYear: Int @alias(property: "year")
            }

            type ${typeMovie} {
                title: String
                titleAgain: String @alias(property: "title")
                directors: [${typeDirector}!]! @relationship(direction: IN, type: "DIRECTED", properties: "Directed")
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
        await cleanNodes(session, [typeMovie, typeDirector]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Create mutation with alias referring to existing field, include both fields as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.create}(input: [{ name: "Tim Burton", nameAgain: "Timmy Burton" }]) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.create]?.[typeDirector.plural]).toBeUndefined();
    });
    test("Create mutation with alias referring to existing field, include only field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.create}(input: [{ name: "Tim Burton" }]) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.create]?.[typeDirector.plural]).toEqual([
            {
                name: "Tim Burton",
                nameAgain: "Tim Burton",
            },
        ]);
    });
    test("Create mutation with alias referring to existing field, include only alias field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.create}(input: [{ nameAgain: "Timmy Burton" }]) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.create]?.[typeDirector.plural]).toEqual([
            {
                name: "Timmy Burton",
                nameAgain: "Timmy Burton",
            },
        ]);
    });
    test("Create mutation with alias referring to existing field, include both bad and good inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.create}(input: [{ name: "Tim Burton", nameAgain: "Timmy Burton" }, { name: "Someone" }]) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.create]?.[typeDirector.plural]).toBeUndefined();
    });
    test("Create mutation with alias on connection referring to existing field, include only field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.create}(input:[{
                    name: "Tim Burton",
                    movies: {
                        create: [{
                            node: {
                                title: "One",  
                            },
                            edge: {
                                year: 2000
                            }
                        }]
                    }
                }]) {
                    ${typeDirector.plural} {
                        name
                        movies {
                            title
                        }
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.create]?.[typeDirector.plural]).toEqual([
            {
                name: "Tim Burton",
                movies: [
                    {
                        title: "One",
                    },
                ],
            },
        ]);
    });
    test("Create mutation with alias on connection referring to existing field, include both field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.create}(input:[{
                    name: "Tim Burton",
                    movies: {
                        create: [{
                            node: {
                                title: "One",  
                                titleAgain: "Onee"
                            },
                            edge: {
                                year: 2000
                            }
                        }]
                    }
                }]) {
                    ${typeDirector.plural} {
                        name
                        movies {
                            title
                        }
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.create]?.[typeDirector.plural]).toBeUndefined();
    });
    test("Create mutation with alias on nested connection referring to existing field, include only field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.create}(input:[{
                    name: "Tim Burton",
                    movies: {
                        create: [{
                            node: {
                                title: "Two",
                                directors: {
                                    create: [{
                                        node: {
                                            name: "Tim"
                                        }, 
                                        edge: {
                                            year: 2011
                                        }
                                    }]
                                }  
                            },
                            edge: {
                                year: 2010
                            }
                        }]
                    }
                }]) {
                    ${typeDirector.plural} {
                        name
                        movies {
                            title
                            directors {
                                name
                            }
                        }
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
    test("Create mutation with alias on nested connection referring to existing field, include both field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.create}(input:[{
                    name: "Tim Burton",
                    movies: {
                        create: [{
                            node: {
                                title: "Two",
                                directors: {
                                    create: [{
                                        node: {
                                            name: "Tim",
                                            nameAgain: "Timmy"
                                        }, 
                                        edge: {
                                            year: 2011
                                        }
                                    }]
                                }  
                            },
                            edge: {
                                year: 2010
                            }
                        }]
                    }
                }]) {
                    ${typeDirector.plural} {
                        name
                        movies {
                            title
                            directors {
                                name
                            }
                        }
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.create]?.[typeDirector.plural]).toBeUndefined();
    });

    test("Update mutation with alias referring to existing field, include both fields as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.update}(where: {name_CONTAINS: "Tim"}, update: { name: "Tim Burton", nameAgain: "Timmy Burton" }) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.update]?.[typeDirector.plural]).toBeUndefined();
    });
    test("Update mutation with alias referring to existing field, include only alias field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.update}(where: {name_CONTAINS: "Timmy"}, update: { nameAgain: "El Timmy Burton" }) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
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
    test("Update mutation with alias referring to existing field, include connection and both fields as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.update}(
                    where: {name_CONTAINS: "Tim"}, 
                    update: { 
                        name: "Tim Burton", 
                        nameAgain: "Timmy Burton", 
                        movies: [{
                            update: {
                                node: {
                                    title: "Three",
                                },
                                edge: {
                                    year: 2010
                                }
                            }
                        }] 
                    }
                ) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.update]?.[typeDirector.plural]).toBeUndefined();
    });
    test("Update mutation with alias on connection referring to existing field, include only field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.update}(
                    update: {
                      name: "Tim",
                      movies: [
                        {
                          update: {
                            node: {
                              title: "Mv",
                            }
                          }
                        }
                      ]
                    }
                  ) {
                    ${typeDirector.plural} {
                        name
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
    test("Update mutation with alias on connection referring to existing field, include both field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.update}(where: {name_CONTAINS: "Tim Burton"}, update:{
                    name: "Tim Burton",
                    movies: [{
                        update: {
                            node: {
                                title: "One",
                                titleAgain: "Onee"
                            },
                            edge: {
                                year: 2010
                            }
                        }
                    }]
                }) {
                    ${typeDirector.plural} {
                        name
                        movies {
                            title
                        }
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.update]?.[typeDirector.plural]).toBeUndefined();
    });
    test("Update mutation with alias on connection referring to existing field, include both bad and good field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.update}(where: {name_CONTAINS: "Tim Burton"}, update:{
                    name: "Tim Burton",
                    movies: [{
                        update: {
                            node: {
                                title: "Three",
                            },
                            edge: {
                                year: 2010
                            }
                        }
                    },
                    {
                        update: {
                            node: {
                                title: "One",
                                titleAgain: "Onee"
                            },
                            edge: {
                                year: 2010
                            }
                        }
                    }]
                }) {
                    ${typeDirector.plural} {
                        name
                        movies {
                            title
                        }
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.update]?.[typeDirector.plural]).toBeUndefined();
    });
    test("Update mutation with alias on nested connection referring to existing field, include only field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.update}(where: {name_CONTAINS: "Tim Burton"}, update:{
                    name: "Tim Burton",
                    movies: [{
                        update: {
                            node: {
                                title: "Two",
                                directors: [{
                                    update: {
                                        node: {
                                            nameAgain: "Timmy"
                                        }, 
                                        edge: {
                                            year: 2011
                                        }
                                    }
                                } ] 
                            },
                            edge: {
                                year: 2010
                            }
                        }
                    }]
                }) {
                    ${typeDirector.plural} {
                        name
                        movies {
                            title
                            directors {
                                name
                            }
                        }
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
    test("Update mutation with alias on nested connection referring to existing field, include both field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.update}(where: {name_CONTAINS: "Tim Burton"}, update:{
                    name: "Tim Burton",
                    movies: [{
                        update: {
                            node: {
                                title: "Two",
                                directors: [{
                                    update: {
                                        node: {
                                            name: "Tim",
                                            nameAgain: "Timmy"
                                        }, 
                                        edge: {
                                            year: 2011
                                        }
                                    }
                                } ] 
                            },
                            edge: {
                                year: 2010
                            }
                        }
                    }]
                }) {
                    ${typeDirector.plural} {
                        name
                        movies {
                            title
                            directors {
                                name
                            }
                        }
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.update]?.[typeDirector.plural]).toBeUndefined();
    });

    test("Update mutation nested with create with alias referring to existing field, include only alias field as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.update}(
                    where: {name_CONTAINS: "Timmy"}, 
                    update: {
                      name: "The Timmy",
                      movies: [
                        {
                          create: [
                            {
                              node: {
                                title: "Timmy's Movie",
                                directors: {
                                    create: [
                                      {
                                        node: {
                                          name: "The Other Director",
                                          movies: {
                                            create: [
                                              {
                                                node: {
                                                  titleAgain: "The Other's Movie",
                                                  title: "Ooops"
                                                },
                                                edge: {
                                                  year: 2000
                                                }
                                              }
                                            ]
                                          }
                                        },
                                        edge: {
                                          year: 1900
                                        }
                                      }
                                    ]
                                  }
                              },
                              edge: {
                                year: 1999
                              }
                            }
                          ]
                        }
                      ]
                    }) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.update]?.[typeDirector.plural]).toBeUndefined();
    });
    test("Update mutation (with create) with alias referring to existing field, include both fields as inputs", async () => {
        const userMutation = `
            mutation {
                ${typeDirector.operations.update}(where: {name_CONTAINS: "Timmy"}, create: { movies: [{ node: { title: "Movie", titleAgain: "El Movie" }, edge: { year: 1989 } }] }) {
                    ${typeDirector.plural} {
                        name
                        nameAgain
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
        expect((gqlResult?.data as any)?.[typeDirector.operations.update]?.[typeDirector.plural]).toBeUndefined();
    });
});
