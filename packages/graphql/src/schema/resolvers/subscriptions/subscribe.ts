/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { on } from "events";
import type { GraphQLResolveInfo } from "graphql";
import { Neo4jGraphQLError } from "../../../classes";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { NodeSubscriptionsEvent, SubscriptionsEvent } from "../../../types";
import {
    type WrapSubscriptionArgs,
    type Neo4jGraphQLComposedSubscriptionsContext,
} from "../composition/wrap-subscription";
import { checkAuthentication } from "./authentication/check-authentication";
import { checkAuthenticationOnSelectionSet } from "./authentication/check-authentication-selection-set";
import { filterAsyncIterator } from "./filter-async-iterator";
import type { SubscriptionEventType } from "./types";
import { updateDiffFilter } from "./update-diff-filter";
import { subscriptionAuthorization } from "./where/authorization";
import { subscriptionWhere } from "./where/where";
import { getAuthorizationContext } from "../composition/utils/get-authorization-context";

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
    wrapSubscriptionArgs,
}: {
    entityAdapter: ConcreteEntityAdapter;
    type: SubscriptionEventType;
    wrapSubscriptionArgs?: WrapSubscriptionArgs;
}) {
    if (!["create", "update", "delete"].includes(type)) {
        throw new Neo4jGraphQLError(`Invalid type in subscription: ${type}`);
    }

    return {
        subscribe: (
            _root: any,
            args: any,
            context: Neo4jGraphQLComposedSubscriptionsContext,
            resolveInfo: GraphQLResolveInfo
        ): AsyncIterableIterator<SubscriptionsEvent[]> => {
            checkAuthenticationOnSelectionSet(resolveInfo, entityAdapter, type, context);
            checkAuthentication({ authenticated: entityAdapter, operation: "SUBSCRIBE", context });

            const iterable: AsyncIterableIterator<SubscriptionsEvent[]> = on(context.subscriptionsEngine.events, type);
            return filterAsyncIterator<SubscriptionsEvent[]>(iterable, async (data) => {
                if (!isNodeSubscriptionEvent(data[0])) {
                    return false;
                }

                // update auth context for subscriptionAuthorization below
                const authorization = wrapSubscriptionArgs?.authorization;
                const jwtClaimsMap = wrapSubscriptionArgs?.jwtPayloadFieldsMap;
                const authorizationContext = await getAuthorizationContext(
                    context.connectionParams ?? {},
                    authorization,
                    jwtClaimsMap,
                    // Take jwt from context (set by server owner) instead of context.connectionParams (coming from the request).
                    context.jwt
                );
                context.authorization = authorizationContext;

                return (
                    data[0].typename === entityAdapter.name &&
                    subscriptionAuthorization({
                        event: data[0],
                        entity: entityAdapter,
                        context,
                    }) &&
                    subscriptionWhere({ where: args.where, event: data[0], entityAdapter }) &&
                    updateDiffFilter(data[0])
                );
            });
        },
        resolve: (
            payload: SubscriptionsEvent[],
            _args: SubscriptionArgs,
            context: Neo4jGraphQLComposedSubscriptionsContext,
            resolveInfo: GraphQLResolveInfo
        ): SubscriptionsEvent => {
            checkAuthenticationOnSelectionSet(resolveInfo, entityAdapter, type, context);
            checkAuthentication({ authenticated: entityAdapter, operation: "SUBSCRIBE", context });
            if (payload === undefined || payload[0] === undefined) {
                throw new Neo4jGraphQLError("Payload is undefined. Can't call subscriptions resolver directly.");
            }
            return payload[0];
        },
    };
}
