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

describe("getAuthorizationContext", () => {
    const secret = "secret";

    test("no authorization settings and token returns unauthorized context", async () => {
        const context = await getAuthorizationContext({ token: createBearerToken(secret, { sub: "user" }) }, undefined);
        expect(context.isAuthenticated).toBe(false);
    });

    test("no authorization settings and jwt returns authorized context", async () => {
        const context = await getAuthorizationContext({ jwt: { sub: "user" } }, undefined);
        expect(context.isAuthenticated).toBe(true);
        expect(context.jwt?.sub).toBe("user");
    });

    test("authorization settings but no jwt or token returns unauthorized context", async () => {
        const context = await getAuthorizationContext({}, new Neo4jGraphQLAuthorization({ key: secret }));
        expect(context.isAuthenticated).toBe(false);
    });

    test("decoded jwt returns authorized context", async () => {
        const context = await getAuthorizationContext(
            { jwt: { sub: "user" } },
            new Neo4jGraphQLAuthorization({ key: secret })
        );
        expect(context.isAuthenticated).toBe(true);
        expect(context.jwt?.sub).toBe("user");
    });

    test("token returns authorized context", async () => {
        const context = await getAuthorizationContext(
            { token: createBearerToken(secret, { sub: "user" }) },
            new Neo4jGraphQLAuthorization({ key: secret })
        );
        expect(context.isAuthenticated).toBe(true);
        expect(context.jwt?.sub).toBe("user");
    });

    test("decoded jwt and token returns authorized context using jwt", async () => {
        const context = await getAuthorizationContext(
            { jwt: { sub: "user1" }, token: createBearerToken(secret, { sub: "user2" }) },
            new Neo4jGraphQLAuthorization({ key: secret })
        );
        expect(context.isAuthenticated).toBe(true);
        expect(context.jwt?.sub).toBe("user1");
    });
});
