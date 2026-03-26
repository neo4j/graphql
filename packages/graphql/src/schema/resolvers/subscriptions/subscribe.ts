/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { on } from "events";
import type { GraphQLResolveInfo } from "graphql";
import { Neo4jGraphQLError } from "../../../classes";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { NodeSubscriptionsEvent, SubscriptionsEvent } from "../../../types";
import type { Neo4jGraphQLComposedSubscriptionsContext } from "../composition/wrap-subscription";
import { checkAuthentication } from "./authentication/check-authentication";
import { checkAuthenticationOnSelectionSet } from "./authentication/check-authentication-selection-set";
import { filterAsyncIterator } from "./filter-async-iterator";
import type { SubscriptionEventType } from "./types";
import { updateDiffFilter } from "./update-diff-filter";
import { subscriptionAuthorization } from "./where/authorization";
import { subscriptionWhere } from "./where/where";

export function subscriptionResolve(payload: SubscriptionsEvent[]): SubscriptionsEvent {
    if (payload === undefined || payload[0] === undefined) {
        throw new Neo4jGraphQLError("Payload is undefined. Can't call subscriptions resolver directly.");
    }
    return payload[0];
}

type SubscriptionArgs = {
    where?: Record<string, any>;
};

function isNodeSubscriptionEvent(event: SubscriptionsEvent | undefined): event is NodeSubscriptionsEvent {
    if (event === undefined) {
        return false;
    }

    return "typename" in event;
}

export function generateSubscribeMethod({
    entityAdapter,
    type,
}: {
    entityAdapter: ConcreteEntityAdapter;
    type: SubscriptionEventType;
}) {
    return (
        _root: any,
        args: SubscriptionArgs,
        context: Neo4jGraphQLComposedSubscriptionsContext,
        resolveInfo: GraphQLResolveInfo
    ): AsyncIterator<SubscriptionsEvent[]> => {
        checkAuthenticationOnSelectionSet(resolveInfo, entityAdapter, type, context);

        checkAuthentication({ authenticated: entityAdapter, operation: "SUBSCRIBE", context });

        const iterable: AsyncIterableIterator<SubscriptionsEvent[]> = on(context.subscriptionsEngine.events, type);
        if (["create", "update", "delete"].includes(type)) {
            return filterAsyncIterator<SubscriptionsEvent[]>(iterable, (data) => {
                if (!isNodeSubscriptionEvent(data[0])) {
                    return false;
                }

                return (
                    data[0].typename === entityAdapter.name &&
                    subscriptionAuthorization({ event: data[0], entity: entityAdapter, context }) &&
                    subscriptionWhere({ where: args.where, event: data[0], entityAdapter }) &&
                    updateDiffFilter(data[0])
                );
            });
        }

        throw new Neo4jGraphQLError(`Invalid type in subscription: ${type}`);
    };
}
