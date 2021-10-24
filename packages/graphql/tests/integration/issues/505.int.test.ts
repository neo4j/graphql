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
import { gql } from "apollo-server";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/505", () => {
    let driver: Driver;
    // Update to use _INCLUDES once https://github.com/neo4j/graphql/pull/500 is merged
    const typeDefs = gql`
        type Person {
            id: ID! @id(autogenerate: false)
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
                        where: {
                            OR: [
                                {
                                    members: {
                                        authId: """
                                        $jwt.sub
                                        """
                                    }
                                }
                                {
                                    admins: {
                                        authId: """
                                        $jwt.sub
                                        """
                                    }
                                }
                            ]
                        }
                    }
                ]
            )
            @exclude(operations: [CREATE, UPDATE]) {
            id: ID! @id(autogenerate: false)
            name: String!
            members: [Person!] @relationship(type: "MEMBER_OF", direction: IN)
            admins: [Person!] @relationship(type: "HAS_ADMIN", direction: OUT)
            pages: [Page!] @relationship(type: "HAS_PAGE", direction: OUT)
        }

        type Page
            @auth(
                rules: [
                    {
                        operations: [READ]
                        where: {
                            OR: [
                                {
                                    owner: {
                                        authId: """
                                        $jwt.sub
                                        """
                                    }
                                }
                                {
                                    AND: [
                                        { shared: true }
                                        {
                                            workspace: {
                                                OR: [
                                                    {
                                                        members: {
                                                            authId: """
                                                            $jwt.sub
                                                            """
                                                        }
                                                    }
                                                    {
                                                        admins: {
                                                            authId: """
                                                            $jwt.sub
                                                            """
                                                        }
                                                    }
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
            id: ID! @id(autogenerate: false)

            shared: Boolean!

            owner: Person! @relationship(type: "CREATED_PAGE", direction: IN)

            workspace: Workspace! @relationship(type: "HAS_PAGE", direction: IN)
        }
    `;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("single user, single workspace, multiple pages", async () => {
        const session = driver.session();
        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });
        const userId = generate({ charset: "alphabetic" });
        const workspaceId = generate({ charset: "alphabetic" });
        const pageIds = Array(2)
            .fill(0)
            .map(() => generate({ charset: "alphabetic" }));

        await session.run(
            `CREATE (u:Person {id: $userId, authId: $userId}),
                (w:Workspace {id: $workspaceId}),
                (p0:Page {id: $p0id}),
                (p1:Page {id: $p1id}),
                (u)-[:MEMBER_OF]->(w),
                (w)-[:HAS_PAGE]->(p0),
                (w)-[:HAS_PAGE]->(p1),
                (u)-[:CREATED_PAGE]->(p0),
                (u)-[:CREATED_PAGE]->(p1)
            `,
            { userId, workspaceId, p0id: pageIds[0], p1id: pageIds[1] }
        );

        const variableValues = {
            userId,
            workspaceId,
        };

        const mutation = `
            query PeopleWorkspaceAndPages($userId: ID!, $workspaceId: ID!) {
                people(where: { id: $userId } ) {
                    createdPages {
                        id
                    }
                }

                workspaces(where: { id: $workspaceId })
                {
                    pages {
                        id
                    }
                }

                pages(where: { workspace: { id: $workspaceId } } ) {
                    id
                }

                allPages: pages {
                    id
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const mutationResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
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

            expect(mutationResult.errors).toBeFalsy();

            expect(mutationResult?.data?.people).toHaveLength(1);
            expect(mutationResult?.data?.people[0]?.createdPages).toHaveLength(2);

            expect(mutationResult?.data?.workspaces).toHaveLength(1);
            expect(mutationResult?.data?.workspaces[0]?.pages).toHaveLength(2);

            expect(mutationResult?.data?.pages).toHaveLength(2);

            expect(mutationResult?.data?.allPages).toHaveLength(2);
        } finally {
            await session.close();
        }
    });

    test("single user, multiple workspaces, multiple pages", async () => {
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
            `CREATE (u:Person {id: $userId, authId: $userId}),
                (w1:Workspace {id: $w0id}),
                (w2:Workspace {id: $w1id}),
                (p0:Page {id: $p0id}),
                (p1:Page {id: $p1id}),
                (p2:Page {id: $p2id}),
                (p3:Page {id: $p3id}),
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

        const mutation = `
            query PeopleWorkspaceAndPages($userId: ID!, $workspaceId: ID!) {
                people(where: { id: $userId } ) {
                    createdPages {
                        id
                    }
                }

                workspaces(where: { id: $workspaceId })
                {
                    pages {
                        id
                    }
                }

                pages(where: { workspace: { id: $workspaceId } } ) {
                    id
                }

                allPages: pages {
                    id
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const mutationResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
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

            expect(mutationResult.errors).toBeFalsy();

            expect(mutationResult?.data?.people).toHaveLength(1);
            expect(mutationResult?.data?.people[0]?.createdPages).toHaveLength(4);

            expect(mutationResult?.data?.workspaces).toHaveLength(1);
            expect(mutationResult?.data?.workspaces[0]?.pages).toHaveLength(2);

            expect(mutationResult?.data?.pages).toHaveLength(2);

            expect(mutationResult?.data?.allPages).toHaveLength(4);
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
            `CREATE (u0:Person {id: $u0id, authId: $u0id}),
                (u1:Person {id: $u1id, authId: $u1id}),
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

        const mutation = `
            query PeopleWorkspaceAndPages($userId: ID!, $workspaceId: ID!) {
                people(where: { id: $userId } ) {
                    createdPages {
                        id
                    }
                }

                workspaces(where: { id: $workspaceId })
                {
                    pages {
                        id
                    }
                }

                pages(where: { workspace: { id: $workspaceId } } ) {
                    id
                }

                allPages: pages {
                    id
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const mutationResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: {
                    driver,
                    driverConfig: {
                        bookmarks: session.lastBookmark(),
                    },
                    jwt: {
                        sub: userIds[1],
                    },
                },
                variableValues,
            });

            expect(mutationResult.errors).toBeFalsy();

            expect(mutationResult?.data?.people).toHaveLength(1);
            expect(mutationResult?.data?.people[0]?.createdPages).toHaveLength(0);

            expect(mutationResult?.data?.workspaces).toHaveLength(1);
            expect(mutationResult?.data?.workspaces[0]?.pages).toHaveLength(2);

            expect(mutationResult?.data?.pages).toHaveLength(2);

            expect(mutationResult?.data?.allPages).toHaveLength(4);
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
            `CREATE (u0:Person {id: $u0id, authId: $u0id}),
                (u1:Person {id: $u1id, authId: $u1id}),
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

        const mutation = `
            query PeopleWorkspaceAndPages($userId: ID!, $workspaceId: ID!) {
                people(where: { id: $userId } ) {
                    createdPages {
                        id
                    }
                }

                workspaces(where: { id: $workspaceId })
                {
                    pages {
                        id
                    }
                }

                pages(where: { workspace: { id: $workspaceId } } ) {
                    id
                }

                allPages: pages {
                    id
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const mutationResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: {
                    driver,
                    driverConfig: {
                        bookmarks: session.lastBookmark(),
                    },
                    jwt: {
                        sub: userIds[1],
                    },
                },
                variableValues,
            });

            expect(mutationResult.errors).toBeFalsy();

            expect(mutationResult?.data?.people).toHaveLength(1);
            expect(mutationResult?.data?.people[0]?.createdPages).toHaveLength(0);

            expect(mutationResult?.data?.workspaces).toHaveLength(1);
            expect(mutationResult?.data?.workspaces[0]?.pages).toHaveLength(1);

            expect(mutationResult?.data?.pages).toHaveLength(1);

            expect(mutationResult?.data?.allPages).toHaveLength(2);
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
            `CREATE (u0:Person {id: $u0id, authId: $u0id}),
                (u1:Person {id: $u1id, authId: $u1id}),
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

        const mutation = `
            query PeopleWorkspaceAndPages($userId: ID!, $workspaceId: ID!) {
                people(where: { id: $userId } ) {
                    createdPages {
                        id
                    }
                }

                workspaces(where: { id: $workspaceId })
                {
                    pages {
                        id
                    }
                }

                pages(where: { workspace: { id: $workspaceId } } ) {
                    id
                }

                allPages: pages {
                    id
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const mutationResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: {
                    driver,
                    driverConfig: {
                        bookmarks: session.lastBookmark(),
                    },
                    jwt: {
                        sub: userIds[1],
                    },
                },
                variableValues,
            });

            expect(mutationResult.errors).toBeFalsy();

            expect(mutationResult?.data?.people).toHaveLength(1);
            expect(mutationResult?.data?.people[0]?.createdPages).toHaveLength(0);

            expect(mutationResult?.data?.workspaces).toHaveLength(1);
            expect(mutationResult?.data?.workspaces[0]?.pages).toHaveLength(0);

            expect(mutationResult?.data?.pages).toHaveLength(0);

            expect(mutationResult?.data?.allPages).toHaveLength(0);
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
            `CREATE (u0:Person {id: $u0id, authId: $u0id}),
                (u1:Person {id: $u1id, authId: $u1id}),
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

        const mutation = `
            query PeopleWorkspaceAndPages($userId: ID!, $workspaceId: ID!) {
                people(where: { id: $userId } ) {
                    createdPages {
                        id
                    }
                }

                workspaces(where: { id: $workspaceId })
                {
                    pages {
                        id
                    }
                }

                pages(where: { workspace: { id: $workspaceId } } ) {
                    id
                }

                allPages: pages {
                    id
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const mutationResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: {
                    driver,
                    driverConfig: {
                        bookmarks: session.lastBookmark(),
                    },
                    jwt: {
                        sub: userIds[1],
                    },
                },
                variableValues,
            });

            expect(mutationResult.errors).toBeFalsy();

            expect(mutationResult?.data?.people).toHaveLength(1);
            expect(mutationResult?.data?.people[0]?.createdPages).toHaveLength(0);

            expect(mutationResult?.data?.workspaces).toHaveLength(0);

            expect(mutationResult?.data?.pages).toHaveLength(0);

            expect(mutationResult?.data?.allPages).toHaveLength(0);
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
            `CREATE (u0:Person {id: $u0id, authId: $u0id}),
                (u1:Person {id: $u1id, authId: $u1id}),
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

        const mutation = `
            query PeopleWorkspaceAndPages($userId: ID!, $workspaceId: ID!) {
                people(where: { id: $userId } ) {
                    createdPages {
                        id
                    }
                }

                workspaces(where: { id: $workspaceId })
                {
                    pages {
                        id
                    }
                }

                pages(where: { workspace: { id: $workspaceId } } ) {
                    id
                }

                allPages: pages {
                    id
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const mutationResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: {
                    driver,
                    driverConfig: {
                        bookmarks: session.lastBookmark(),
                    },
                    jwt: {
                        sub: userIds[1],
                    },
                },
                variableValues,
            });

            expect(mutationResult.errors).toBeFalsy();

            expect(mutationResult?.data?.people).toHaveLength(1);
            expect(mutationResult?.data?.people[0]?.createdPages).toHaveLength(0);

            expect(mutationResult?.data?.workspaces).toHaveLength(1);
            expect(mutationResult?.data?.workspaces[0]?.pages).toHaveLength(2);

            expect(mutationResult?.data?.pages).toHaveLength(2);

            expect(mutationResult?.data?.allPages).toHaveLength(2);
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
            `CREATE (u0:Person {id: $u0id, authId: $u0id}),
                (u1:Person {id: $u1id, authId: $u1id}),
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

        const mutation = `
            query PeopleWorkspaceAndPages($userId: ID!, $workspaceId: ID!) {
                people(where: { id: $userId } ) {
                    createdPages {
                        id
                    }
                }

                workspaces(where: { id: $workspaceId })
                {
                    pages {
                        id
                    }
                }

                pages(where: { workspace: { id: $workspaceId } } ) {
                    id
                }

                allPages: pages {
                    id
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const mutationResult = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: {
                    driver,
                    driverConfig: {
                        bookmarks: session.lastBookmark(),
                    },
                    jwt: {
                        sub: userIds[1],
                    },
                },
                variableValues,
            });

            expect(mutationResult.errors).toBeFalsy();

            expect(mutationResult?.data?.people).toHaveLength(1);
            expect(mutationResult?.data?.people[0]?.createdPages).toHaveLength(0);

            expect(mutationResult?.data?.workspaces).toHaveLength(1);
            expect(mutationResult?.data?.workspaces[0]?.pages).toHaveLength(0);

            expect(mutationResult?.data?.pages).toHaveLength(0);

            expect(mutationResult?.data?.allPages).toHaveLength(0);
        } finally {
            await session.close();
        }
    });
});
