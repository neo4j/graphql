/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
