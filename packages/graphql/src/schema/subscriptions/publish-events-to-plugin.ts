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
import { filterTruthy } from "../../utils/utils";

export function publishEventsToPlugin(
    executeResult: ExecuteResult,
    plugin: Neo4jGraphQLSubscriptionsPlugin | undefined
): void {
    if (plugin) {
        const metadata: EventMeta[] = executeResult.records[0]?.meta || [];
        const serializedEvents = filterTruthy(metadata.map(serializeEvent));

        const serializedEventsWithoutDuplicatesDelete = removeDuplicateEvents("delete", serializedEvents);
        const serializedEventsWithoutDuplicates = removeDuplicateEvents(
            "disconnect",
            serializedEventsWithoutDuplicatesDelete
        );
        for (const subscriptionsEvent of serializedEventsWithoutDuplicates) {
            try {
                console.log("publish!", subscriptionsEvent);
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

function removeDuplicateEvents(
    eventType: "create" | "update" | "delete" | "connect" | "disconnect",
    events: SubscriptionsEvent[]
): SubscriptionsEvent[] {
    const result = [] as SubscriptionsEvent[];
    const resultIds = new Set<number>();
    for (const event of events) {
        if (event.event != eventType) {
            result.push(event);
        } else {
            if (!resultIds.has(event.id)) {
                resultIds.add(event.id);
                result.push(event);
            }
        }
    }
    return result;
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
            from: serializeProperties(event.properties.from),
            to: serializeProperties(event.properties.to),
            relationship: serializeProperties(event.properties.relationship),
        };
        extraFields = {
            id_from: serializeNeo4jValue(event.id_from),
            id_to: serializeNeo4jValue(event.id_to),
            fromTypename: serializeNeo4jValue(event.fromTypename),
            toTypename: serializeNeo4jValue(event.toTypename),
            relationshipName: event.relationshipName,
            // TODO: temporary
            fromLabels: serializeNeo4jValue(event.fromLabels),
            toLabels: serializeNeo4jValue(event.toLabels),
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
