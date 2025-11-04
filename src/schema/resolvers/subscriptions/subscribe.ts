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

import { on } from "events";
import type { GraphQLResolveInfo } from "graphql";
import { Neo4jGraphQLError } from "../../../classes";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { NodeSubscriptionsEvent, RelationshipSubscriptionsEvent, SubscriptionsEvent } from "../../../types";
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

function isRelationshipSubscriptionEvent(
    event: SubscriptionsEvent | undefined
): event is RelationshipSubscriptionsEvent {
    if (event === undefined) {
        return false;
    }

    return "toTypename" in event && "fromTypename" in event;
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

        if (["create_relationship", "delete_relationship"].includes(type)) {
            return filterAsyncIterator<SubscriptionsEvent[]>(iterable, (data) => {
                if (!isRelationshipSubscriptionEvent(data[0])) {
                    return false;
                }

                const relationEventPayload = data[0];
                const isOfRelevantType =
                    relationEventPayload.toTypename === entityAdapter.name ||
                    relationEventPayload.fromTypename === entityAdapter.name;
                if (!isOfRelevantType) {
                    return false;
                }
                const relationFieldName = Array.from(entityAdapter.relationships.values()).find(
                    (r) => r.type === relationEventPayload.relationshipName
                )?.name;

                return (
                    !!relationFieldName &&
                    subscriptionAuthorization({
                        event: data[0],
                        entity: entityAdapter,
                        context,
                    }) &&
                    subscriptionWhere({ where: args.where, event: data[0], entityAdapter })
                );
            });
        }

        throw new Neo4jGraphQLError(`Invalid type in subscription: ${type}`);
    };
}
