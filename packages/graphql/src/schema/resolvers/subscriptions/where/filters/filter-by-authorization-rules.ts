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

import type { Node, RelationField, RelationshipSubscriptionsEvent, SubscriptionsEvent } from "../../../../../types";
import type { ObjectFields } from "../../../../get-obj-field-meta";
import type { RecordType, RelationshipType } from "../../types";
import { filterByProperties } from "./filter-by-properties";
import { multipleConditionsAggregationMap } from "../utils/multiple-conditions-aggregation-map";
import { filterRelationshipKey } from "../utils/filter-relationship-key";
import { filterByValues } from "../../../../../translate/authorization/utils/filter-by-values";
import type { SubscriptionsAuthorizationWhere } from "../../../../../schema-model/annotation/SubscriptionsAuthorizationAnnotation";
import type { Neo4jGraphQLComposedSubscriptionsContext } from "../../../composition/wrap-subscription";

function isRelationshipSubscriptionsEvent(event: SubscriptionsEvent): event is RelationshipSubscriptionsEvent {
    return ["create_relationship", "delete_relationship"].includes(event.event);
}

export function filterByAuthorizationRules({
    node,
    where,
    event,
    nodes,
    relationshipFields,
    context,
}: {
    node: Node;
    where:
        | SubscriptionsAuthorizationWhere
        | Record<
              string,
              RecordType | Record<string, RecordType | RelationshipType> | Array<Record<string, RecordType>>
          >;
    event: SubscriptionsEvent;
    nodes?: Node[];
    relationshipFields?: Map<string, ObjectFields>;
    context: Neo4jGraphQLComposedSubscriptionsContext;
}): boolean {
    const receivedEventProperties = event.properties;

    const results = Object.entries(where).map(([wherePropertyKey, wherePropertyValue]) => {
        if (Object.keys(multipleConditionsAggregationMap).includes(wherePropertyKey)) {
            const comparisonResultsAggregationFn = multipleConditionsAggregationMap[wherePropertyKey];
            let comparisonResults;
            if (wherePropertyKey === "NOT") {
                comparisonResults = filterByAuthorizationRules({
                    node,
                    where: wherePropertyValue as Record<string, RecordType>,
                    event,
                    nodes,
                    relationshipFields,
                    context,
                });
            } else {
                comparisonResults = (wherePropertyValue as Array<Record<string, RecordType>>).map((whereCl) => {
                    return filterByAuthorizationRules({
                        node,
                        where: whereCl,
                        event,
                        nodes,
                        relationshipFields,
                        context,
                    });
                });
            }

            if (!comparisonResultsAggregationFn(comparisonResults)) {
                return false;
            }
        }

        if (wherePropertyKey === "node") {
            switch (event.event) {
                case "create":
                    return filterByProperties({
                        node,
                        whereProperties: wherePropertyValue,
                        receivedProperties: event.properties.new,
                    });
                case "update":
                case "delete":
                    return filterByProperties({
                        node,
                        whereProperties: wherePropertyValue,
                        receivedProperties: event.properties.old,
                    });
                case "create_relationship":
                case "delete_relationship": {
                    const receivedEventRelationshipType = event.relationshipName;
                    const relationships = node.relationFields.filter((f) => f.type === receivedEventRelationshipType);
                    if (!relationships.length) {
                        return false;
                    }
                    const receivedEventRelationship = relationships[0] as RelationField; // ONE relationship only possible
                    const key = receivedEventRelationship.direction === "IN" ? "to" : "from";
                    return filterByProperties({
                        node,
                        whereProperties: wherePropertyValue,
                        receivedProperties: receivedEventProperties[key],
                    });
                }
            }
        }

        if (wherePropertyKey === "relationship") {
            if (!nodes || !relationshipFields || !isRelationshipSubscriptionsEvent(event)) {
                return false;
            }

            const receivedEventRelationshipType = event.relationshipName;
            const relationships = node.relationFields.filter((f) => f.typeUnescaped === receivedEventRelationshipType);
            const receivedEventRelationship = relationships[0]; // ONE relationship only possible
            if (!receivedEventRelationship) {
                return false;
            }

            return filterRelationshipKey({
                receivedEventRelationship,
                where: wherePropertyValue,
                relationshipFields,
                receivedEvent: event,
                nodes,
            });
        }

        if (wherePropertyKey === "jwt") {
            return filterByValues(wherePropertyValue, context.authorization.jwt as Record<string, any>);
        }

        return true;
    });

    return multipleConditionsAggregationMap.AND(results);
}
