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
import type { InterfaceType, RecordType, RelationshipType, StandardType, UnionType } from "../../types";
import { filterByProperties } from "./filter-by-properties";
import { parseFilterProperty } from "../utils/parse-filter-property";
import { isInterfaceSpecificFieldType, isInterfaceType, isStandardType } from "../utils/type-checks";
import { multipleConditionsAggregationMap } from "../utils/multiple-conditions-aggregation-map";

type EventProperties = {
    from: Record<string, unknown>;
    to: Record<string, unknown>;
    relationship: Record<string, unknown>;
};

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
    const relationships = node.relationFields.filter((f) => f.type === receivedEventRelationshipType);
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
            if (!filterByProperties(node, wherePropertyValue, receivedEventProperties[key])) {
                return false;
            }
        }

        if (fieldName === "createdRelationship" || fieldName === "deletedRelationship") {
            const receivedEventRelationshipName = receivedEventRelationship.fieldName;
            const receivedEventRelationshipData = wherePropertyValue[receivedEventRelationshipName] as Record<
                string,
                RelationshipType
            >;
            const isRelationshipOfReceivedTypeFilteredOut = !receivedEventRelationshipData;
            if (isRelationshipOfReceivedTypeFilteredOut) {
                // case `actors: {}` filtering out relationships of other type
                return false;
            }
            const isRelationshipOfReceivedTypeIncludedWithNoFilters =
                !Object.keys(receivedEventRelationshipData).length;
            if (isRelationshipOfReceivedTypeIncludedWithNoFilters) {
                // case `actors: {}` including all relationships of the type
                return true;
            }
            const relationshipPropertiesInterfaceName = receivedEventRelationship.properties || "";

            const { edge: edgeProperty, node: nodeProperty, ...unionTypes } = receivedEventRelationshipData;
            if (
                edgeProperty &&
                !filterRelationshipEdgeProperty({
                    relationshipFields,
                    relationshipPropertiesInterfaceName,
                    edgeProperty,
                    receivedEventProperties,
                })
            ) {
                return false;
            }
            const key = receivedEventRelationship.direction === "IN" ? "from" : "to";
            if (nodeProperty) {
                if (isInterfaceType(nodeProperty, receivedEventRelationship)) {
                    const targetNodeTypename = receivedEvent[`${key}Typename`];
                    if (
                        !filterRelationshipInterfaceProperty({
                            nodeProperty,
                            nodes,
                            receivedEventProperties,
                            targetNodeTypename,
                            key,
                        })
                    ) {
                        return false;
                    }
                } else if (isStandardType(nodeProperty, receivedEventRelationship)) {
                    // standard type fields
                    const nodeTo = nodes.find((n) => n.name === receivedEventRelationship.typeMeta.name) as Node;
                    if (!filterByProperties(nodeTo, nodeProperty, receivedEventProperties[key])) {
                        return false;
                    }
                }
            }
            if (Object.keys(unionTypes).length) {
                // union types
                const targetNodeTypename = receivedEvent[`${key}Typename`];
                const targetNodePropsByTypename = unionTypes[targetNodeTypename] as Record<string, UnionType>;
                const isRelationshipOfReceivedTypeFilteredOut = !targetNodePropsByTypename;
                if (isRelationshipOfReceivedTypeFilteredOut) {
                    return false;
                }
                if (
                    !filterRelationshipUnionProperties({
                        targetNodePropsByTypename,
                        targetNodeTypename,
                        receivedEventProperties,
                        relationshipFields,
                        relationshipPropertiesInterfaceName,
                        key,
                        nodes,
                    })
                ) {
                    return false;
                }
            }
        }
    }
    return true;
}

function filterRelationshipUnionProperties({
    targetNodePropsByTypename,
    targetNodeTypename,
    receivedEventProperties,
    relationshipFields,
    relationshipPropertiesInterfaceName,
    key,
    nodes,
}: {
    targetNodePropsByTypename: Record<string, UnionType>;
    targetNodeTypename: string;
    receivedEventProperties: EventProperties;
    relationshipFields: Map<string, ObjectFields>;
    relationshipPropertiesInterfaceName: string;
    key: string;
    nodes: Node[];
}): boolean {
    for (const [propertyName, propertyValueAsUnionTypeData] of Object.entries(targetNodePropsByTypename)) {
        if (propertyName === "node") {
            const nodeTo = nodes.find((n) => targetNodeTypename === n.name) as Node;
            if (!filterByProperties(nodeTo, propertyValueAsUnionTypeData, receivedEventProperties[key])) {
                return false;
            }
        }
        if (
            propertyName === "edge" &&
            !filterRelationshipEdgeProperty({
                relationshipFields,
                relationshipPropertiesInterfaceName,
                edgeProperty: propertyValueAsUnionTypeData,
                receivedEventProperties,
            })
        ) {
            return false;
        }
    }
    return true;
}

function filterRelationshipInterfaceProperty({
    nodeProperty,
    nodes,
    receivedEventProperties,
    targetNodeTypename,
    key,
}: {
    nodeProperty: InterfaceType;
    nodes: Node[];
    receivedEventProperties: EventProperties;
    targetNodeTypename: string;
    key: string;
}): boolean {
    const { _on, ...commonFields } = nodeProperty;
    const targetNode = nodes.find((n) => n.name === targetNodeTypename) as Node;
    if (commonFields && !_on) {
        if (!filterByProperties(targetNode, commonFields, receivedEventProperties[key])) {
            return false;
        }
    }
    if (isInterfaceSpecificFieldType(_on)) {
        const isRelationshipOfReceivedTypeFilteredOut = !_on[targetNodeTypename];
        if (isRelationshipOfReceivedTypeFilteredOut) {
            return false;
        }
        const commonFieldsMergedWithSpecificFields = { ...commonFields, ..._on[targetNodeTypename] }; //override common <fields, filter> combination with specific <fields, filter>

        if (!filterByProperties(targetNode, commonFieldsMergedWithSpecificFields, receivedEventProperties[key])) {
            return false;
        }
    }
    return true;
}

function filterRelationshipEdgeProperty({
    relationshipFields,
    relationshipPropertiesInterfaceName,
    edgeProperty,
    receivedEventProperties,
}: {
    relationshipFields: Map<string, ObjectFields>;
    relationshipPropertiesInterfaceName: string;
    edgeProperty: StandardType;
    receivedEventProperties: EventProperties;
}): boolean {
    const relationship = relationshipFields.get(relationshipPropertiesInterfaceName);
    const noRelationshipPropertiesFound = !relationship;
    if (noRelationshipPropertiesFound) {
        return true;
    }
    return filterByProperties(relationship as Node, edgeProperty, receivedEventProperties.relationship);
}
