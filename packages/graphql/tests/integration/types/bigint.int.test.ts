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
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("BigInt", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("create", () => {
        test("should create an object with a BigInt specified inline in the mutation", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type File {
                  name: String!
                  size: BigInt!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const name = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    createFiles(input: [{ name: "${name}", size: 9223372036854775807 }]) {
                        files {
                            name
                            size
                        }
                    }
                }
            `;

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: create,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeFalsy();

                const result = await session.run(`
                    MATCH (f:File {name: "${name}"})
                    RETURN f {.name, .size} as f
                `);

                expect((result.records[0]?.toObject() as any).f).toEqual({
                    name,
                    size: {
                        high: 2147483647,
                        low: -1,
                    },
                });
            } finally {
                await session.close();
            }
        });
    });

    describe("read", () => {
        test("should successfully query an node with a BigInt property", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type File {
                  name: String!
                  size: BigInt!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const name = generate({
                charset: "alphabetic",
            });

            const query = `
                query {
                    files(where: { name: "${name}" }) {
                        name
                        size
                    }
                }
            `;

            try {
                await session.run(`
                   CREATE (f:File)
                   SET f.name = "${name}"
                   SET f.size = 9223372036854775807
               `);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeFalsy();

                expect((gqlResult?.data as any)?.files[0]).toEqual({
                    name,
                    size: "9223372036854775807",
                });
            } finally {
                await session.close();
            }
        });

        test("should successfully query an node with a BigInt property using in where", async () => {
            const session = driver.session();
            const fileType = new UniqueType("File");

            const typeDefs = `
                type ${fileType} {
                  name: String!
                  size: BigInt!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const name = generate({
                charset: "alphabetic",
            });

            const query = `
                query {
                    ${fileType.plural}(where: { size: 8323372036854775807 }) {
                        name
                        size
                    }
                }
            `;

            try {
                await session.run(`
                   CREATE (f:${fileType})
                   SET f.name = "${name}"
                   SET f.size = 8323372036854775807
               `);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect(gqlResult?.data as any).toEqual({
                    [fileType.plural]: [
                        {
                            name,
                            size: "8323372036854775807",
                        },
                    ],
                });
            } finally {
                await session.close();
            }
        });
    });

    describe("@cypher directive", () => {
        test("should work returning a BigInt property", async () => {
            const session = await neo4j.getSession();

            const name = generate({
                charset: "alphabetic",
            });

            const typeDefs = `
                type File {
                  name: String!
                  size: BigInt! @cypher(statement: """
                      RETURN 9223372036854775807 as result
                  """, columnName:"result")
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const query = `
                query {
                    files(where: { name: "${name}" }) {
                        name
                        size
                    }
                }
            `;

            try {
                await session.run(`
                   CREATE (f:File)
                   SET f.name = "${name}"
               `);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
                });

                expect(gqlResult.errors).toBeFalsy();

                expect((gqlResult?.data as any)?.files[0]).toEqual({
                    name,
                    size: "9223372036854775807",
                });
            } finally {
                await session.close();
            }
        });
    });
});
