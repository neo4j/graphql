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
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";

export function publishEventsToPlugin(
    executeResult: ExecuteResult,
    plugin: Neo4jGraphQLSubscriptionsPlugin | undefined,
    schemaModel: Neo4jGraphQLSchemaModel
): void {
    if (plugin) {
        const metadata: EventMeta[] = executeResult.records[0]?.meta || [];

        const serializedEvents = metadata.reduce((events: SubscriptionsEvent[], event) => {
            const serializedEvent = serializeEvent(event, schemaModel);
            if (serializedEvent) {
                events.push(serializedEvent);
            }
            return events;
        }, []);
        const serializedEventsWithoutDuplicates = removeDuplicateEvents(serializedEvents, "disconnect", "delete");
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
    events: SubscriptionsEvent[],
    ...eventTypes: ("create" | "update" | "delete" | "connect" | "disconnect")[]
): SubscriptionsEvent[] {
    const result = [] as SubscriptionsEvent[];
    const resultIdsByEventType = eventTypes.reduce((acc, eventType) => {
        acc.set(eventType, new Set<number>());
        return acc;
    }, new Map<string, Set<number>>());

    for (const event of events) {
        if (!eventTypes.includes(event.event)) {
            result.push(event);
        } else {
            const resultsIds = resultIdsByEventType.get(event.event) as Set<number>;
            if (!resultsIds.has(event.id)) {
                resultsIds.add(event.id);
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
function serializeNodeSubscriptionEvent(event: NodeSubscriptionMeta) {
    return {
        properties: {
            old: serializeProperties(event.properties.old),
            new: serializeProperties(event.properties.new),
        },
    };
}
function serializeRelationshipSubscriptionEvent(event: RelationshipSubscriptionMeta) {
    return {
        properties: {
            from: serializeProperties(event.properties.from),
            to: serializeProperties(event.properties.to),
            relationship: serializeProperties(event.properties.relationship),
        },
        extraFields: {
            id_from: serializeNeo4jValue(event.id_from),
            id_to: serializeNeo4jValue(event.id_to),
            relationshipName: event.relationshipName,
            fromTypename: serializeNeo4jValue(event.fromTypename),
            toTypename: serializeNeo4jValue(event.toTypename),
        },
    };
}
function serializeEvent(event: EventMeta, schemaModel: Neo4jGraphQLSchemaModel): SubscriptionsEvent | undefined {
    if (isNodeSubscriptionMeta(event)) {
        return {
            id: serializeNeo4jValue(event.id),
            typename: event.typename,
            timestamp: serializeNeo4jValue(event.timestamp),
            event: event.event,
            properties: serializeNodeSubscriptionEvent(event).properties,
        } as SubscriptionsEvent;
    }
    if (isRelationshipSubscriptionMeta(event)) {
        event.fromTypename ??= getTypenameFromLabels({ labels: event.fromLabels, schemaModel });
        event.toTypename ??= getTypenameFromLabels({ labels: event.toLabels, schemaModel });
        if (!event.fromTypename || !event.toTypename) {
            return undefined;
        }
        const { properties, extraFields } = serializeRelationshipSubscriptionEvent(event);
        return {
            id: serializeNeo4jValue(event.id),
            ...extraFields,
            timestamp: serializeNeo4jValue(event.timestamp),
            event: event.event,
            properties,
        } as SubscriptionsEvent;
    }
    return undefined;
}
function getTypenameFromLabels({
    labels,
    schemaModel,
}: {
    labels: string[] | undefined;
    schemaModel: Neo4jGraphQLSchemaModel;
}): string | undefined {
    if (!labels || !labels.length) {
        // any node has at least one label
        return undefined;
    }
    return schemaModel.getEntityByLabels(labels)?.name;
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
