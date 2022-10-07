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
import { gql } from "apollo-server";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";
import { createJwtRequest } from "../../utils/create-jwt-request";

const testTypeDefs = gql`
    interface Content {
        id: ID
        content: String
        creator: User! @relationship(type: "HAS_CONTENT", direction: IN)
    }

    type User {
        id: ID
        name: String
        content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
    }

    type Comment implements Content {
        id: ID
        content: String
        creator: User!
    }

    type Post implements Content
        @auth(
            rules: [{ operations: [READ, UPDATE, DELETE, CONNECT, DISCONNECT], where: { creator: { id: "$jwt.sub" } } }]
        ) {
        id: ID
        content: String
        creator: User!
    }

    extend type User
        @auth(rules: [{ operations: [READ, UPDATE, DELETE, CONNECT, DISCONNECT], where: { id: "$jwt.sub" } }])

    extend type User {
        password: String! @auth(rules: [{ operations: [READ], where: { id: "$jwt.sub" } }])
    }

    extend type Post {
        secretKey: String! @auth(rules: [{ operations: [READ], where: { creator: { id: "$jwt.sub" } } }])
    }
`;

describe("https://github.com/neo4j/graphql/pull/2068", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    const secret = "secret";
    const jwtPlugin = new Neo4jGraphQLAuthJWTPlugin({
        secret: "secret",
    });

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });
    describe("Missing with in update calls", () => {
        test("Connect node - update within an update", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = testTypeDefs;

            const userID = "someID";
            const contentID = "someContentID";

            const query = `
                mutation {
                    updateUsers(update: { content: { connect: { where: { node: {} } } } }) {
                        users {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userID}"})
                    CREATE (:Content {id: "${contentID}"})
                `);

                const req = createJwtRequest(secret, { sub: userID });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userID, contentConnection: { totalCount: 0 } }]);
            } finally {
                await session.close();
            }
        });
        test("Connect node - user defined update where within an update", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = testTypeDefs;

            const userID1 = "someID";
            const userID2 = "differentID";
            const contentID = "someContentID";

            const query = `
                mutation {
                    updateUsers(update: { content: { connect: { where: { node: { id: "${userID2}" } } } } }) {
                        users {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userID1}"})
                    CREATE (:User {id: "${userID2}"})
                    CREATE (:Content {id: "${contentID}"})
                `);

                const req = createJwtRequest(secret, { sub: userID1 });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userID1, contentConnection: { totalCount: 0 } }]);
            } finally {
                await session.close();
            }
        });
        test("Disconnect node - update within an update", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = testTypeDefs;

            const userId = "someID";
            const contentId = "someContentID";

            const query = `
                mutation {
                    updateUsers(update: { content: { disconnect: { where: {} } } }) {
                        users {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_CONTENT]->(:Content {id: "${contentId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userId, contentConnection: { totalCount: 0 } }]);
            } finally {
                await session.close();
            }
        });
        test("Disconnect node - user defined update where within an update", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = testTypeDefs;

            const userId = "someID";
            const contentId = "someContentID";

            const query = `
                mutation {
                    updateUsers(update: { content: [{ disconnect: { where: { node: { id: "${userId}" } } } }] }) {
                        users {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_CONTENT]->(:Content {id: "${contentId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userId, contentConnection: { totalCount: 0 } }]);
            } finally {
                await session.close();
            }
        });
        test("")
    });
});
