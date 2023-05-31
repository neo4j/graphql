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

import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import type { Node } from "../../../../types";
import type { ObjectFields } from "../../../get-obj-field-meta";
import type { EventType, SubscriptionContext } from "../types";
import { eventTypeToAuthorizationEvent } from "../utils/event-type-to-authorization-event";

export function subscriptionAuthorization({
    node,
    context,
    type,
    nodes,
    relationshipFields,
}: {
    node: Node;
    context: SubscriptionContext;
    type: EventType;
    nodes?: Node[];
    relationshipFields?: Map<string, ObjectFields>;
}): boolean {
    const entities = context.schemaModel.getEntitiesByLabels(node.getAllLabels());
    if (entities.length) {
        const concreteEntity = entities[0] as ConcreteEntity;
        const authorizationAnnotation = concreteEntity.annotations.authorization;
        const matchedRules = authorizationAnnotation.filterSubscriptions.filter((rule) => {
            rule.events.includes(eventTypeToAuthorizationEvent(type));
        });
        if (!matchedRules.length) {
            return true;
        }
    }

    return true;
}
