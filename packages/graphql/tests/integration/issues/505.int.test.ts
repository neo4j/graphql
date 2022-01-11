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

import { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/505", () => {
    let driver: Driver;
    // Update to use _INCLUDES once https://github.com/neo4j/graphql/pull/500 is merged
    const typeDefs = gql`
        type User {
            id: ID!
            authId: String
            workspaces: [Workspace!] @relationship(type: "MEMBER_OF", direction: OUT)
            adminOf: [Workspace!] @relationship(type: "HAS_ADMIN", direction: IN)
            createdPages: [Page!] @relationship(type: "CREATED_PAGE", direction: OUT)
        }

        type Workspace
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
            members: [User!] @relationship(type: "MEMBER_OF", direction: IN)
            admins: [User!] @relationship(type: "HAS_ADMIN", direction: OUT)
            pages: [Page!] @relationship(type: "HAS_PAGE", direction: OUT)
        }

        type Page
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

            owner: User! @relationship(type: "CREATED_PAGE", direction: IN)

            workspace: Workspace! @relationship(type: "HAS_PAGE", direction: IN)
        }
    `;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    async function queryTest(neoSchema: Neo4jGraphQL, variableValues: any, userId: string, session: Session) {
        async function graphqlQuery(query: string) {
            return graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: {
                    driver,
                    driverConfig: {
                        bookmarks: session.lastBookmark(),
                    },
                    jwt: {
                        sub: userId,
                    },
                },
                variableValues,
            });
        }

        const usersQuery = `
            query Users($userId: ID!) {
                users(where: { id: $userId }) {
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
                workspaces(where: { id: $workspaceId }) {
                    id,
                    pages {
                        id
                    }
                }
            }
        `;
        const pagesQuery = `
            query Pages($workspaceId: ID!) {
                pages(where: { workspace: { id: $workspaceId } }) {
                    id
                }
            }
        `;
        const allPagesQuery = `
            query allPages {
                pages {
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
        const session = driver.session();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        const userId = generate({ charset: "alphabetic" });
        const workspaceId = generate({ charset: "alphabetic" });
        const pageIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        await session.run(
            `CREATE (u:User {id: $userId, authId: $userId}),
                (w:Workspace {id: $workspaceId}),
                (w)-[:HAS_ADMIN]->(u),
                (p0:Page {id: $p0id, shared: true}),
                (p1:Page {id: $p1id, shared: true}),
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
            expect((usersResult?.data as any)?.users).toHaveLength(1);
            expect((usersResult?.data as any as any)?.users[0]?.createdPages).toHaveLength(2);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.workspaces).toHaveLength(1);
            expect((workspacesResult?.data as any as any)?.workspaces[0]?.pages).toHaveLength(2);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.pages).toHaveLength(2);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.pages).toHaveLength(2);
        } finally {
            await session.close();
        }
    });

    test("single user, multiple workspaces, multiple shared pages", async () => {
        const session = driver.session();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        const userId = generate({ charset: "alphabetic" });
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        await session.run(
            `CREATE (u:User {id: $userId, authId: $userId}),
                (w1:Workspace {id: $w0id}),
                (w2:Workspace {id: $w1id}),
                (p0:Page {id: $p0id, shared: true}),
                (p1:Page {id: $p1id, shared: true}),
                (p2:Page {id: $p2id, shared: true}),
                (p3:Page {id: $p3id, shared: true}),
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

            expect((usersResult?.data as any)?.users).toHaveLength(1);
            expect((usersResult?.data as any)?.users[0]?.createdPages).toHaveLength(4);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.workspaces).toHaveLength(1);
            expect((workspacesResult?.data as any)?.workspaces[0]?.pages).toHaveLength(2);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.pages).toHaveLength(2);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.pages).toHaveLength(4);
        } finally {
            await session.close();
        }
    });

    test("multiple users, multiple workspaces, multiple shared pages", async () => {
        const session = driver.session();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        const userIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        // current relationship on where checks *all* nodes hold true
        // so all members/admins of workspace must have matching jwt sub
        // for now, don't add u0 as member of workspaces so constraint holds
        await session.run(
            `CREATE (u0:User {id: $u0id, authId: $u0id}),
                (u1:User {id: $u1id, authId: $u1id}),
                (w1:Workspace {id: $w0id}),
                (w2:Workspace {id: $w1id}),
                (p0:Page {id: $p0id, shared: true}),
                (p1:Page {id: $p1id, shared: true}),
                (p2:Page {id: $p2id, shared: true}),
                (p3:Page {id: $p3id, shared: true}),
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
            expect((usersResult?.data as any)?.users).toHaveLength(1);
            expect((usersResult?.data as any)?.users[0]?.createdPages).toHaveLength(0);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.workspaces).toHaveLength(1);
            expect((workspacesResult?.data as any)?.workspaces[0]?.pages).toHaveLength(2);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.pages).toHaveLength(2);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.pages).toHaveLength(4);
        } finally {
            await session.close();
        }
    });

    test("multiple users, multiple workspaces, multiple mixed shared pages", async () => {
        const session = driver.session();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        const userIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        // current relationship on where checks *all* nodes hold true
        // so all members/admins of workspace must have matching jwt sub
        // for now, don't add u0 as member of workspaces so constraint holds
        await session.run(
            `CREATE (u0:User {id: $u0id, authId: $u0id}),
                (u1:User {id: $u1id, authId: $u1id}),
                (w1:Workspace {id: $w0id}),
                (w2:Workspace {id: $w1id}),
                (p0:Page {id: $p0id, shared: true}),
                (p1:Page {id: $p1id, shared: false}),
                (p2:Page {id: $p2id, shared: true}),
                (p3:Page {id: $p3id, shared: false}),
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
            expect((usersResult?.data as any)?.users).toHaveLength(1);
            expect((usersResult?.data as any)?.users[0]?.createdPages).toHaveLength(0);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.workspaces).toHaveLength(1);
            expect((workspacesResult?.data as any)?.workspaces[0]?.pages).toHaveLength(1);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.pages).toHaveLength(1);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.pages).toHaveLength(2);
        } finally {
            await session.close();
        }
    });

    test("multiple users, multiple workspaces, multiple private pages", async () => {
        const session = driver.session();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        const userIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        // current relationship on where checks *all* nodes hold true
        // so all members/admins of workspace must have matching jwt sub
        // for now, don't add u0 as member of workspaces so constraint holds
        await session.run(
            `CREATE (u0:User {id: $u0id, authId: $u0id}),
                (u1:User {id: $u1id, authId: $u1id}),
                (w1:Workspace {id: $w0id}),
                (w2:Workspace {id: $w1id}),
                (p0:Page {id: $p0id, shared: false}),
                (p1:Page {id: $p1id, shared: false}),
                (p2:Page {id: $p2id, shared: false}),
                (p3:Page {id: $p3id, shared: false}),
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
            expect((usersResult?.data as any)?.users).toHaveLength(1);
            expect((usersResult?.data as any)?.users[0]?.createdPages).toHaveLength(0);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.workspaces).toHaveLength(1);
            expect((workspacesResult?.data as any)?.workspaces[0]?.pages).toHaveLength(0);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.pages).toHaveLength(0);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.pages).toHaveLength(0);
        } finally {
            await session.close();
        }
    });

    test("multiple users, multiple workspaces where not member, multiple shared pages", async () => {
        const session = driver.session();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        const userIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        // current relationship on where checks *all* nodes hold true
        // so all members/admins of workspace must have matching jwt sub
        // for now, don't add u0 as member of workspaces so constraint holds
        await session.run(
            `CREATE (u0:User {id: $u0id, authId: $u0id}),
                (u1:User {id: $u1id, authId: $u1id}),
                (w1:Workspace {id: $w0id}),
                (w2:Workspace {id: $w1id}),
                (p0:Page {id: $p0id, shared: true}),
                (p1:Page {id: $p1id, shared: true}),
                (p2:Page {id: $p2id, shared: true}),
                (p3:Page {id: $p3id, shared: true}),
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
            expect((usersResult?.data as any)?.users).toHaveLength(1);
            expect((usersResult?.data as any)?.users[0]?.createdPages).toHaveLength(0);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.workspaces).toHaveLength(0);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.pages).toHaveLength(0);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.pages).toHaveLength(0);
        } finally {
            await session.close();
        }
    });

    test("multiple users, multiple workspaces with partial membership, multiple shared pages", async () => {
        const session = driver.session();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        const userIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        // current relationship on where checks *all* nodes hold true
        // so all members/admins of workspace must have matching jwt sub
        // for now, don't add u0 as member of workspaces so constraint holds
        await session.run(
            `CREATE (u0:User {id: $u0id, authId: $u0id}),
                (u1:User {id: $u1id, authId: $u1id}),
                (w1:Workspace {id: $w0id}),
                (w2:Workspace {id: $w1id}),
                (p0:Page {id: $p0id, shared: true}),
                (p1:Page {id: $p1id, shared: true}),
                (p2:Page {id: $p2id, shared: true}),
                (p3:Page {id: $p3id, shared: true}),
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
            expect((usersResult?.data as any)?.users).toHaveLength(1);
            expect((usersResult?.data as any)?.users[0]?.createdPages).toHaveLength(0);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.workspaces).toHaveLength(1);
            expect((workspacesResult?.data as any)?.workspaces[0]?.pages).toHaveLength(2);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.pages).toHaveLength(2);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.pages).toHaveLength(2);
        } finally {
            await session.close();
        }
    });

    test("multiple users, multiple workspaces with partial membership, multiple mixed shared pages", async () => {
        const session = driver.session();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        const userIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const workspaceIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));
        const pageIds = Array(4)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        // current relationship on where checks *all* nodes hold true
        // so all members/admins of workspace must have matching jwt sub
        // for now, don't add u0 as member of workspaces so constraint holds
        await session.run(
            `CREATE (u0:User {id: $u0id, authId: $u0id}),
                (u1:User {id: $u1id, authId: $u1id}),
                (w1:Workspace {id: $w0id}),
                (w2:Workspace {id: $w1id}),
                (p0:Page {id: $p0id, shared: false}),
                (p1:Page {id: $p1id, shared: false}),
                (p2:Page {id: $p2id, shared: true}),
                (p3:Page {id: $p3id, shared: true}),
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
            expect((usersResult?.data as any)?.users).toHaveLength(1);
            expect((usersResult?.data as any)?.users[0]?.createdPages).toHaveLength(0);

            expect(workspacesResult?.errors).toBeFalsy();
            expect((workspacesResult?.data as any)?.workspaces).toHaveLength(1);
            expect((workspacesResult?.data as any)?.workspaces[0]?.pages).toHaveLength(0);

            expect(pagesResult?.errors).toBeFalsy();
            expect(pagesResult?.data?.pages).toHaveLength(0);

            expect(allPagesResult?.errors).toBeFalsy();
            expect(allPagesResult?.data?.pages).toHaveLength(0);
        } finally {
            await session.close();
        }
    });
});
