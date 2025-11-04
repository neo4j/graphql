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

import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type {
    EventMeta,
    Neo4jGraphQLSubscriptionsEngine,
    NodeSubscriptionMeta,
    RelationshipSubscriptionMeta,
    RelationshipSubscriptionMetaLabelsParameters,
    RelationshipSubscriptionMetaTypenameParameters,
    SubscriptionsEvent,
} from "../../types";
import type { ExecuteResult } from "../../utils/execute";
import { serializeNeo4jValue } from "../../utils/neo4j-serializers";

export function publishEventsToSubscriptionMechanism(
    executeResult: ExecuteResult,
    plugin: Neo4jGraphQLSubscriptionsEngine | undefined,
    schemaModel: Neo4jGraphQLSchemaModel
): void {
    if (plugin) {
        const metadata: EventMeta[] = executeResult.records[0]?.meta || [];

        const serializedEvents = metadata.reduce(parseEvents(schemaModel), []);
        const serializedEventsWithoutDuplicates = removeDuplicateEvents(
            serializedEvents,
            "delete_relationship",
            "delete",
            "create_relationship"
        );

        for (const subscriptionsEvent of serializedEventsWithoutDuplicates) {
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

function parseEvents(schemaModel: Neo4jGraphQLSchemaModel) {
    return function (events: SubscriptionsEvent[], event: EventMeta): SubscriptionsEvent[] {
        if (isNodeSubscriptionMeta(event)) {
            events.push(serializeNodeSubscriptionEvent(event));
        }
        if (isRelationshipSubscriptionMeta(event)) {
            if (isRelationshipWithTypenameSubscriptionMeta(event)) {
                events.push(serializeRelationshipSubscriptionEvent(event));
            }
            if (isRelationshipWithLabelsSubscriptionMeta(event)) {
                const fromTypenames = getTypenamesFromLabels({ labels: event.fromLabels, schemaModel });
                const toTypenames = getTypenamesFromLabels({ labels: event.toLabels, schemaModel });
                if (!fromTypenames || !toTypenames) {
                    return events;
                }
                for (const fromTypename of fromTypenames) {
                    for (const toTypename of toTypenames) {
                        events.push(serializeRelationshipSubscriptionEvent({ ...event, fromTypename, toTypename }));
                    }
                }
            }
        }
        return events;
    };
}

type EventType = "create" | "update" | "delete" | "create_relationship" | "delete_relationship";
type MapIdToListOfTypenamesType = Map<string, { fromTypename: string; toTypename: string }[]>;
function removeDuplicateEvents(events: SubscriptionsEvent[], ...eventTypes: EventType[]): SubscriptionsEvent[] {
    const resultIdsByEventType = eventTypes.reduce((acc, eventType) => {
        acc.set(eventType, new Map<string, { fromTypename: string; toTypename: string }[]>());
        return acc;
    }, new Map<EventType, MapIdToListOfTypenamesType>());

    return events.reduce((result, event) => {
        if (!eventTypes.includes(event.event)) {
            result.push(event);
            return result;
        }

        const resultsIds = resultIdsByEventType.get(event.event) as MapIdToListOfTypenamesType;
        const publishedEventWithId = resultsIds.get(event.id);
        if (isEventAlreadyPublished(event, publishedEventWithId)) {
            return result;
        }

        resultsIds.set(
            event.id,
            (publishedEventWithId || []).concat({
                fromTypename: event["fromTypename"],
                toTypename: event["toTypename"],
            })
        );
        result.push(event);
        return result;
    }, [] as SubscriptionsEvent[]);
}

function isEventAlreadyPublished(
    event: SubscriptionsEvent,
    publishedEventWithId: { fromTypename: string; toTypename: string }[] | undefined
): boolean {
    if (!publishedEventWithId) {
        return false;
    }
    const typenamesAreRelevant = !!event["fromTypename"];
    if (!typenamesAreRelevant) {
        return true;
    }
    const publishedEventWithTypenames = publishedEventWithId?.find(
        (typenames) => typenames.fromTypename === event["fromTypename"] && typenames.toTypename === event["toTypename"]
    );
    if (publishedEventWithTypenames) {
        return true;
    }
    return false;
}

function isNodeSubscriptionMeta(event: EventMeta): event is NodeSubscriptionMeta {
    return ["create", "update", "delete"].includes(event.event);
}
function isRelationshipSubscriptionMeta(event: EventMeta): event is RelationshipSubscriptionMeta {
    return ["create_relationship", "delete_relationship"].includes(event.event);
}
function isRelationshipWithTypenameSubscriptionMeta(
    event: RelationshipSubscriptionMeta
): event is RelationshipSubscriptionMetaTypenameParameters {
    return !!event["toTypename"] && !!event["fromTypename"];
}
function isRelationshipWithLabelsSubscriptionMeta(
    event: RelationshipSubscriptionMeta
): event is RelationshipSubscriptionMetaLabelsParameters {
    return !!event["toLabels"] && !!event["fromLabels"];
}
function serializeNodeSubscriptionEvent(event: NodeSubscriptionMeta): SubscriptionsEvent {
    return {
        id: event.id.toString(),
        typename: event.typename,
        timestamp: serializeNeo4jValue(event.timestamp),
        event: event.event,
        properties: {
            old: serializeProperties(event.properties.old),
            new: serializeProperties(event.properties.new),
        },
    } as SubscriptionsEvent;
}
function serializeRelationshipSubscriptionEvent(
    event: RelationshipSubscriptionMetaTypenameParameters
): SubscriptionsEvent {
    return {
        id: event.id.toString(),
        id_from: event.id_from.toString(),
        id_to: event.id_to.toString(),
        relationshipName: event.relationshipName,
        fromTypename: serializeNeo4jValue(event.fromTypename),
        toTypename: serializeNeo4jValue(event.toTypename),
        timestamp: serializeNeo4jValue(event.timestamp),
        event: event.event,
        properties: {
            from: serializeProperties(event.properties.from),
            to: serializeProperties(event.properties.to),
            relationship: serializeProperties(event.properties.relationship),
        },
    } as SubscriptionsEvent;
}
function getTypenamesFromLabels({
    labels,
    schemaModel,
}: {
    labels: string[] | undefined;
    schemaModel: Neo4jGraphQLSchemaModel;
}): string[] | undefined {
    if (!labels || !labels.length) {
        // any node has at least one label
        return undefined;
    }
    return schemaModel.getEntitiesByLabels(labels).map((entity) => entity.name);
}

export function serializeProperties(properties: Record<string, any> | undefined): Record<string, any> | undefined {
    if (!properties) {
        return undefined;
    }

    return Object.entries(properties).reduce((serializedProps, [k, v]) => {
        serializedProps[k] = serializeNeo4jValue(v);
        return serializedProps;
    }, {} as Record<string, any>);
}
