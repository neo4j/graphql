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

import type { ExecuteResult } from "../../utils/execute";
import { serializeNeo4jValue } from "../../utils/neo4j-serializers";
import type {
    EventMeta,
    Neo4jGraphQLSubscriptionsPlugin,
    NodeSubscriptionMeta,
    RelationshipSubscriptionMeta,
    SubscriptionsEvent,
} from "../../types";

export function publishEventsToPlugin(
    executeResult: ExecuteResult,
    plugin: Neo4jGraphQLSubscriptionsPlugin | undefined
): void {
    if (plugin) {
        const metadata: EventMeta[] = executeResult.records[0]?.meta || [];

        for (const rawEvent of metadata) {
            const subscriptionsEvent = serializeEvent(rawEvent);
            if (!subscriptionsEvent) {
                // unsupported event type
                return;
            }
            console.log("publishing:", subscriptionsEvent);
            try {
                const publishPromise = plugin.publish(subscriptionsEvent); // Not using await to avoid blocking
                if (publishPromise) {
                    publishPromise.catch((error) => {
                        console.warn(error);
                    });
                }
            } catch (error) {
                console.warn(error);
            }
        }
    }
}

function isNodeSubscriptionMeta(event: EventMeta): event is NodeSubscriptionMeta {
    return ["create", "update", "delete"].includes(event.event);
}
function isRelationshipSubscriptionMeta(event: EventMeta): event is RelationshipSubscriptionMeta {
    return ["connect", "disconnect"].includes(event.event);
}
function serializeEvent(event: EventMeta): SubscriptionsEvent | undefined {
    let properties = {},
        extraFields = {};
    if (isNodeSubscriptionMeta(event)) {
        extraFields = {
            typename: event.typename,
        };
        properties = {
            old: serializeProperties(event.properties.old),
            new: serializeProperties(event.properties.new),
        };
    } else if (isRelationshipSubscriptionMeta(event)) {
        properties = {
            node1: serializeProperties(event.properties.node1),
            node2: serializeProperties(event.properties.node2),
            relationship: serializeProperties(event.properties.relationship),
        };
        extraFields = {
            id_node1: serializeNeo4jValue(event.id_node1),
            id_node2: serializeNeo4jValue(event.id_node2),
            node1Typename: serializeNeo4jValue(event.node1Typename),
            node2Typename: serializeNeo4jValue(event.node2Typename),
            relationshipName: event.relationshipName,
        };
    } else {
        return undefined;
    }
    return {
        id: serializeNeo4jValue(event.id),
        ...extraFields,
        timestamp: serializeNeo4jValue(event.timestamp),
        event: event.event,
        properties,
    } as SubscriptionsEvent; // Casting here because ts is not smart enough to get the difference between create|update|delete
}

function serializeProperties(properties: Record<string, any> | undefined): Record<string, any> | undefined {
    if (!properties) {
        return undefined;
    }

    return Object.entries(properties).reduce((serializedProps, [k, v]) => {
        serializedProps[k] = serializeNeo4jValue(v);
        return serializedProps;
    }, {} as Record<string, any>);
}
