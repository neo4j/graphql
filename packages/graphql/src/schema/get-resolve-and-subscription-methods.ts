/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { SchemaComposer } from "graphql-compose";
import type { GraphQLToolsResolveMethods } from "graphql-compose/lib/SchemaComposer";

export function getResolveAndSubscriptionMethods(composer: SchemaComposer): GraphQLToolsResolveMethods<any> {
    const resolveMethods: GraphQLToolsResolveMethods<any> = composer.getResolveMethods();

    const subscriptionMethods = Object.entries(composer.Subscription.getFields()).reduce(
        (acc: GraphQLToolsResolveMethods<any>, [key, value]) => {
            if (!value.subscribe || !value.resolve) {
                return acc;
            }

            acc[key] = { subscribe: value.subscribe, resolve: value.resolve };
            return acc;
        },
        {}
    );
    return {
        ...resolveMethods,
        Subscription: subscriptionMethods,
    };
}
