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
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { createJwtRequest } from "../utils/create-jwt-request";
import { generateUniqueType } from "../utils/graphql-types";

describe("count", () => {
    let driver: Driver;
    const secret = "secret";

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should count nodes", async () => {
        const session = driver.session();

        const randomType = generateUniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:${randomType.name} {id: randomUUID()})
                    CREATE (:${randomType.name} {id: randomUUID()})
                `
            );

            const query = `
                {
                    ${randomType.operations.count}
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[randomType.operations.count]).toBe(2);
        } finally {
            await session.close();
        }
    });

    test("should movie nodes with where predicate", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id1 = generate({
            charset: "alphabetic",
        });

        const id2 = generate({
            charset: "alphabetic",
        });

        try {
            await session.run(
                `
                CREATE (:Movie {id: $id1})
                CREATE (:Movie {id: $id2})
            `,
                { id1, id2 }
            );

            const query = `
                {
                    moviesCount(where: { OR: [{id: "${id1}"}, {id: "${id2}"}] })
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).moviesCount).toBe(2);
        } finally {
            await session.close();
        }
    });

    test("should add auth where (read) to count query", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                id: ID
            }

            type Post {
                id: ID
                creator: User @relationship(type: "POSTED", direction: IN)
            }

            extend type Post @auth(rules: [{ where: { creator: { id: "$jwt.sub" } } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const post1 = generate({
            charset: "alphabetic",
        });

        const post2 = generate({
            charset: "alphabetic",
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        try {
            await session.run(
                `
                    CREATE (u:User {id: $userId})
                    CREATE (u)-[:POSTED]->(:Post {id: $post1})
                    CREATE (u)-[:POSTED]->(:Post {id: $post2})
                    CREATE (:Post {id: randomUUID()})
                `,
                { userId, post1, post2 }
            );

            const query = `
                {
                    postsCount
                }
            `;

            const req = createJwtRequest(secret, { sub: userId });

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).postsCount).toBe(2);
        } finally {
            await session.close();
        }
    });

    test("should throw forbidden with invalid allow on auth (read) while counting", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                id: ID
            }

            extend type User @auth(rules: [{ allow: { id: "$jwt.sub" } }])
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        try {
            await session.run(
                `
                    CREATE (u:User {id: $userId})
                `,
                { userId }
            );

            const query = `
                {
                    usersCount
                }
            `;

            const req = createJwtRequest(secret, { sub: "invalid" });

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        } finally {
            await session.close();
        }
    });
});
