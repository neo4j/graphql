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

import type { Node, RelationField, RelationshipSubscriptionsEvent } from "../../../../../types";
import type { ObjectFields } from "../../../../get-obj-field-meta";
import type { RecordType, RelationshipType } from "../../types";
import { filterByProperties, filterByProperties2 } from "./filter-by-properties";
import { parseFilterProperty } from "../utils/parse-filter-property";
import { multipleConditionsAggregationMap } from "../utils/multiple-conditions-aggregation-map";
import { filterRelationshipKey, filterRelationshipKey2 } from "../utils/filter-relationship-key";
import type { ConcreteEntityAdapter } from "../../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";

export function filterByRelationshipProperties({
    node,
    whereProperties,
    receivedEvent,
    nodes,
    relationshipFields,
}: {
    node: Node;
    whereProperties: Record<
        string,
        RecordType | Record<string, RecordType | RelationshipType> | Array<Record<string, RecordType>>
    >;
    receivedEvent: RelationshipSubscriptionsEvent;
    nodes: Node[];
    relationshipFields: Map<string, ObjectFields>;
}): boolean {
    const receivedEventProperties = receivedEvent.properties;
    const receivedEventRelationshipType = receivedEvent.relationshipName;
    const relationships = node.relationFields.filter((f) => f.typeUnescaped === receivedEventRelationshipType);
    if (!relationships.length) {
        return false;
    }
    const receivedEventRelationship = relationships[0] as RelationField; // ONE relationship only possible

    for (const [wherePropertyKey, wherePropertyValue] of Object.entries(whereProperties)) {
        if (Object.keys(multipleConditionsAggregationMap).includes(wherePropertyKey)) {
            const comparisonResultsAggregationFn = multipleConditionsAggregationMap[wherePropertyKey];
            let comparisonResults;
            if (wherePropertyKey === "NOT") {
                comparisonResults = filterByRelationshipProperties({
                    node,
                    whereProperties: wherePropertyValue as Record<string, RecordType>,
                    receivedEvent,
                    nodes,
                    relationshipFields,
                });
            } else {
                comparisonResults = (wherePropertyValue as Array<Record<string, RecordType>>).map((whereCl) => {
                    return filterByRelationshipProperties({
                        node,
                        whereProperties: whereCl,
                        receivedEvent,
                        nodes,
                        relationshipFields,
                    });
                });
            }

            if (!comparisonResultsAggregationFn(comparisonResults)) {
                return false;
            }
        }
        const { fieldName } = parseFilterProperty(wherePropertyKey);

        const connectedNodeFieldName = node.subscriptionEventPayloadFieldNames.create_relationship;
        if (fieldName === connectedNodeFieldName) {
            const key = receivedEventRelationship.direction === "IN" ? "to" : "from";
            if (
                !filterByProperties({
                    node,
                    whereProperties: wherePropertyValue,
                    receivedProperties: receivedEventProperties[key],
                })
            ) {
                return false;
            }
        }

        if (fieldName === "createdRelationship" || fieldName === "deletedRelationship") {
            return filterRelationshipKey({
                receivedEventRelationship,
                where: wherePropertyValue,
                relationshipFields,
                receivedEvent,
                nodes,
            });
        }
    }
    return true;
}
export function filterByRelationshipProperties2({
    entityAdapter,
    whereProperties,
    receivedEvent,
}: {
    entityAdapter: ConcreteEntityAdapter;
    whereProperties: Record<
        string,
        RecordType | Record<string, RecordType | RelationshipType> | Array<Record<string, RecordType>>
    >;
    receivedEvent: RelationshipSubscriptionsEvent;
}): boolean {
    const receivedEventProperties = receivedEvent.properties;
    const receivedEventRelationshipType = receivedEvent.relationshipName;
    // const relationships = node.relationFields.filter((f) => f.typeUnescaped === receivedEventRelationshipType);
    // TODO: this was f.typeUnescaped
    const relationships = Array.from(entityAdapter.relationships.values()).filter(
        (f) => f.type === receivedEventRelationshipType
    );
    if (!relationships.length) {
        return false;
    }
    const receivedEventRelationship = relationships[0] as RelationshipAdapter; // ONE relationship only possible

    for (const [wherePropertyKey, wherePropertyValue] of Object.entries(whereProperties)) {
        if (Object.keys(multipleConditionsAggregationMap).includes(wherePropertyKey)) {
            const comparisonResultsAggregationFn = multipleConditionsAggregationMap[wherePropertyKey];
            let comparisonResults;
            if (wherePropertyKey === "NOT") {
                comparisonResults = filterByRelationshipProperties2({
                    entityAdapter,
                    whereProperties: wherePropertyValue as Record<string, RecordType>,
                    receivedEvent,
                });
            } else {
                comparisonResults = (wherePropertyValue as Array<Record<string, RecordType>>).map((whereCl) => {
                    return filterByRelationshipProperties2({
                        entityAdapter,
                        whereProperties: whereCl,
                        receivedEvent,
                    });
                });
            }

            if (!comparisonResultsAggregationFn(comparisonResults)) {
                return false;
            }
        }
        const { fieldName } = parseFilterProperty(wherePropertyKey);

        const connectedNodeFieldName = entityAdapter.operations.subscriptionEventPayloadFieldNames.create_relationship;
        if (fieldName === connectedNodeFieldName) {
            const key = receivedEventRelationship.direction === "IN" ? "to" : "from";
            if (
                !filterByProperties2({
                    attributes: entityAdapter.attributes,
                    whereProperties: wherePropertyValue,
                    receivedProperties: receivedEventProperties[key],
                })
            ) {
                return false;
            }
        }

        if (fieldName === "createdRelationship" || fieldName === "deletedRelationship") {
            return filterRelationshipKey2({
                receivedEventRelationship,
                where: wherePropertyValue,
                receivedEvent,
            });
        }
    }
    return true;
}
