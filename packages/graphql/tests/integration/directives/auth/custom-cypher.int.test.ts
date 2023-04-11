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
import { Neo4jGraphQL } from "../../../../src/classes";
import Neo4j from "../../neo4j";
import { createJwtRequest } from "../../../utils/create-jwt-request";

describe("should inject the auth into cypher directive", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    const secret = "secret";

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("query", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Query {
                userId: ID @cypher(statement: """
                    RETURN $auth.jwt.sub as res
                """, columnName: "res")
            }
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
            {
                userId
            }
        `;

        try {
            const req = createJwtRequest(secret, { sub: userId });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query as string,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
            });

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).userId).toEqual(userId);
        } finally {
            await session.close();
        }
    });

    test("query (decoded JWT)", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Query {
                userId: ID @cypher(statement: """
                    RETURN $auth.jwt.sub as res
                """, columnName: "res")
            }
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            {
                userId
            }
        `;

        const jwt = {
            sub: userId,
            name: "John Doe",
            iat: 1516239022,
        };

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query as string,
                contextValue: neo4j.getContextValues({ jwt }),
            });

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).userId).toEqual(userId);
        } finally {
            await session.close();
        }
    });

    test("mutation", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type User {
                id: ID
            }

            type Mutation {
                userId: ID @cypher(statement: """
                    RETURN $auth.jwt.sub as res
                """, columnName: "res")
            }
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
            mutation {
                userId
            }
        `;

        try {
            const req = createJwtRequest(secret, { sub: userId });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query as string,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
            });

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).userId).toEqual(userId);
        } finally {
            await session.close();
        }
    });

    test("mutation (decoded JWT)", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type User {
                id: ID
            }

            type Mutation {
                userId: ID @cypher(statement: """
                    RETURN $auth.jwt.sub as res
                """, columnName: "res")
            }
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const jwt = {
            sub: userId,
            name: "John Doe",
            iat: 1516239022,
        };

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            mutation {
                userId
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query as string,
                contextValue: neo4j.getContextValues({ jwt }),
            });

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).userId).toEqual(userId);
        } finally {
            await session.close();
        }
    });

    test("should inject the auth into cypher directive on fields", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type User {
                id: ID
                userId: ID @cypher(statement: """
                    WITH $auth.jwt.sub as a
                    RETURN a
                """, columnName: "a")
            }
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const query = `
        {
             users(where: {id: "${userId}"}){
                userId
            }
        }
        `;

        try {
            await session.run(`
                CREATE (:User {id: "${userId}"})
            `);

            const req = createJwtRequest(secret, { sub: userId });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
            });

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).users[0].userId).toEqual(userId);
        } finally {
            await session.close();
        }
    });

    test("should inject the auth into cypher directive on fields (decoded JWT)", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type User {
                id: ID
                userId: ID @cypher(statement: """
                    WITH $auth.jwt.sub as a
                    RETURN a
                """, columnName: "a")
            }
        `;

        const userId = generate({
            charset: "alphabetic",
        });

        const jwt = {
            sub: userId,
            name: "John Doe",
            iat: 1516239022,
        };

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
        {
             users(where: {id: "${userId}"}){
                userId
            }
        }
        `;

        try {
            await session.run(`
                CREATE (:User {id: "${userId}"})
            `);

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ jwt }),
            });

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).users[0].userId).toEqual(userId);
        } finally {
            await session.close();
        }
    });
});
