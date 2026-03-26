/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLResolveInfo } from "graphql";
import type { Neo4jGraphQLComposedSubscriptionsContext } from "./wrap-subscription";
import { wrapSubscription } from "./wrap-subscription";

describe("subscription wrapper test", () => {
    test("should check JWT in subscription context", async () => {
        const args = {
            features: {
                subscriptions: "any",
            },
            plugins: {
                auth: {
                    isGlobalAuthenticationEnabled: true,
                },
            },
        } as unknown as Parameters<typeof wrapSubscription>[0];

        const resolverDecorator = wrapSubscription(args);
        const resolvedResult = "Resolved value";
        const resolver = (_root, _args, context: Neo4jGraphQLComposedSubscriptionsContext) => {
            expect(context).toBeDefined();
            expect(context.connectionParams?.jwt).toEqual({ sub: "test" });
            return resolvedResult;
        };

        const wrappedResolver = resolverDecorator(resolver);
        const context = { connectionParams: { jwt: { sub: "test" } } } as Neo4jGraphQLComposedSubscriptionsContext;
        const res = await wrappedResolver({}, {}, context, {} as GraphQLResolveInfo);
        expect(res).toBe(resolvedResult);
    });
});
