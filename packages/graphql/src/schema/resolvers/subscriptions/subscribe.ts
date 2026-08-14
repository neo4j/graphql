/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { on } from "events";
import type { GraphQLResolveInfo } from "graphql";
import { Neo4jGraphQLError } from "../../../classes";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { NodeSubscriptionsEvent, SubscriptionsEvent } from "../../../types";
import { type Neo4jGraphQLComposedSubscriptionsContext } from "../composition/wrap-subscription";
import { checkAuthentication } from "./authentication/check-authentication";
import { checkAuthenticationOnSelectionSet } from "./authentication/check-authentication-selection-set";
import { filterAsyncIterator } from "./filter-async-iterator";
import type { SubscriptionEventType } from "./types";
import { updateDiffFilter } from "./update-diff-filter";
import { subscriptionAuthorization } from "./where/authorization";
import { subscriptionWhere } from "./where/where";

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
            return filterAsyncIterator<SubscriptionsEvent[]>(iterable, (data) => {
                if (!isNodeSubscriptionEvent(data[0])) {
                    return false;
                }

                // TODO: subscriptionAuthorization auth context here is not updated
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
            // TODO: can only throw from here but this is not ideal for subscriptionAuthorization bc it should filter, not throw
            // const checkAuthenticationForAuthorizationRule =
            //     hasAuthenticationRequiredRule(context.schemaModel.annotations.subscriptionsAuthorization) ||
            //     hasAuthenticationRequiredRule(entityAdapter.annotations.subscriptionsAuthorization);
            // if (checkAuthenticationForAuthorizationRule && !context.authorization.jwt) {
            //     throw new Neo4jGraphQLError(AUTHORIZATION_UNAUTHENTICATED);
            // }
            if (payload === undefined || payload[0] === undefined) {
                throw new Neo4jGraphQLError("Payload is undefined. Can't call subscriptions resolver directly.");
            }
            return payload[0];
        },
    };
}

// function hasAuthenticationRequiredRule(
//     subscriptionsAuthorization: SubscriptionsAuthorizationAnnotation | undefined
// ): boolean {
//     return subscriptionsAuthorization?.filter?.some((rule) => rule.requireAuthentication) ?? false;
// }
