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
import { filterByProperties } from "../filters/filter-by-properties";
import { isInterfaceSpecificFieldType, isInterfaceType, isStandardType } from "./type-checks";

type EventProperties = {
    from: Record<string, unknown>;
    to: Record<string, unknown>;
    relationship: Record<string, unknown>;
};

export function filterRelationshipKey({
    receivedEventRelationship,
    where,
    relationshipFields,
    receivedEvent,
    nodes,
}: {
    receivedEventRelationship: RelationField;
    where: RecordType | Record<string, RelationshipType | RecordType> | Record<string, RecordType>[];
    relationshipFields: Map<string, ObjectFields>;
    receivedEvent: RelationshipSubscriptionsEvent;
    nodes: Node[];
}): boolean {
    const receivedEventProperties = receivedEvent.properties;
    const receivedEventRelationshipName = receivedEventRelationship.fieldName;
    const receivedEventRelationshipData = where[receivedEventRelationshipName] as Record<string, RelationshipType>;
    const isRelationshipOfReceivedTypeFilteredOut = !receivedEventRelationshipData;
    if (isRelationshipOfReceivedTypeFilteredOut) {
        // case `actors: {}` filtering out relationships of other type
        return false;
    }
    const isRelationshipOfReceivedTypeIncludedWithNoFilters = !Object.keys(receivedEventRelationshipData).length;
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
            if (
                !filterByProperties({
                    node: nodeTo,
                    whereProperties: nodeProperty,
                    receivedProperties: receivedEventProperties[key],
                })
            ) {
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
            if (
                !filterByProperties({
                    node: nodeTo,
                    whereProperties: propertyValueAsUnionTypeData,
                    receivedProperties: receivedEventProperties[key],
                })
            ) {
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
        if (
            !filterByProperties({
                node: targetNode,
                whereProperties: commonFields,
                receivedProperties: receivedEventProperties[key],
            })
        ) {
            return false;
        }
    }
    if (isInterfaceSpecificFieldType(_on)) {
        const isRelationshipOfReceivedTypeFilteredOut = !_on[targetNodeTypename];
        if (isRelationshipOfReceivedTypeFilteredOut) {
            return false;
        }
        const commonFieldsMergedWithSpecificFields = { ...commonFields, ..._on[targetNodeTypename] }; //override common <fields, filter> combination with specific <fields, filter>

        if (
            !filterByProperties({
                node: targetNode,
                whereProperties: commonFieldsMergedWithSpecificFields,
                receivedProperties: receivedEventProperties[key],
            })
        ) {
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
    return filterByProperties({
        node: relationship as Node,
        whereProperties: edgeProperty,
        receivedProperties: receivedEventProperties.relationship,
    });
}
