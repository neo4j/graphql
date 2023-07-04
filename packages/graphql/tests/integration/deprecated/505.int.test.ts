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
import { gql } from "graphql-tag";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/505", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    const plugin = new Neo4jGraphQLAuthJWTPlugin({
        secret: "secret",
    });

    const userType = new UniqueType("User");
    const workspaceType = new UniqueType("Workspace");
    const pageType = new UniqueType("User");

    // Update to use _INCLUDES once https://github.com/neo4j/graphql/pull/500 is merged
    const typeDefs = gql`
        type ${userType} {
            id: ID!
            authId: String
            workspaces: [${workspaceType}!]! @relationship(type: "MEMBER_OF", direction: OUT)
            adminOf: [${workspaceType}!]! @relationship(type: "HAS_ADMIN", direction: IN)
            createdPages: [${pageType}!]! @relationship(type: "CREATED_PAGE", direction: OUT)
        }

        type ${workspaceType}
            @auth(
                rules: [
                    {
                        operations: [READ]
                        where: { OR: [{ members: { authId: "$jwt.sub" } }, { admins: { authId: "$jwt.sub" } }] }
                    }
                ]
            )
            @exclude(operations: [CREATE, UPDATE]) {
            id: ID!
            name: String!
            members: [${userType}!]! @relationship(type: "MEMBER_OF", direction: IN)
            admins: [${userType}!]! @relationship(type: "HAS_ADMIN", direction: OUT)
            pages: [${pageType}!]! @relationship(type: "HAS_PAGE", direction: OUT)
        }

        type ${pageType}
            @auth(
                rules: [
                    {
                        operations: [READ]
                        where: {
                            OR: [
                                { owner: { authId: "$jwt.sub" } }
                                {
                                    AND: [
                                        { shared: true }
                                        {
                                            workspace: {
                                                OR: [
                                                    { members: { authId: "$jwt.sub" } }
                                                    { admins: { authId: "$jwt.sub" } }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            ) {
            id: ID!

            shared: Boolean! @default(value: false)

            owner: ${userType}! @relationship(type: "CREATED_PAGE", direction: IN)

            workspace: ${workspaceType}! @relationship(type: "HAS_PAGE", direction: IN)
        }
    `;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    async function queryTest(neoSchema: Neo4jGraphQL, variableValues: any, userId: string, session: Session) {
        async function graphqlQuery(query: string) {
            return graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), {
                    jwt: {
                        sub: userId,
                    },
                }),
                variableValues,
            });
        }

        const usersQuery = `
            query Users($userId: ID!) {
                ${userType.plural}(where: { id: $userId }) {
                    id,
                    authId,
                    createdPages {
                        id
                    }
                }
            }
        `;
        const workspacesQuery = `
            query Workspaces($workspaceId: ID!) {
                ${workspaceType.plural}(where: { id: $workspaceId }) {
                    id,
                    pages {
                        id
                    }
                }
            }
        `;
        const pagesQuery = `
            query Pages($workspaceId: ID!) {
                ${pageType.plural}(where: { workspace: { id: $workspaceId } }) {
                    id
                }
            }
        `;
        const allPagesQuery = `
            query allPages {
                ${pageType.plural} {
                    id
                }
            }
        `;
        return {
            usersResult: await graphqlQuery(usersQuery),
            workspacesResult: await graphqlQuery(workspacesQuery),
            pagesResult: await graphqlQuery(pagesQuery),
            allPagesResult: await graphqlQuery(allPagesQuery),
        };
    }

    test("single user, single workspace, multiple pages", async () => {
        const session = await neo4j.getSession();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver, plugins: { auth: plugin } });
        const userId = generate({ charset: "alphabetic" });
        const workspaceId = generate({ charset: "alphabetic" });
        const pageIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        await session.run(
            `CREATE (u:${userType} {id: $userId, authId: $userId}),
                (w:${workspaceType} {id: $workspaceId}),
                (w)-[:HAS_ADMIN]->(u),
                (p0:${pageType} {id: $p0id, shared: true}),
                (p1:${pageType} {id: $p1id, shared: true}),
                (u)-[:MEMBER_OF]->(w),
                (w)-[:HAS_PAGE]->(p0),
                (w)-[:HAS_PAGE]->(p1),
                (u)-[:CREATED_PAGE]->(p0),
                (u)-[:CREATED_PAGE]->(p1)
            `,
            {
                userId,
                workspaceId,
                p0id: pageIds[0],
                p1id: pageIds[1],
            }
        );

        const variableValues = {
            userId,
            workspaceId,
        };

        try {
            await neoSchema.checkNeo4jCompat();

            const { usersResult, workspacesResult, pagesResult, allPagesResult } = await queryTest(
                neoSchema,
                variableValues,
                userId,
                session
            );

            expect(usersResult?.errors).toBeFalsy();
            expect((usersResult?.data as any)?.[userType.plural]).toHaveLength(1);
            expect((usersResult?.data as any)?.[userType.plural][0]?.createdPages).toHaveLength(2);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.[workspaceType.plural]).toHaveLength(1);
            expect((workspacesResult?.data as any)?.[workspaceType.plural][0]?.pages).toHaveLength(2);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.[pageType.plural]).toHaveLength(2);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.[pageType.plural]).toHaveLength(2);
        } finally {
            await session.close();
        }
    });

    test("single user, multiple workspaces, multiple shared pages", async () => {
        const session = await neo4j.getSession();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver, plugins: { auth: plugin } });
        const userId = generate({ charset: "alphabetic" });
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        await session.run(
            `CREATE (u:${userType} {id: $userId, authId: $userId}),
                (w1:${workspaceType} {id: $w0id}),
                (w2:${workspaceType} {id: $w1id}),
                (p0:${pageType} {id: $p0id, shared: true}),
                (p1:${pageType} {id: $p1id, shared: true}),
                (p2:${pageType} {id: $p2id, shared: true}),
                (p3:${pageType} {id: $p3id, shared: true}),
                (u)-[:MEMBER_OF]->(w1),
                (w1)-[:HAS_PAGE]->(p0),
                (w1)-[:HAS_PAGE]->(p1),
                (u)-[:CREATED_PAGE]->(p0),
                (u)-[:CREATED_PAGE]->(p1),
                (u)-[:MEMBER_OF]->(w2),
                (w2)-[:HAS_PAGE]->(p2),
                (w2)-[:HAS_PAGE]->(p3),
                (u)-[:CREATED_PAGE]->(p2),
                (u)-[:CREATED_PAGE]->(p3)
            `,
            {
                userId,
                w0id: workspaceIds[0],
                w1id: workspaceIds[1],
                p0id: pageIds[0],
                p1id: pageIds[1],
                p2id: pageIds[2],
                p3id: pageIds[3],
            }
        );

        const variableValues = {
            userId,
            workspaceId: workspaceIds[0],
        };

        try {
            await neoSchema.checkNeo4jCompat();

            const { usersResult, workspacesResult, pagesResult, allPagesResult } = await queryTest(
                neoSchema,
                variableValues,
                userId,
                session
            );

            expect(usersResult?.errors).toBeFalsy();

            expect((usersResult?.data as any)?.[userType.plural]).toHaveLength(1);
            expect((usersResult?.data as any)?.[userType.plural][0]?.createdPages).toHaveLength(4);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.[workspaceType.plural]).toHaveLength(1);
            expect((workspacesResult?.data as any)?.[workspaceType.plural][0]?.pages).toHaveLength(2);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.[pageType.plural]).toHaveLength(2);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.[pageType.plural]).toHaveLength(4);
        } finally {
            await session.close();
        }
    });

    test("multiple users, multiple workspaces, multiple shared pages", async () => {
        const session = await neo4j.getSession();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver, plugins: { auth: plugin } });
        const userIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string];
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string];
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string, string, string];

        // current relationship on where checks *all* nodes hold true
        // so all members/admins of workspace must have matching jwt sub
        // for now, don't add u0 as member of workspaces so constraint holds
        await session.run(
            `CREATE (u0:${userType} {id: $u0id, authId: $u0id}),
                (u1:${userType} {id: $u1id, authId: $u1id}),
                (w1:${workspaceType} {id: $w0id}),
                (w2:${workspaceType} {id: $w1id}),
                (p0:${pageType} {id: $p0id, shared: true}),
                (p1:${pageType} {id: $p1id, shared: true}),
                (p2:${pageType} {id: $p2id, shared: true}),
                (p3:${pageType} {id: $p3id, shared: true}),
                // (u0)-[:MEMBER_OF]->(w1),
                (u1)-[:MEMBER_OF]->(w1),
                (w1)-[:HAS_PAGE]->(p0),
                (w1)-[:HAS_PAGE]->(p1),
                (p1)-[:CREATED_PAGE]->(p0),
                (u0)-[:CREATED_PAGE]->(p1),
                // (u0)-[:MEMBER_OF]->(w2),
                (u1)-[:MEMBER_OF]->(w2),
                (w2)-[:HAS_PAGE]->(p2),
                (w2)-[:HAS_PAGE]->(p3),
                (u0)-[:CREATED_PAGE]->(p2),
                (u0)-[:CREATED_PAGE]->(p3)
            `,
            {
                u0id: userIds[0],
                u1id: userIds[1],
                w0id: workspaceIds[0],
                w1id: workspaceIds[1],
                p0id: pageIds[0],
                p1id: pageIds[1],
                p2id: pageIds[2],
                p3id: pageIds[3],
            }
        );

        const variableValues = {
            userId: userIds[1],
            workspaceId: workspaceIds[0],
        };

        try {
            await neoSchema.checkNeo4jCompat();

            const { usersResult, workspacesResult, pagesResult, allPagesResult } = await queryTest(
                neoSchema,
                variableValues,
                userIds[1],
                session
            );

            expect(usersResult?.errors).toBeFalsy();
            expect((usersResult?.data as any)?.[userType.plural]).toHaveLength(1);
            expect((usersResult?.data as any)?.[userType.plural][0]?.createdPages).toHaveLength(0);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.[workspaceType.plural]).toHaveLength(1);
            expect((workspacesResult?.data as any)?.[workspaceType.plural][0]?.pages).toHaveLength(2);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.[pageType.plural]).toHaveLength(2);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.[pageType.plural]).toHaveLength(4);
        } finally {
            await session.close();
        }
    });

    test("multiple users, multiple workspaces, multiple mixed shared pages", async () => {
        const session = await neo4j.getSession();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver, plugins: { auth: plugin } });
        const userIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string];
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string];
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string, string, string];

        // current relationship on where checks *all* nodes hold true
        // so all members/admins of workspace must have matching jwt sub
        // for now, don't add u0 as member of workspaces so constraint holds
        await session.run(
            `CREATE (u0:${userType} {id: $u0id, authId: $u0id}),
                (u1:${userType} {id: $u1id, authId: $u1id}),
                (w1:${workspaceType} {id: $w0id}),
                (w2:${workspaceType} {id: $w1id}),
                (p0:${pageType} {id: $p0id, shared: true}),
                (p1:${pageType} {id: $p1id, shared: false}),
                (p2:${pageType} {id: $p2id, shared: true}),
                (p3:${pageType} {id: $p3id, shared: false}),
                // (u0)-[:MEMBER_OF]->(w1),
                (u1)-[:MEMBER_OF]->(w1),
                (w1)-[:HAS_PAGE]->(p0),
                (w1)-[:HAS_PAGE]->(p1),
                (p1)-[:CREATED_PAGE]->(p0),
                (u0)-[:CREATED_PAGE]->(p1),
                // (u0)-[:MEMBER_OF]->(w2),
                (u1)-[:MEMBER_OF]->(w2),
                (w2)-[:HAS_PAGE]->(p2),
                (w2)-[:HAS_PAGE]->(p3),
                (u0)-[:CREATED_PAGE]->(p2),
                (u0)-[:CREATED_PAGE]->(p3)
            `,
            {
                u0id: userIds[0],
                u1id: userIds[1],
                w0id: workspaceIds[0],
                w1id: workspaceIds[1],
                p0id: pageIds[0],
                p1id: pageIds[1],
                p2id: pageIds[2],
                p3id: pageIds[3],
            }
        );

        const variableValues = {
            userId: userIds[1],
            workspaceId: workspaceIds[0],
        };

        try {
            await neoSchema.checkNeo4jCompat();

            const { usersResult, workspacesResult, pagesResult, allPagesResult } = await queryTest(
                neoSchema,
                variableValues,
                userIds[1],
                session
            );

            expect(usersResult?.errors).toBeFalsy();
            expect((usersResult?.data as any)?.[userType.plural]).toHaveLength(1);
            expect((usersResult?.data as any)?.[userType.plural][0]?.createdPages).toHaveLength(0);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.[workspaceType.plural]).toHaveLength(1);
            expect((workspacesResult?.data as any)?.[workspaceType.plural][0]?.pages).toHaveLength(1);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.[pageType.plural]).toHaveLength(1);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.[pageType.plural]).toHaveLength(2);
        } finally {
            await session.close();
        }
    });

    test("multiple users, multiple workspaces, multiple private pages", async () => {
        const session = await neo4j.getSession();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver, plugins: { auth: plugin } });
        const userIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string];
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string];
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string, string, string];

        // current relationship on where checks *all* nodes hold true
        // so all members/admins of workspace must have matching jwt sub
        // for now, don't add u0 as member of workspaces so constraint holds
        await session.run(
            `CREATE (u0:${userType} {id: $u0id, authId: $u0id}),
                (u1:${userType} {id: $u1id, authId: $u1id}),
                (w1:${workspaceType} {id: $w0id}),
                (w2:${workspaceType} {id: $w1id}),
                (p0:${pageType} {id: $p0id, shared: false}),
                (p1:${pageType} {id: $p1id, shared: false}),
                (p2:${pageType} {id: $p2id, shared: false}),
                (p3:${pageType} {id: $p3id, shared: false}),
                // (u0)-[:MEMBER_OF]->(w1),
                (u1)-[:MEMBER_OF]->(w1),
                (w1)-[:HAS_PAGE]->(p0),
                (w1)-[:HAS_PAGE]->(p1),
                (p1)-[:CREATED_PAGE]->(p0),
                (u0)-[:CREATED_PAGE]->(p1),
                // (u0)-[:MEMBER_OF]->(w2),
                (u1)-[:MEMBER_OF]->(w2),
                (w2)-[:HAS_PAGE]->(p2),
                (w2)-[:HAS_PAGE]->(p3),
                (u0)-[:CREATED_PAGE]->(p2),
                (u0)-[:CREATED_PAGE]->(p3)
            `,
            {
                u0id: userIds[0],
                u1id: userIds[1],
                w0id: workspaceIds[0],
                w1id: workspaceIds[1],
                p0id: pageIds[0],
                p1id: pageIds[1],
                p2id: pageIds[2],
                p3id: pageIds[3],
            }
        );

        const variableValues = {
            userId: userIds[1],
            workspaceId: workspaceIds[0],
        };

        try {
            await neoSchema.checkNeo4jCompat();

            const { usersResult, workspacesResult, pagesResult, allPagesResult } = await queryTest(
                neoSchema,
                variableValues,
                userIds[1],
                session
            );

            expect(usersResult?.errors).toBeFalsy();
            expect((usersResult?.data as any)?.[userType.plural]).toHaveLength(1);
            expect((usersResult?.data as any)?.[userType.plural][0]?.createdPages).toHaveLength(0);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.[workspaceType.plural]).toHaveLength(1);
            expect((workspacesResult?.data as any)?.[workspaceType.plural][0]?.pages).toHaveLength(0);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.[pageType.plural]).toHaveLength(0);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.[pageType.plural]).toHaveLength(0);
        } finally {
            await session.close();
        }
    });

    test("multiple users, multiple workspaces where not member, multiple shared pages", async () => {
        const session = await neo4j.getSession();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver, plugins: { auth: plugin } });
        const userIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string];
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string];
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string, string, string];

        // current relationship on where checks *all* nodes hold true
        // so all members/admins of workspace must have matching jwt sub
        // for now, don't add u0 as member of workspaces so constraint holds
        await session.run(
            `CREATE (u0:${userType} {id: $u0id, authId: $u0id}),
                (u1:${userType} {id: $u1id, authId: $u1id}),
                (w1:${workspaceType} {id: $w0id}),
                (w2:${workspaceType} {id: $w1id}),
                (p0:${pageType} {id: $p0id, shared: true}),
                (p1:${pageType} {id: $p1id, shared: true}),
                (p2:${pageType} {id: $p2id, shared: true}),
                (p3:${pageType} {id: $p3id, shared: true}),
                (u0)-[:MEMBER_OF]->(w1),
                // (u1)-[:MEMBER_OF]->(w1),
                (w1)-[:HAS_PAGE]->(p0),
                (w1)-[:HAS_PAGE]->(p1),
                (p1)-[:CREATED_PAGE]->(p0),
                (u0)-[:CREATED_PAGE]->(p1),
                (u0)-[:MEMBER_OF]->(w2),
                // (u1)-[:MEMBER_OF]->(w2),
                (w2)-[:HAS_PAGE]->(p2),
                (w2)-[:HAS_PAGE]->(p3),
                (u0)-[:CREATED_PAGE]->(p2),
                (u0)-[:CREATED_PAGE]->(p3)
            `,
            {
                u0id: userIds[0],
                u1id: userIds[1],
                w0id: workspaceIds[0],
                w1id: workspaceIds[1],
                p0id: pageIds[0],
                p1id: pageIds[1],
                p2id: pageIds[2],
                p3id: pageIds[3],
            }
        );

        const variableValues = {
            userId: userIds[1],
            workspaceId: workspaceIds[0],
        };

        try {
            await neoSchema.checkNeo4jCompat();

            const { usersResult, workspacesResult, pagesResult, allPagesResult } = await queryTest(
                neoSchema,
                variableValues,
                userIds[1],
                session
            );

            expect(usersResult?.errors).toBeFalsy();
            expect((usersResult?.data as any)?.[userType.plural]).toHaveLength(1);
            expect((usersResult?.data as any)?.[userType.plural][0]?.createdPages).toHaveLength(0);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.[workspaceType.plural]).toHaveLength(0);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.[pageType.plural]).toHaveLength(0);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.[pageType.plural]).toHaveLength(0);
        } finally {
            await session.close();
        }
    });

    test("multiple users, multiple workspaces with partial membership, multiple shared pages", async () => {
        const session = await neo4j.getSession();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver, plugins: { auth: plugin } });
        const userIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string];
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string];
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string, string, string];

        // current relationship on where checks *all* nodes hold true
        // so all members/admins of workspace must have matching jwt sub
        // for now, don't add u0 as member of workspaces so constraint holds
        await session.run(
            `CREATE (u0:${userType} {id: $u0id, authId: $u0id}),
                (u1:${userType} {id: $u1id, authId: $u1id}),
                (w1:${workspaceType} {id: $w0id}),
                (w2:${workspaceType} {id: $w1id}),
                (p0:${pageType} {id: $p0id, shared: true}),
                (p1:${pageType} {id: $p1id, shared: true}),
                (p2:${pageType} {id: $p2id, shared: true}),
                (p3:${pageType} {id: $p3id, shared: true}),
                // (u0)-[:MEMBER_OF]->(w1),
                (u1)-[:MEMBER_OF]->(w1),
                (w1)-[:HAS_PAGE]->(p0),
                (w1)-[:HAS_PAGE]->(p1),
                (p1)-[:CREATED_PAGE]->(p0),
                (u0)-[:CREATED_PAGE]->(p1),
                (u0)-[:MEMBER_OF]->(w2),
                // (u1)-[:MEMBER_OF]->(w2),
                (w2)-[:HAS_PAGE]->(p2),
                (w2)-[:HAS_PAGE]->(p3),
                (u0)-[:CREATED_PAGE]->(p2),
                (u0)-[:CREATED_PAGE]->(p3)
            `,
            {
                u0id: userIds[0],
                u1id: userIds[1],
                w0id: workspaceIds[0],
                w1id: workspaceIds[1],
                p0id: pageIds[0],
                p1id: pageIds[1],
                p2id: pageIds[2],
                p3id: pageIds[3],
            }
        );

        const variableValues = {
            userId: userIds[1],
            workspaceId: workspaceIds[0],
        };

        try {
            await neoSchema.checkNeo4jCompat();

            const { usersResult, workspacesResult, pagesResult, allPagesResult } = await queryTest(
                neoSchema,
                variableValues,
                userIds[1],
                session
            );

            expect(usersResult?.errors).toBeFalsy();
            expect((usersResult?.data as any)?.[userType.plural]).toHaveLength(1);
            expect((usersResult?.data as any)?.[userType.plural][0]?.createdPages).toHaveLength(0);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.[workspaceType.plural]).toHaveLength(1);
            expect((workspacesResult?.data as any)?.[workspaceType.plural][0]?.pages).toHaveLength(2);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.[pageType.plural]).toHaveLength(2);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.[pageType.plural]).toHaveLength(2);
        } finally {
            await session.close();
        }
    });

    test("multiple users, multiple workspaces with partial membership, multiple mixed shared pages", async () => {
        const session = await neo4j.getSession();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver, plugins: { auth: plugin } });
        const userIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string];
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string];
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" })) as [string, string, string, string];

        // current relationship on where checks *all* nodes hold true
        // so all members/admins of workspace must have matching jwt sub
        // for now, don't add u0 as member of workspaces so constraint holds
        await session.run(
            `CREATE (u0:${userType} {id: $u0id, authId: $u0id}),
                (u1:${userType} {id: $u1id, authId: $u1id}),
                (w1:${workspaceType} {id: $w0id}),
                (w2:${workspaceType} {id: $w1id}),
                (p0:${pageType} {id: $p0id, shared: false}),
                (p1:${pageType} {id: $p1id, shared: false}),
                (p2:${pageType} {id: $p2id, shared: true}),
                (p3:${pageType} {id: $p3id, shared: true}),
                // (u0)-[:MEMBER_OF]->(w1),
                (u1)-[:MEMBER_OF]->(w1),
                (w1)-[:HAS_PAGE]->(p0),
                (w1)-[:HAS_PAGE]->(p1),
                (p1)-[:CREATED_PAGE]->(p0),
                (u0)-[:CREATED_PAGE]->(p1),
                (u0)-[:MEMBER_OF]->(w2),
                // (u1)-[:MEMBER_OF]->(w2),
                (w2)-[:HAS_PAGE]->(p2),
                (w2)-[:HAS_PAGE]->(p3),
                (u0)-[:CREATED_PAGE]->(p2),
                (u0)-[:CREATED_PAGE]->(p3)
            `,
            {
                u0id: userIds[0],
                u1id: userIds[1],
                w0id: workspaceIds[0],
                w1id: workspaceIds[1],
                p0id: pageIds[0],
                p1id: pageIds[1],
                p2id: pageIds[2],
                p3id: pageIds[3],
            }
        );

        const variableValues = {
            userId: userIds[1],
            workspaceId: workspaceIds[0],
        };

        try {
            await neoSchema.checkNeo4jCompat();

            const { usersResult, workspacesResult, pagesResult, allPagesResult } = await queryTest(
                neoSchema,
                variableValues,
                userIds[1],
                session
            );

            expect(usersResult?.errors).toBeFalsy();
            expect((usersResult?.data as any)?.[userType.plural]).toHaveLength(1);
            expect((usersResult?.data as any)?.[userType.plural][0]?.createdPages).toHaveLength(0);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.[workspaceType.plural]).toHaveLength(1);
            expect((workspacesResult?.data as any)?.[workspaceType.plural][0]?.pages).toHaveLength(0);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.[pageType.plural]).toHaveLength(0);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.[pageType.plural]).toHaveLength(0);
        } finally {
            await session.close();
        }
    });
});
