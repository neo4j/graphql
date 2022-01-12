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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("integration/rfs/003", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("One-to-* relationships", () => {
        test("No requirement to create or connect to a Target on the creation of a Source", async () => {
            const session = driver.session();

            const typeDefs = `
                type Source {
                    id: ID!
                    target: Target @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Target {
                    exampleField: String
                }
            `;

            const testId = generate({
                charset: "alphabetic",
                readable: true,
            });

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const graphqlQuery = `
                mutation {
                    createSources(input: [{ id: "${testId}" }]) {
                        sources {
                            id
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: graphqlQuery,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).createSources).toEqual({
                sources: [
                    {
                        id: testId,
                    },
                ],
            });
        });

        describe("A connection can only be made using unique fields for filtering, to prevent the connection to more than one node", () => {
            test("should allow the connection while using a unique field", async () => {
                const session = driver.session();

                const typeDefs = `
                    type Source {
                        id: ID!
                        target: Target @relationship(type: "HAS_TARGET", direction: OUT)
                    }

                    type Target {
                        exampleField: String @unique
                    }
                `;

                const testId = generate({
                    charset: "alphabetic",
                    readable: true,
                });

                const exampleField = generate({
                    charset: "alphabetic",
                    readable: true,
                });

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const graphqlQuery = `
                    mutation {
                        createSources(input: [{ id: "${testId}", target: { connect: { where: { node: { exampleField: "${exampleField}" } } } } }]) {
                            sources {
                                id
                                target {
                                    exampleField
                                }
                            }
                        }
                    }
                `;

                try {
                    await session.run(`
                        CREATE (:Target { exampleField: "${exampleField}" })
                    `);

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: graphqlQuery,
                        contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                    });

                    expect(gqlResult.data as any).toEqual({
                        createSources: { sources: [{ id: testId, target: { exampleField } }] },
                    });
                } finally {
                    await session.close();
                }
            });
        });
    });

    describe("Nullable one-to-* relationships", () => {
        describe("A connection can only be made using unique fields for filtering, to prevent the connection to more than one node", () => {
            test("should allow the connection while using a unique field", async () => {
                const session = driver.session();

                const typeDefs = `
                    type Source {
                        id: ID!
                        target: Target! @relationship(type: "HAS_TARGET", direction: OUT)
                    }

                    type Target {
                        exampleField: String @unique
                    }
                `;

                const testId = generate({
                    charset: "alphabetic",
                    readable: true,
                });

                const exampleField = generate({
                    charset: "alphabetic",
                    readable: true,
                });

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                const graphqlQuery = `
                    mutation {
                        createSources(input: [{ id: "${testId}", target: { connect: { where: { node: { exampleField: "${exampleField}" } } } } }]) {
                            sources {
                                id
                                target {
                                    exampleField
                                }
                            }
                        }
                    }
                `;

                try {
                    await session.run(`
                        CREATE (:Target { exampleField: "${exampleField}" })
                    `);

                    const gqlResult = await graphql({
                        schema: neoSchema.schema,
                        source: graphqlQuery,
                        contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                    });

                    expect(gqlResult.data as any).toEqual({
                        createSources: { sources: [{ id: testId, target: { exampleField } }] },
                    });
                } finally {
                    await session.close();
                }
            });
        });
    });
});
