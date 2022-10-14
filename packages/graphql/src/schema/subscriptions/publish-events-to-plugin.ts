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
    NodeMeta,
    RelationMeta,
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
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            plugin.publish(subscriptionsEvent);
        }
    }
}

function serializeEvent(event: EventMeta): SubscriptionsEvent | undefined {
    let properties = {},
        extraFields = {};
    if (["create", "update", "delete"].includes(event.event)) {
        extraFields = {
            typename: (event as NodeMeta).typename,
        };
        properties = {
            old: serializeProperties((event as NodeMeta).properties.old),
            new: serializeProperties((event as NodeMeta).properties.new),
        };
    } else if (["connect", "disconnect"].includes(event.event)) {
        properties = {
            from: serializeProperties((event as RelationMeta).properties.from),
            to: serializeProperties((event as RelationMeta).properties.to),
            relationship: serializeProperties((event as RelationMeta).properties.relationship),
        };
        extraFields = {
            id_from: serializeNeo4jValue((event as RelationMeta).id_from),
            id_to: serializeNeo4jValue((event as RelationMeta).id_to),
            fromTypename: serializeNeo4jValue((event as RelationMeta).fromTypename),
            toTypename: serializeNeo4jValue((event as RelationMeta).toTypename),
            relationshipName: (event as RelationMeta).relationshipName,
        };
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
