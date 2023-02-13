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

import { Neo4jGraphQLAuthJWKSPlugin } from "@neo4j/graphql-plugin-auth";
import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import type { JWKSMock } from "mock-jwks";
import createJWKSMock from "mock-jwks";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import type { Neo4jGraphQLAuthenticationError } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("Global authentication - Auth JWKS plugin", () => {
    let jwksMock: JWKSMock;
    let driver: Driver;
    let neo4j: Neo4j;

    const testMovie = new UniqueType("Movie");

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

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(() => {
        // This creates a local Public Key Infrastructure (PKI)
        jwksMock = createJWKSMock("https://myAuthTest.auth0.com");
    });

    afterEach(() => {
        jwksMock.stop();
    });

    test("should fail if no JWT token is present and global authentication is enabled", async () => {
        const neoSchema = new Neo4jGraphQL({
            driver,
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWKSPlugin({
                    jwksOptions: {
                        jwksUri: "https://myAuthTest.auth0.com/.well-known/jwks.json",
                    },
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
                el.message.includes("Unauthenticated")
            )
        ).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });

    test("should fail if invalid JWT token is provided and global authentication is enabled", async () => {
        const neoSchema = new Neo4jGraphQL({
            driver,
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWKSPlugin({
                    jwksOptions: {
                        jwksUri: "https://myAuthTest.auth0.com/.well-known/jwks.json",
                    },
                    globalAuthentication: true,
                }),
            },
        });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({
                request: {
                    headers: { Authorization: `Bearer xxx.invalidtoken.xxxx` },
                },
            }),
        });

        expect(gqlResult.errors).toBeDefined();
        expect(
            (gqlResult.errors as unknown as Neo4jGraphQLAuthenticationError[]).some((el) =>
                el.message.includes("Unauthenticated")
            )
        ).toBeTruthy();
        expect(gqlResult.data).toBeNull();
    });

    test("should not fail if valid JWT token is present and global authentication is enabled", async () => {
        const neoSchema = new Neo4jGraphQL({
            driver,
            typeDefs,
            plugins: {
                auth: new Neo4jGraphQLAuthJWKSPlugin({
                    jwksOptions: {
                        jwksUri: "https://myAuthTest.auth0.com/.well-known/jwks.json",
                    },
                    globalAuthentication: true,
                }),
            },
        });

        jwksMock.start();

        const accessToken = jwksMock.token({
            iat: 1600000000,
        });

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({
                request: {
                    headers: { Authorization: `Bearer ${accessToken}` },
                },
            }),
        });

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)[testMovie.plural]).toHaveLength(0);
    });
});
