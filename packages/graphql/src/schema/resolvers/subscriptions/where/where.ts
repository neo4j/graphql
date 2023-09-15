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

import type { SubscriptionsEvent } from "../../../../types";
import type Node from "../../../../classes/Node";
import type { ObjectFields } from "../../../get-obj-field-meta";
import { filterByProperties, filterByProperties2 } from "./filters/filter-by-properties";
import {
    filterByRelationshipProperties,
    filterByRelationshipProperties2,
} from "./filters/filter-by-relationship-properties";
import type { RecordType, RelationshipType } from "../types";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";

export function subscriptionWhere({
    where,
    event,
    node,
    nodes,
    relationshipFields,
}: {
    where: Record<string, RecordType | RelationshipType> | undefined;
    event: SubscriptionsEvent;
    node: Node;
    nodes?: Node[];
    relationshipFields?: Map<string, ObjectFields>;
}): boolean {
    if (!where) {
        return true;
    }

    if (event.event === "create") {
        return filterByProperties({ node, whereProperties: where, receivedProperties: event.properties.new });
    }

    if (event.event === "update" || event.event === "delete") {
        return filterByProperties({ node, whereProperties: where, receivedProperties: event.properties.old });
    }

    if (event.event === "create_relationship" || event.event === "delete_relationship") {
        if (!nodes || !relationshipFields) {
            return false;
        }
        return filterByRelationshipProperties({
            node,
            whereProperties: where,
            receivedEvent: event,
            nodes,
            relationshipFields,
        });
    }

    return false;
}
export function subscriptionWhere2({
    where,
    event,
    entityAdapter,
}: {
    where: Record<string, RecordType | RelationshipType> | undefined;
    event: SubscriptionsEvent;
    entityAdapter: ConcreteEntityAdapter;
}): boolean {
    if (!where) {
        return true;
    }

    if (event.event === "create") {
        return filterByProperties2({
            attributes: entityAdapter.attributes,
            whereProperties: where,
            receivedProperties: event.properties.new,
        });
    }

    if (event.event === "update" || event.event === "delete") {
        return filterByProperties2({
            attributes: entityAdapter.attributes,
            whereProperties: where,
            receivedProperties: event.properties.old,
        });
    }

    if (event.event === "create_relationship" || event.event === "delete_relationship") {
        // if (!nodes || !relationshipFields) {
        //     return false;
        // }
        return filterByRelationshipProperties2({
            entityAdapter,
            whereProperties: where,
            receivedEvent: event,
        });
    }

    return false;
}
