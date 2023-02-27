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
import { Socket } from "net";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { IncomingMessage } from "http";
import { generate } from "randomstring";
import Neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";

// Reference: https://github.com/neo4j/graphql/pull/355
// Reference: https://github.com/neo4j/graphql/issues/345
// Reference: https://github.com/neo4j/graphql/pull/342#issuecomment-884061188
describe("auth/allow-unauthenticated", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    let Post: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(() => {
        Post = new UniqueType("Post");
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("allowUnauthenticated with allow", () => {
        test("should return a Post without errors", async () => {
            const typeDefs = `
                type ${Post} {
                    id: ID!
                    publisher: String!
                    published: Boolean!
                }

                extend type ${Post} @auth(rules: [
                    { allow: { OR: [
                        { publisher: "$jwt.sub" },
                        { published: true },
                    ] }, allowUnauthenticated: true }
                ])
            `;

            const postId = generate({ charset: "alphabetic" });

            const query = `
                {
                    ${Post.plural}(where: { id: "${postId}" }) {
                        id
                    }
                }
            `;

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            await session.run(`
                CREATE (:${Post} {id: "${postId}", publisher: "nop", published: true})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);

            const gqlResult = await graphql({
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                schema: await neoSchema.getSchema(),
                source: query,
            });

            // Check that no errors have been throwed
            expect(gqlResult.errors).toBeUndefined();

            // Check if returned data is what we really want
            expect((gqlResult.data as any)?.[Post.plural]?.[0]?.id).toBe(postId);
        });

        test("should throw a Forbidden error", async () => {
            const typeDefs = `
                type ${Post} {
                    id: ID!
                    publisher: String!
                    published: Boolean!
                }

                extend type ${Post} @auth(rules: [
                    { allow: { OR: [
                        { publisher: "$jwt.sub" },
                        { published: true },
                    ] }, allowUnauthenticated: true }
                ])
            `;

            const postId = generate({ charset: "alphabetic" });

            const query = `
                {
                    ${Post.plural}(where: { id: "${postId}" }) {
                        id
                    }
                }
            `;

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            await session.run(`
                CREATE (:${Post} {id: "${postId}", publisher: "nop", published: false})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);

            const gqlResult = await graphql({
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                schema: await neoSchema.getSchema(),
                source: query,
            });

            // Check that a Forbidden error have been throwed
            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            expect(gqlResult.errors as any[]).toHaveLength(1);

            // Check if returned data is what we really want
            expect(gqlResult.data?.[Post.plural]).toBeUndefined();
        });

        test("should throw a Forbidden error if at least one result isn't allowed", async () => {
            const typeDefs = `
                type ${Post} {
                    id: ID!
                    publisher: String!
                    published: Boolean!
                }

                extend type ${Post} @auth(rules: [
                    { allow: { OR: [
                        { publisher: "$jwt.sub" },
                        { published: true },
                    ] }, allowUnauthenticated: true }
                ])
            `;

            const postId = generate({ charset: "alphabetic" });
            const postId2 = generate({ charset: "alphabetic" });

            const query = `
                {
                    ${Post.plural}(where: { OR: [{id: "${postId}"}, {id: "${postId2}"}] }) {
                        id
                    }
                }
            `;

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            await session.run(`
                CREATE (:${Post} {id: "${postId}", publisher: "nop", published: false})
                CREATE (:${Post} {id: "${postId2}", publisher: "nop", published: true})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);

            const gqlResult = await graphql({
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                schema: await neoSchema.getSchema(),
                source: query,
            });

            // Check that a Forbidden error have been throwed
            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            expect(gqlResult.errors as any[]).toHaveLength(1);

            // Check if returned data is what we really want
            expect(gqlResult.data?.[Post.plural]).toBeUndefined();
        });
    });

    describe("allowUnauthenticated with where", () => {
        test("should return a Post without errors", async () => {
            const typeDefs = `
                type ${Post} {
                    id: ID!
                    publisher: String!
                    published: Boolean!
                }

                extend type ${Post} @auth(rules: [
                    { where: { OR: [
                        { publisher: "$jwt.sub" },
                        { published: true },
                    ] }, allowUnauthenticated: true }
                ])
            `;

            const postId = generate({ charset: "alphabetic" });

            const query = `
                {
                    ${Post.plural}(where: { id: "${postId}" }) {
                        id
                    }
                }
            `;

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            await session.run(`
                CREATE (:${Post} {id: "${postId}", publisher: "nop", published: true})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);

            const gqlResult = await graphql({
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                schema: await neoSchema.getSchema(),
                source: query,
            });

            // Check that no errors have been throwed
            expect(gqlResult.errors).toBeUndefined();

            // Check if returned data is what we really want
            expect((gqlResult.data as any)?.[Post.plural]?.[0]?.id).toBe(postId);
        });

        test("should return an empty array without errors", async () => {
            const typeDefs = `
                type ${Post} {
                    id: ID!
                    publisher: String!
                    published: Boolean!
                }

                extend type ${Post} @auth(rules: [
                    { where: { OR: [
                        { publisher: "$jwt.sub" },
                        { published: true },
                    ] }, allowUnauthenticated: true }
                ])
            `;

            const postId = generate({ charset: "alphabetic" });

            const query = `
                {
                    ${Post.plural}(where: { id: "${postId}" }) {
                        id
                    }
                }
            `;

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            await session.run(`
                CREATE (:${Post} {id: "${postId}", publisher: "nop", published: false})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);

            const gqlResult = await graphql({
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                schema: await neoSchema.getSchema(),
                source: query,
            });

            // Check that no errors have been throwed
            expect(gqlResult.errors).toBeUndefined();

            // Check if returned data is what we really want
            expect(gqlResult.data?.[Post.plural]).toStrictEqual([]);
        });

        test("should only return published Posts without errors", async () => {
            const typeDefs = `
                type ${Post} {
                    id: ID!
                    publisher: String!
                    published: Boolean!
                }

                extend type ${Post} @auth(rules: [
                    { where: { OR: [
                        { publisher: "$jwt.sub" },
                        { published: true },
                    ] }, allowUnauthenticated: true }
                ])
            `;

            const postId = generate({ charset: "alphabetic" });
            const postId2 = generate({ charset: "alphabetic" });

            const query = `
                {
                    ${Post.plural}(where: { OR: [{id: "${postId}"}, {id: "${postId2}"}] }) {
                        id
                    }
                }
            `;

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            await session.run(`
                CREATE (:${Post} {id: "${postId}", publisher: "nop", published: false})
                CREATE (:${Post} {id: "${postId2}", publisher: "nop", published: true})
            `);

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);

            const gqlResult = await graphql({
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
                schema: await neoSchema.getSchema(),
                source: query,
            });

            // Check that no errors have been throwed
            expect(gqlResult.errors).toBeUndefined();

            // Check if returned data is what we really want
            expect(gqlResult.data?.[Post.plural]).toContainEqual({ id: postId2 });
            expect(gqlResult.data?.[Post.plural]).toHaveLength(1);
        });
    });

    describe("allowUnauthenticated with bind", () => {
        test("should throw Forbiden error only", async () => {
            const User = new UniqueType("User");

            const typeDefs = `
                type ${User} {
                    id: ID
                }

                extend type ${User} @auth(rules: [{
                    operations: [CREATE],
                    bind: { id: "$jwt.sub" },
                    allowUnauthenticated: true
                }])
            `;

            const query = `
                mutation {
                    ${User.operations.create}(input: [{id: "not bound"}]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);

            const gqlResult = await graphql({
                contextValue: neo4j.getContextValues({ req }),
                schema: await neoSchema.getSchema(),
                source: query,
            });

            // Check that a Forbidden error have been throwed
            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            expect(gqlResult.errors as any[]).toHaveLength(1);

            // Check if returned data is what we really want
            expect(gqlResult.data?.[Post.plural]).toBeUndefined();
        });
    });
});
