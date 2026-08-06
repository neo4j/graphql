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

import type { GraphQLResolveInfo } from "graphql";
import { createBearerToken } from "../../../../tests/utils/create-bearer-token";
import { Neo4jGraphQLAuthorization } from "../../../classes/authorization/Neo4jGraphQLAuthorization";
import type { Neo4jGraphQLSubscriptionsContext } from "../../../types/neo4j-graphql-subscriptions-context";
import type { Neo4jGraphQLComposedSubscriptionsContext } from "./wrap-subscription";
import { wrapSubscription } from "./wrap-subscription";

const secret = "secret";

function buildArgs(authorization?: Neo4jGraphQLAuthorization): Parameters<typeof wrapSubscription>[0] {
    return {
        schemaModel: {},
        subscriptionsEngine: {},
        authorization,
    } as unknown as Parameters<typeof wrapSubscription>[0];
}

async function runWrappedSubscription(
    resolverArgs: Parameters<typeof wrapSubscription>[0],
    context: Neo4jGraphQLSubscriptionsContext
): Promise<Neo4jGraphQLComposedSubscriptionsContext> {
    let captured: Neo4jGraphQLComposedSubscriptionsContext | undefined;
    const resolver = (_root, _args, ctx: Neo4jGraphQLComposedSubscriptionsContext) => {
        captured = ctx;
        return "resolved";
    };
    const wrapped = wrapSubscription(resolverArgs)(resolver);
    await wrapped({}, {}, context, {} as GraphQLResolveInfo);
    if (!captured) {
        throw new Error("resolver was not invoked");
    }
    return captured;
}

describe("subscription wrapper test", () => {
    test("ignores a client-supplied connectionParams.jwt and does not authenticate", async () => {
        const context = {
            connectionParams: { jwt: { sub: "test" } },
        } as Neo4jGraphQLComposedSubscriptionsContext;

        const captured = await runWrappedSubscription(buildArgs(new Neo4jGraphQLAuthorization({ key: secret })), context);

        expect(captured.authorization.isAuthenticated).toBe(false);
        expect(captured.authorization.jwt).toBeUndefined();
        expect(captured.connectionParams?.jwt).toBeUndefined();
    });

    test("authenticates a validly signed connectionParams.token", async () => {
        const context = {
            connectionParams: { token: createBearerToken(secret, { sub: "user" }) },
        } as Neo4jGraphQLComposedSubscriptionsContext;

        const captured = await runWrappedSubscription(buildArgs(new Neo4jGraphQLAuthorization({ key: secret })), context);

        expect(captured.authorization.isAuthenticated).toBe(true);
        expect(captured.authorization.jwt?.sub).toBe("user");
    });

    test("authenticates a developer-set top-level context.jwt", async () => {
        const context = {
            jwt: { sub: "developer" },
        } as unknown as Neo4jGraphQLSubscriptionsContext;

        const captured = await runWrappedSubscription(buildArgs(new Neo4jGraphQLAuthorization({ key: secret })), context);

        expect(captured.authorization.isAuthenticated).toBe(true);
        expect(captured.authorization.jwt?.sub).toBe("developer");
    });

    test("a client-supplied connectionParams.jwt never overrides the developer top-level context.jwt", async () => {
        const context = {
            jwt: { sub: "developer" },
            connectionParams: { jwt: { sub: "attacker" } },
        } as unknown as Neo4jGraphQLSubscriptionsContext;

        const captured = await runWrappedSubscription(buildArgs(new Neo4jGraphQLAuthorization({ key: secret })), context);

        expect(captured.authorization.isAuthenticated).toBe(true);
        expect(captured.authorization.jwt?.sub).toBe("developer");
    });
});
