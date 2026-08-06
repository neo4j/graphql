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

import { createBearerToken } from "../../../../../tests/utils/create-bearer-token";
import { Neo4jGraphQLAuthorization } from "../../../../classes/authorization/Neo4jGraphQLAuthorization";
import { getAuthorizationContext } from "./get-authorization-context";

function createUnsignedToken(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    return `Bearer ${header}.${body}.`;
}

describe("getAuthorizationContext", () => {
    const secret = "secret";

    test("does not trust a pre-decoded jwt supplied through the untrusted input channel", async () => {
        const context = await getAuthorizationContext({ jwt: { sub: "user" } }, undefined);
        expect(context.isAuthenticated).toBe(false);
        expect(context.jwt).toBeUndefined();
    });

    test("does not trust a pre-decoded jwt from untrusted input even when authorization is configured", async () => {
        const context = await getAuthorizationContext(
            { jwt: { sub: "user" } },
            new Neo4jGraphQLAuthorization({ key: secret })
        );
        expect(context.isAuthenticated).toBe(false);
        expect(context.jwt).toBeUndefined();
    });

    test("verifies and honours a validly signed token", async () => {
        const context = await getAuthorizationContext(
            { token: createBearerToken(secret, { sub: "user" }) },
            new Neo4jGraphQLAuthorization({ key: secret })
        );
        expect(context.isAuthenticated).toBe(true);
        expect(context.jwt?.sub).toBe("user");
    });

    test("rejects an unsigned (alg:none) token", async () => {
        const context = await getAuthorizationContext(
            { token: createUnsignedToken({ sub: "user" }) },
            new Neo4jGraphQLAuthorization({ key: secret })
        );
        expect(context.isAuthenticated).toBe(false);
        expect(context.jwt).toBeUndefined();
    });

    test("rejects a token signed with the wrong key", async () => {
        const context = await getAuthorizationContext(
            { token: createBearerToken("wrong-secret", { sub: "user" }) },
            new Neo4jGraphQLAuthorization({ key: secret })
        );
        expect(context.isAuthenticated).toBe(false);
        expect(context.jwt).toBeUndefined();
    });

    test("returns an unauthenticated context when no token and no jwt are provided", async () => {
        const context = await getAuthorizationContext({}, new Neo4jGraphQLAuthorization({ key: secret }));
        expect(context.isAuthenticated).toBe(false);
        expect(context.jwt).toBeUndefined();
    });

    test("returns an unauthenticated context for a token when authorization is not configured", async () => {
        const context = await getAuthorizationContext({ token: createBearerToken(secret, { sub: "user" }) }, undefined);
        expect(context.isAuthenticated).toBe(false);
    });

    test("honours a pre-decoded jwt supplied through the dedicated trusted channel", async () => {
        const context = await getAuthorizationContext({}, undefined, undefined, { sub: "user" });
        expect(context.isAuthenticated).toBe(true);
        expect(context.jwt?.sub).toBe("user");
    });
});
