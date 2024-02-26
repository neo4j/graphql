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
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import type { Neo4jGraphQLAuthenticationError } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("Global authentication - Authorization JWT plugin", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;

    const secret = "secret";
    const testMovie = new UniqueType("Movie");

    const typeDefs = `
        type ${testMovie} {
            name: String
        }
        extend schema @authentication
    `;

    const query = `
        {
            ${testMovie.plural} {
                name
            }
        }
    `;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should fail if no JWT token is present and global authentication is enabled", async () => {
        const neoSchema = new Neo4jGraphQL({
            driver,
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as unknown as Neo4jGraphQLAuthenticationError[]).some((el) =>
                el.message.includes("Unauthenticated")
            )
        ).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });

    test("should fail if invalid JWT token is present and global authentication is enabled", async () => {
        const neoSchema = new Neo4jGraphQL({
            driver,
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token: "Bearer xxx.invalidtoken.xxx" }),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as unknown as Neo4jGraphQLAuthenticationError[]).some((el) =>
                el.message.includes("Unauthenticated")
            )
        ).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });

    test("should fail if a JWT token with a wrong secret is present and global authentication is enabled", async () => {
        const neoSchema = new Neo4jGraphQL({
            driver,
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const token = createBearerToken("wrong-secret", { sub: "test" });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as unknown as Neo4jGraphQLAuthenticationError[]).some((el) =>
                el.message.includes("Unauthenticated")
            )
        ).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });

    test("should not throw a different error if noVerify and global authentication are both enabled", async () => {
        let initError: unknown;
        try {
            const neoSchema = new Neo4jGraphQL({
                driver,
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                        verify: false,
                    },
                },
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });
            expect(gqlResult.errors).toBeUndefined();
        } catch (error) {
            initError = error;
        }

        expect(initError).toBeDefined();
        expect((initError as Error)?.message).toInclude("Unauthenticated");
    });

    test("should not fail if noVerify is false and global authentication is true", async () => {
        let initError: unknown;
        try {
            const neoSchema = new Neo4jGraphQL({
                driver,
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                },
            });

            const token = createBearerToken(secret, { sub: "test" });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ token }),
            });
            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[testMovie.plural]).toHaveLength(0);
        } catch (error) {
            initError = error;
        }

        expect(initError).toBeUndefined();
    });

    test("should not fail if valid JWT token is present and global authentication is enabled", async () => {
        const neoSchema = new Neo4jGraphQL({
            driver,
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        const token = createBearerToken(secret, { sub: "test" });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[testMovie.plural]).toHaveLength(0);
    });
});
