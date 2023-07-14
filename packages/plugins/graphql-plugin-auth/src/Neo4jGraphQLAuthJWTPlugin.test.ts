import { AUTH_JWT_PLUGIN_NULL_SECRET_EXCEPTION } from "./exceptions";
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

import * as jsonwebtoken from "jsonwebtoken";
import Neo4jGraphQLAuthJWTPlugin from "./Neo4jGraphQLAuthJWTPlugin";

describe("Neo4jGraphQLAuthJWTPlugin", () => {
    const secret = "secret";
    const payload = {
        sub: "my-id",
    };
    test("should decode token", async () => {
        const encoded = jsonwebtoken.sign(payload, secret);

        const plugin = new Neo4jGraphQLAuthJWTPlugin({
            secret,
        });

        const decoded = await plugin.decode(encoded);

        expect(decoded).toMatchObject(payload);
    });

    test("should decode token when secret is a generic", async () => {
        const encoded = jsonwebtoken.sign(payload, secret);

        const plugin = new Neo4jGraphQLAuthJWTPlugin({
            secret: () => {
                return secret;
            },
        });

        plugin.tryToResolveKeys({
            headers: {
                test: "test-header",
            },
        });

        const decoded = await plugin.decode(encoded);

        expect(decoded).toMatchObject(payload);
    });

    test(`should throw '${AUTH_JWT_PLUGIN_NULL_SECRET_EXCEPTION}' exception, when a function for calculating the secret is passed but the result is null`, async () => {
        const encoded = jsonwebtoken.sign(payload, secret);

        const plugin = new Neo4jGraphQLAuthJWTPlugin({
            secret: () => {
                return secret;
            },
        });

        await expect(async () => {
            await plugin.decode(encoded);
        }).rejects.toEqual(AUTH_JWT_PLUGIN_NULL_SECRET_EXCEPTION);
    });

    test("should decode token when using noVerify", async () => {
        const encoded = jsonwebtoken.sign(payload, secret);

        const plugin = new Neo4jGraphQLAuthJWTPlugin({
            secret,
            noVerify: true,
        });

        const decoded = await plugin.decode(encoded);

        expect(decoded).toMatchObject(payload);
    });

    test("should decode JWT token with globalAuthentication enabled", async () => {
        const encoded = jsonwebtoken.sign(payload, secret);

        const plugin = new Neo4jGraphQLAuthJWTPlugin({
            secret,
            globalAuthentication: true,
        });

        const decoded = await plugin.decode(encoded);

        expect(decoded).toMatchObject(payload);
    });

    test("should throw an error if both noVerify and globalAuthentication are enabled", async () => {
        let initError: unknown = null;
        try {
            const payload = {
                sub: "my-id",
            };

            const encoded = jsonwebtoken.sign(payload, secret);

            const plugin = new Neo4jGraphQLAuthJWTPlugin({
                secret,
                noVerify: true,
                globalAuthentication: true,
            });

            const decoded = await plugin.decode(encoded);

            expect(decoded).toMatchObject(payload);
        } catch (error) {
            initError = error;
        }

        expect(initError).toBeDefined();
        expect((initError as Error).message).toBe(
            "Neo4jGraphQLAuthJWTPlugin, noVerify and globalAuthentication can not both be enabled simultaneously."
        );
    });

    test("should decode token and verify issuer", async () => {
        const payload = {
            sub: "my-id",
            iss: "https://testcompany.com",
        };
        const encoded = jsonwebtoken.sign(payload, secret);

        const plugin = new Neo4jGraphQLAuthJWTPlugin({
            secret,
            issuer: "https://testcompany.com",
        });

        const decoded = await plugin.decode(encoded);

        expect(decoded).toMatchObject(payload);
    });

    test("decode function should return undefined if token contains a different issuer than specified in Neo4jGraphQLAuthJWTPlugin", async () => {
        const payload = {
            sub: "my-id",
            iss: "https://testcompany.com",
        };
        const encoded = jsonwebtoken.sign(payload, secret);

        const plugin = new Neo4jGraphQLAuthJWTPlugin({
            secret,
            issuer: "https://anothercomapny.com",
        });

        const decoded = await plugin.decode(encoded);

        expect(decoded).toBeUndefined();
    });

    test("should decode token and verify audience", async () => {
        const payload = {
            sub: "my-id",
            aud: "urn:user",
        };
        const encoded = jsonwebtoken.sign(payload, secret);

        const plugin = new Neo4jGraphQLAuthJWTPlugin({
            secret,
            audience: "urn:user",
        });

        const decoded = await plugin.decode(encoded);

        expect(decoded).toMatchObject(payload);
    });

    test("decode function should return undefined if token contains a different audience than specified in Neo4jGraphQLAuthJWTPlugin", async () => {
        const payload = {
            sub: "my-id",
            aud: "urn:user",
        };
        const encoded = jsonwebtoken.sign(payload, secret);

        const plugin = new Neo4jGraphQLAuthJWTPlugin({
            secret,
            audience: "urn:otheruser",
        });

        const decoded = await plugin.decode(encoded);

        expect(decoded).toBeUndefined();
    });
});
