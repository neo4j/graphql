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

import { ExecuteResult } from "../../utils/execute";
import { serializeNeo4jValue } from "../../utils/neo4j-serializers";
import { Neo4jGraphQLSubscriptionsPlugin } from "../../types";
import { EventMeta, SubscriptionsEvent } from "../../subscriptions/subscriptions-event";

export function publishEventsToPlugin(
    executeResult: ExecuteResult,
    plugin: Neo4jGraphQLSubscriptionsPlugin | undefined
): void {
    if (plugin) {
        const metadata: EventMeta[] = executeResult.records[0]?.meta || [];

        for (const rawEvent of metadata) {
            const subscriptionsEvent = serializeEvent(rawEvent);
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            plugin.publish(subscriptionsEvent);
        }
    }
}

function serializeEvent(event: EventMeta): SubscriptionsEvent {
    return {
        id: serializeNeo4jValue(event.id),
        timestamp: serializeNeo4jValue(event.timestamp),
        event: event.event,
        properties: {
            old: serializeProperties(event.properties.old),
            new: serializeProperties(event.properties.new),
        },
        typename: event.typename,
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
