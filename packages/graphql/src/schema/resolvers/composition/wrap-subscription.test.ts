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
