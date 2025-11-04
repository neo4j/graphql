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

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("integration/rfc/003", () => {
    const testHelper = new TestHelper();
    let Director: UniqueType;
    let Movie: UniqueType;
    let CoDirector: UniqueType;
    let Address: UniqueType;

    beforeEach(() => {
        Director = testHelper.createUniqueType("Director");
        Movie = testHelper.createUniqueType("Movie");
        CoDirector = testHelper.createUniqueType("CoDirector");
        Address = testHelper.createUniqueType("Address");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("one-to-one", () => {
        describe("create", () => {
            test("should throw when creating node without a required relationship", async () => {
                const typeDefs = /* GraphQL */ `
                    type ${Director} {
                        id: ID!
                    }

                    type ${Movie} {
                        id: ID!
                        director: ${Director}! @relationship(type: "DIRECTED", direction: IN)
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${Movie.operations.create}(input: [{ id: "${movieId}" }]) {
                            info {
                                nodesCreated
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeTruthy();
                expect((result.errors as any[])[0].message).toBe(`${Movie}.director required exactly once`);
            });

            describe("nested mutations", () => {
                test("should throw when creating node without a required relationship", async () => {
                    const typeDefs = /* GraphQL */ `
                        type ${Address} {
                            street: String!
                        }

                        type ${Director} {
                            id: ID!
                            address: ${Address}! @relationship(type: "HAS_ADDRESS", direction: OUT)
                        }

                        type ${Movie} {
                            id: ID!
                            director: ${Director}! @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    await testHelper.initNeo4jGraphQL({ typeDefs });

                    const movieId = generate({
                        charset: "alphabetic",
                    });

                    const directorId = generate({
                        charset: "alphabetic",
                    });

                    const mutation = `
                        mutation {
                            ${Movie.operations.create}(input: [{ id: "${movieId}", director: { create: { node: { id: "${directorId}" } } } }]) {
                                info {
                                    nodesCreated
                                }
                            }
                        }
                    `;

                    const result = await testHelper.executeGraphQL(mutation);

                    expect(result.errors).toBeTruthy();
                    expect((result.errors as any[])[0].message).toBe(`${Director}.address required exactly once`);
                });
            });
        });

        describe("update", () => {
            test("should throw error when updating a node without a required relationship", async () => {
                const typeDefs = /* GraphQL */ `
                    type ${Director} {
                        id: ID!
                    }

                    type ${Movie} {
                        id: ID!
                        director: ${Director}! @relationship(type: "DIRECTED", direction: IN)
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${Movie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            info {
                                nodesCreated
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(`
                        CREATE (:${Movie} {id: "${movieId}"})
                    `);

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeTruthy();
                expect((result.errors as any[])[0].message).toBe(`${Movie}.director required exactly once`);
            });

            describe("nested mutations", () => {
                test("should throw when creating node without relationship", async () => {
                    const typeDefs = /* GraphQL */ `
                        type ${Address} {
                            street: String!
                        }

                        type ${Director} {
                            id: ID!
                            address: ${Address}! @relationship(type: "HAS_ADDRESS", direction: OUT)
                        }

                        type ${Movie} {
                            id: ID!
                            director: ${Director}! @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    await testHelper.initNeo4jGraphQL({ typeDefs });

                    const movieId = generate({
                        charset: "alphabetic",
                    });

                    const directorId = generate({
                        charset: "alphabetic",
                    });

                    const mutation = `
                        mutation {
                            ${Movie.operations.update}(
                              where: { id: "${movieId}" }
                              update: { director: { update: { node: { id: "${directorId}" } } } }
                            ) {
                              info {
                                nodesCreated
                              }
                            }
                        }
                    `;

                    await testHelper.executeCypher(`
                            CREATE (:${Movie} {id: "${movieId}"})<-[:DIRECTED]-(:${Director} { id: "${directorId}" })
                        `);

                    const result = await testHelper.executeGraphQL(mutation);

                    expect(result.errors).toBeTruthy();
                    expect((result.errors as any[])[0].message).toBe(`${Director}.address required exactly once`);
                });

                test("should throw error when creating a node without a required relationship through a nested mutation", async () => {
                    const typeDefs = /* GraphQL */ `
                        type ${Address} {
                            street: String!
                        }

                        type ${Director} {
                            id: ID!
                            address: ${Address}! @relationship(type: "HAS_ADDRESS", direction: OUT)
                        }

                        type ${Movie} {
                            id: ID!
                            director: ${Director}! @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    await testHelper.initNeo4jGraphQL({ typeDefs });

                    const movieId = generate({
                        charset: "alphabetic",
                    });

                    const directorId = generate({
                        charset: "alphabetic",
                    });

                    const mutation = `
                        mutation {
                            ${Movie.operations.update}(
                              where: { id: "${movieId}" }
                              update: { director: { create: { node: { id: "${directorId}" } } } }
                            ) {
                              info {
                                nodesCreated
                              }
                            }
                        }
                    `;

                    await testHelper.executeCypher(`
                            CREATE (:${Movie} {id: "${movieId}"})
                        `);

                    const result = await testHelper.executeGraphQL(mutation);

                    expect(result.errors).toBeTruthy();
                    expect((result.errors as any[])[0].message).toBe(`${Director}.address required exactly once`);
                });
            });
        });

        describe("delete", () => {
            describe("nested mutations", () => {
                test("should throw error when deleting a required relationship", async () => {
                    const typeDefs = /* GraphQL */ `
                        type ${Director} {
                            id: ID!
                        }

                        type ${CoDirector} {
                            id: ID!
                        }

                        type ${Movie} {
                            id: ID!
                            director: ${Director}! @relationship(type: "DIRECTED", direction: IN)
                            coDirector: ${CoDirector} @relationship(type: "CO_DIRECTED", direction: IN)
                        }
                    `;

                    await testHelper.initNeo4jGraphQL({ typeDefs });

                    const movieId = generate({
                        charset: "alphabetic",
                    });

                    const directorId = generate({
                        charset: "alphabetic",
                    });

                    const mutation = `
                        mutation {
                            ${Movie.operations.update}(
                                where: { id: "${movieId}" },
                                delete: { director: { where: { node: { id: "${directorId}" } } } }
                            ) {
                                info {
                                    nodesCreated
                                }
                            }
                        }
                    `;

                    await testHelper.executeCypher(`
                            CREATE (:${Movie} {id: "${movieId}"})<-[:DIRECTED]-(:${Director} {id: "${directorId}"})
                        `);

                    const result = await testHelper.executeGraphQL(mutation);

                    expect(result.errors).toBeTruthy();
                    expect((result.errors as any[])[0].message).toBe(`${Movie}.director required exactly once`);
                });
            });
        });

        describe("connect", () => {
            test("should throw error when connecting to a required relationship that is not found", async () => {
                const typeDefs = /* GraphQL */ `
                    type ${Director} {
                        id: ID!
                    }

                    type ${Movie} {
                        id: ID!
                        director: ${Director}! @relationship(type: "DIRECTED", direction: IN)
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const directorId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${Movie.operations.create}(input: [{ id: "${movieId}", director: { connect: { where: { node: { id: "${directorId}" } } } } }]) {
                            info {
                                nodesCreated
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeTruthy();
                expect((result.errors as any[])[0].message).toBe(`${Movie}.director required exactly once`);
            });

            describe("nested mutations", () => {
                test("should throw error when connecting to a required node that is not found", async () => {
                    const typeDefs = /* GraphQL */ `
                        type ${Address} {
                            street: String!
                        }

                        type ${Director} {
                            id: ID!
                            address: ${Address}! @relationship(type: "HAS_ADDRESS", direction: OUT)
                        }

                        type ${Movie} {
                            id: ID!
                            director: ${Director}! @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    await testHelper.initNeo4jGraphQL({ typeDefs });

                    const movieId = generate({
                        charset: "alphabetic",
                    });

                    const directorId = generate({
                        charset: "alphabetic",
                    });

                    const mutation = `
                        mutation {
                            ${Movie.operations.create}(
                              input: [
                                {
                                  id: "${movieId}"
                                  director: {
                                    connect: {
                                      where: { node: { id: "${directorId}" } }
                                      connect: { address: { where: { node: { street: "some-street" } } } }
                                    }
                                  }
                                }
                              ]
                            ) {
                              info {
                                nodesCreated
                              }
                            }
                        }
                    `;

                    await testHelper.executeCypher(`
                            CREATE (:${Director} {id: "${directorId}"})
                        `);

                    const result = await testHelper.executeGraphQL(mutation);

                    expect(result.errors).toBeTruthy();
                    expect((result.errors as any[])[0].message).toBe(`${Director}.address required exactly once`);
                });
            });
        });

        describe("disconnect", () => {
            describe("nested mutations", () => {
                test("should throw error when disconnecting a required relationship", async () => {
                    const typeDefs = /* GraphQL */ `
                        type ${Director} {
                            id: ID!
                        }

                        type ${Movie} {
                            id: ID!
                            director: ${Director}! @relationship(type: "DIRECTED", direction: IN)
                        }
                    `;

                    await testHelper.initNeo4jGraphQL({ typeDefs });

                    const movieId = generate({
                        charset: "alphabetic",
                    });

                    const directorId = generate({
                        charset: "alphabetic",
                    });

                    const mutation = `
                        mutation {
                            ${Movie.operations.update}(where: { id: "${movieId}" }, disconnect: { director: { where: { node: {  id: "${directorId}" } } } }) {
                                info {
                                    nodesCreated
                                }
                            }
                        }
                    `;

                    await testHelper.executeCypher(`
                            CREATE (:${Movie} {id: "${movieId}"})<-[:DIRECTED]-(:${Director} {id: "${directorId}"})
                        `);

                    const result = await testHelper.executeGraphQL(mutation);

                    expect(result.errors).toBeTruthy();
                    expect((result.errors as any[])[0].message).toBe(`${Movie}.director required exactly once`);
                });
            });
        });

        describe("reconnect", () => {
            test("should disconnect and then reconnect to a new node on a required relationship", async () => {
                const typeDefs = /* GraphQL */ `
                    type ${Director} {
                        id: ID!
                    }

                    type ${Movie} {
                        id: ID!
                        director: ${Director}! @relationship(type: "DIRECTED", direction: IN)
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const directorId1 = generate({
                    charset: "alphabetic",
                });

                const directorId2 = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${Movie.operations.update}(
                            where: { id: "${movieId}" },
                            disconnect: {
                                director: { where: { node: { id: "${directorId1}" } } }
                            }
                            connect: {
                                director: { where: { node: { id: "${directorId2}" } } }
                            }
                        ) {
                            ${Movie.plural} {
                                id
                                director {
                                    id
                                }
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(`
                        CREATE (:${Movie} {id: "${movieId}"})<-[:DIRECTED]-(:${Director} {id: "${directorId1}"})
                        CREATE (:${Director} {id: "${directorId2}"})
                    `);

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();

                const movie = (result.data as any)[Movie.operations.update][Movie.plural][0];

                expect(movie).toEqual({
                    id: movieId,
                    director: {
                        id: directorId2,
                    },
                });
            });

            test("should disconnect and then reconnect to a new node on a non required relationship", async () => {
                const typeDefs = /* GraphQL */ `
                    type ${Director} {
                        id: ID!
                    }

                    type ${Movie} {
                        id: ID!
                        director: ${Director} @relationship(type: "DIRECTED", direction: IN)
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const directorId1 = generate({
                    charset: "alphabetic",
                });

                const directorId2 = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${Movie.operations.update}(
                            where: { id: "${movieId}" },
                            disconnect: {
                                director: { where: { node: { id: "${directorId1}" } } }
                            }
                            connect: {
                                director: { where: { node: { id: "${directorId2}" } } }
                            }
                        ) {
                            ${Movie.plural} {
                                id
                                director {
                                    id
                                }
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(`
                        CREATE (:${Movie} {id: "${movieId}"})<-[:DIRECTED]-(:${Director} {id: "${directorId1}"})
                        CREATE (:${Director} {id: "${directorId2}"})
                    `);

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();

                const movie = (result.data as any)[Movie.operations.update][Movie.plural][0];

                expect(movie).toEqual({
                    id: movieId,
                    director: {
                        id: directorId2,
                    },
                });
            });
        });

        describe("relationship length", () => {
            test("should throw if connecting to more than one node", async () => {
                const typeDefs = /* GraphQL */ `
                    type ${Director} {
                        id: ID!
                    }

                    type ${Movie} {
                        id: ID!
                        director: ${Director} @relationship(type: "DIRECTED", direction: IN)
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const directorId1 = generate({
                    charset: "alphabetic",
                });

                const directorId2 = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${Movie.operations.update}(
                            where: { id: "${movieId}" },
                            connect: {
                                director: { where: { node: { id_IN: ["${directorId1}", "${directorId2}"] } } }
                            }
                        ) {
                            ${Movie.plural} {
                                id
                                director {
                                    id
                                }
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(`
                        CREATE (:${Movie} {id: "${movieId}"})
                        CREATE (:${Director} {id: "${directorId1}"})
                        CREATE (:${Director} {id: "${directorId2}"})
                    `);

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeTruthy();
                expect((result.errors as any[])[0].message).toBe(`${Movie}.director must be less than or equal to one`);
            });
        });
    });
});
