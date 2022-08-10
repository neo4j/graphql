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
import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL, Neo4jGraphQLAuthenticationError } from "../../../src/classes";
import { generateUniqueType } from "../../utils/graphql-types";
import { createJwtRequest } from "../../utils/create-jwt-request";

describe("Global authentication", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("Auth plugin", () => {
        const secret = "secret";
        const testMovie = generateUniqueType("Movie");

        const typeDefs = `
            type ${testMovie} {
                name: String
            }
        `;

        const query = `
            {
                ${testMovie.plural} {
                    name
                }
            }
        `;

        test("should fail if no JWT token is present and global authentication is set", async () => {
            const neoSchema = new Neo4jGraphQL({
                driver,
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                        globalAuthentication: true,
                    }),
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
                    el.message.includes("Global authentication requires a valid JWT token")
                )
            ).toBeTruthy();
            expect(gqlResult.data).toBeNull();
        });

        test("should fail if invalid JWT token is present and global authentication is set", async () => {
            const neoSchema = new Neo4jGraphQL({
                driver,
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                        globalAuthentication: true,
                    }),
                },
            });

            const req = { headers: { authorization: "Bearer xxx.invalidtoken.xxx" } };

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ req }),
            });

            expect(gqlResult.errors).toBeDefined();
            expect(
                (gqlResult.errors as unknown as Neo4jGraphQLAuthenticationError[]).some((el) =>
                    el.message.includes("Global authentication requires a valid JWT token")
                )
            ).toBeTruthy();
            expect(gqlResult.data).toBeNull();
        });

        test("should fail if noVerify and global authentication are both set to true", async () => {
            let initError: Error | null | unknown;
            try {
                const neoSchema = new Neo4jGraphQL({
                    driver,
                    typeDefs,
                    plugins: {
                        auth: new Neo4jGraphQLAuthJWTPlugin({
                            secret,
                            noVerify: true,
                            globalAuthentication: true,
                        }),
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
            expect(
                (initError as Error)?.message.includes(
                    "Neo4jGraphQLAuthJWTPlugin: noVerify and globalAuthentication can not both be set to 'true' simultaneously."
                )
            ).toBeTruthy();
        });

        test("should not fail if noVerify is true and global authentication is false", async () => {
            let initError: Error | null | unknown;
            try {
                const neoSchema = new Neo4jGraphQL({
                    driver,
                    typeDefs,
                    plugins: {
                        auth: new Neo4jGraphQLAuthJWTPlugin({
                            secret,
                            noVerify: false,
                            globalAuthentication: true,
                        }),
                    },
                });

                const req = createJwtRequest(secret, { sub: "test" });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ req }),
                });
                expect(gqlResult.errors).toBeUndefined();
                expect((gqlResult.data as any)[testMovie.plural]).toHaveLength(0);
            } catch (error) {
                initError = error;
            }

            expect(initError).toBeUndefined();
        });

        test("should not fail if JWT token is present and global authentication is set", async () => {
            const neoSchema = new Neo4jGraphQL({
                driver,
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                        globalAuthentication: true,
                    }),
                },
            });

            const req = createJwtRequest(secret, { sub: "test" });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ req }),
            });

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[testMovie.plural]).toHaveLength(0);
        });
    });

    // TODO: =====>>> JWKS plugin test
});
