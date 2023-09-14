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
import type { ObjectFields } from "../../../schema/get-obj-field-meta";
import { Neo4jGraphQLError } from "../../../classes";
import type Node from "../../../classes/Node";
import type { NodeSubscriptionsEvent, RelationshipSubscriptionsEvent, SubscriptionsEvent } from "../../../types";
import { filterAsyncIterator } from "./filter-async-iterator";
import type { SubscriptionEventType } from "./types";
import { updateDiffFilter } from "./update-diff-filter";
import { subscriptionWhere, subscriptionWhere2 } from "./where/where";
import { subscriptionAuthorization, subscriptionAuthorization2 } from "./where/authorization";
import type { GraphQLResolveInfo } from "graphql";
import { checkAuthentication } from "./authentication/check-authentication";
import {
    checkAuthenticationOnSelectionSet,
    checkAuthenticationOnSelectionSet2,
} from "./authentication/check-authentication-selection-set";
import type { Neo4jGraphQLComposedSubscriptionsContext } from "../composition/wrap-subscription";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";

export function subscriptionResolve(payload: [SubscriptionsEvent]): SubscriptionsEvent {
    if (!payload) {
        throw new Neo4jGraphQLError("Payload is undefined. Can't call subscriptions resolver directly.");
    }
    return payload[0];
}

type SubscriptionArgs = {
    where?: Record<string, any>;
};

export function generateSubscribeMethod({
    node,
    type,
    nodes,
    relationshipFields,
}: {
    node: Node;
    type: SubscriptionEventType;
    nodes?: Node[];
    relationshipFields?: Map<string, ObjectFields>;
}) {
    return (
        _root: any,
        args: SubscriptionArgs,
        context: Neo4jGraphQLComposedSubscriptionsContext,
        resolveInfo: GraphQLResolveInfo
    ): AsyncIterator<[SubscriptionsEvent]> => {
        checkAuthenticationOnSelectionSet(resolveInfo, node, type, context);
        const entities = context.schemaModel.getEntitiesByLabels(node.getAllLabels());
        const concreteEntity = entities[0];

        if (!concreteEntity) {
            throw new Error("Could not find entity");
        }

        checkAuthentication({ authenticated: concreteEntity, operation: "SUBSCRIBE", context });

        const iterable: AsyncIterableIterator<[SubscriptionsEvent]> = on(context.subscriptionsEngine.events, type);
        if (["create", "update", "delete"].includes(type)) {
            return filterAsyncIterator<[SubscriptionsEvent]>(iterable, (data) => {
                return (
                    (data[0] as NodeSubscriptionsEvent).typename === node.name &&
                    subscriptionAuthorization({ event: data[0], node, entity: concreteEntity, context }) &&
                    subscriptionWhere({ where: args.where, event: data[0], node }) &&
                    updateDiffFilter(data[0])
                );
            });
        }

        if (["create_relationship", "delete_relationship"].includes(type)) {
            return filterAsyncIterator<[SubscriptionsEvent]>(iterable, (data) => {
                const relationEventPayload = data[0] as RelationshipSubscriptionsEvent;
                const isOfRelevantType =
                    relationEventPayload.toTypename === node.name || relationEventPayload.fromTypename === node.name;
                if (!isOfRelevantType) {
                    return false;
                }
                const relationFieldName = node.relationFields.find(
                    (r) => r.typeUnescaped === relationEventPayload.relationshipName
                )?.fieldName;

                return (
                    !!relationFieldName &&
                    subscriptionAuthorization({
                        event: data[0],
                        node,
                        entity: concreteEntity,
                        nodes,
                        relationshipFields,
                        context,
                    }) &&
                    subscriptionWhere({ where: args.where, event: data[0], node, nodes, relationshipFields })
                );
            });
        }

        throw new Neo4jGraphQLError(`Invalid type in subscription: ${type}`);
    };
}
export function generateSubscribeMethod2({
    entityAdapter,
    type,
    nodes,
    relationshipFields,
}: {
    entityAdapter: ConcreteEntityAdapter;
    type: SubscriptionEventType;
    nodes?: Node[];
    relationshipFields?: Map<string, ObjectFields>;
}) {
    return (
        _root: any,
        args: SubscriptionArgs,
        context: Neo4jGraphQLComposedSubscriptionsContext,
        resolveInfo: GraphQLResolveInfo
    ): AsyncIterator<[SubscriptionsEvent]> => {
        checkAuthenticationOnSelectionSet2(resolveInfo, entityAdapter, type, context);

        checkAuthentication({ authenticated: entityAdapter, operation: "SUBSCRIBE", context });

        const iterable: AsyncIterableIterator<[SubscriptionsEvent]> = on(context.subscriptionsEngine.events, type);
        if (["create", "update", "delete"].includes(type)) {
            return filterAsyncIterator<[SubscriptionsEvent]>(iterable, (data) => {
                return (
                    (data[0] as NodeSubscriptionsEvent).typename === entityAdapter.name &&
                    subscriptionAuthorization2({ event: data[0], entity: entityAdapter, context }) &&
                    subscriptionWhere2({ where: args.where, event: data[0], entityAdapter }) &&
                    updateDiffFilter(data[0])
                );
            });
        }

        if (["create_relationship", "delete_relationship"].includes(type)) {
            return filterAsyncIterator<[SubscriptionsEvent]>(iterable, (data) => {
                const relationEventPayload = data[0] as RelationshipSubscriptionsEvent;
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
                    subscriptionAuthorization2({
                        event: data[0],
                        entity: entityAdapter,
                        nodes,
                        relationshipFields,
                        context,
                    }) &&
                    subscriptionWhere2({ where: args.where, event: data[0], entityAdapter, nodes, relationshipFields })
                );
            });
        }

        throw new Neo4jGraphQLError(`Invalid type in subscription: ${type}`);
    };
}
