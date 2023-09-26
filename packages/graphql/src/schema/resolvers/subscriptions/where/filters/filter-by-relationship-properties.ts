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

import type { ConcreteEntityAdapter } from "../../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { RelationshipSubscriptionsEvent } from "../../../../../types";
import type { RecordType, RelationshipType } from "../../types";
import { filterRelationshipKey } from "../utils/filter-relationship-key";
import { multipleConditionsAggregationMap } from "../utils/multiple-conditions-aggregation-map";
import { parseFilterProperty } from "../utils/parse-filter-property";
import { filterByProperties } from "./filter-by-properties";

export function filterByRelationshipProperties({
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
                comparisonResults = filterByRelationshipProperties({
                    entityAdapter,
                    whereProperties: wherePropertyValue as Record<string, RecordType>,
                    receivedEvent,
                });
            } else {
                comparisonResults = (wherePropertyValue as Array<Record<string, RecordType>>).map((whereCl) => {
                    return filterByRelationshipProperties({
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
                !filterByProperties({
                    attributes: entityAdapter.attributes,
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
                receivedEvent,
            });
        }
    }
    return true;
}
