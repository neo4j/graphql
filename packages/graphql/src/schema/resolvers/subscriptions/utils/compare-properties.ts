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

import { int } from "neo4j-driver";
import type Node from "../../../../classes/Node";
import type { PrimitiveField, RelationField, RelationshipSubscriptionsEvent } from "../../../../types";
import { whereRegEx } from "../../../../translate/where/utils";
import type { WhereRegexGroups } from "../../../../translate/where/utils";
import { isSameType, haveSameLength } from "../../../../utils/utils";
import type { ObjectFields } from "../../../../schema/get-obj-field-meta";

/**
 * Returns true if all properties in obj1 exists in obj2, false otherwise.
 * Properties can only be primitives or Array<primitive>
 */
export function compareProperties(obj1: Record<string, any>, obj2: Record<string, any>): boolean {
    if (!isSameType(obj1, obj2) || !haveSameLength(obj1, obj2)) {
        return false;
    }
    for (const [k, value] of Object.entries(obj1)) {
        const otherValue = obj2[k];
        if (otherValue === null || otherValue === undefined) {
            return false;
        }
        if (Array.isArray(value) && isSameType(value, otherValue)) {
            const areArraysMatching = compareProperties(value, otherValue);
            if (!areArraysMatching) {
                return false;
            }
        }
        if (!Array.isArray(value) && isSameType(value, otherValue) && otherValue !== value) {
            return false;
        }
    }

    return true;
}

function isFloatType(fieldMeta: PrimitiveField | undefined) {
    return fieldMeta?.typeMeta.name === "Float";
}
function isStringType(fieldMeta: PrimitiveField | undefined) {
    return fieldMeta?.typeMeta.name === "String";
}
function isIDType(fieldMeta: PrimitiveField | undefined) {
    return fieldMeta?.typeMeta.name === "ID";
}
function isIDAsString(fieldMeta: PrimitiveField | undefined, value: string | number) {
    return isIDType(fieldMeta) && int(value).toString() !== value;
}

type ComparatorFn<T> = (received: T, filtered: T, fieldMeta?: PrimitiveField | undefined) => boolean;

const operatorCheckMap = {
    NOT: (received: string, filtered: string) => received !== filtered,
    LT: (received: number | string, filtered: number | string, fieldMeta: PrimitiveField | undefined) => {
        if (isFloatType(fieldMeta)) {
            return received < filtered;
        }
        return int(received).lessThan(int(filtered));
    },
    LTE: (received: number, filtered: number, fieldMeta: PrimitiveField | undefined) => {
        if (isFloatType(fieldMeta)) {
            return received <= filtered;
        }
        return int(received).lessThanOrEqual(int(filtered));
    },
    GT: (received: number, filtered: number, fieldMeta: PrimitiveField | undefined) => {
        if (isFloatType(fieldMeta)) {
            return received > filtered;
        }
        return int(received).greaterThan(int(filtered));
    },
    GTE: (received: number | string, filtered: number | string, fieldMeta: PrimitiveField | undefined) => {
        if (isFloatType(fieldMeta)) {
            return received >= filtered;
        }
        // int/ bigint
        return int(received).greaterThanOrEqual(int(filtered));
    },
    STARTS_WITH: (received: string, filtered: string) => received.startsWith(filtered),
    NOT_STARTS_WITH: (received: string, filtered: string) => !received.startsWith(filtered),
    ENDS_WITH: (received: string, filtered: string) => received.endsWith(filtered),
    NOT_ENDS_WITH: (received: string, filtered: string) => !received.endsWith(filtered),
    CONTAINS: (received: string, filtered: string) => received.includes(filtered),
    NOT_CONTAINS: (received: string, filtered: string) => !received.includes(filtered),
    INCLUDES: (received: [string | number], filtered: string | number, fieldMeta: PrimitiveField | undefined) => {
        if (isFloatType(fieldMeta) || isStringType(fieldMeta) || isIDAsString(fieldMeta, filtered)) {
            return received.findIndex((v) => v === filtered) !== -1;
        }
        // int/ bigint
        const filteredAsNeo4jInteger = int(filtered);
        return received.findIndex((r) => int(r).equals(filteredAsNeo4jInteger)) !== -1;
    },
    NOT_INCLUDES: (received: [string | number], filtered: string | number, fieldMeta: PrimitiveField | undefined) => {
        if (isFloatType(fieldMeta) || isStringType(fieldMeta) || isIDAsString(fieldMeta, filtered)) {
            return received.findIndex((v) => v === filtered) === -1;
        }
        // int/ bigint
        const filteredAsNeo4jInteger = int(filtered);
        return received.findIndex((r) => int(r).equals(filteredAsNeo4jInteger)) === -1;
    },
    IN: (received: string | number, filtered: [string | number], fieldMeta: PrimitiveField | undefined) => {
        if (isFloatType(fieldMeta) || isStringType(fieldMeta) || isIDAsString(fieldMeta, received)) {
            return filtered.findIndex((v) => v === received) !== -1;
        }
        // int/ bigint
        const receivedAsNeo4jInteger = int(received);
        return filtered.findIndex((r) => int(r).equals(receivedAsNeo4jInteger)) !== -1;
    },
    NOT_IN: (received: string | number, filtered: [string | number], fieldMeta: PrimitiveField | undefined) => {
        if (isFloatType(fieldMeta) || isStringType(fieldMeta) || isIDAsString(fieldMeta, received)) {
            return filtered.findIndex((v) => v === received) === -1;
        }
        // int/ bigint
        const receivedAsNeo4jInteger = int(received);
        return filtered.findIndex((r) => int(r).equals(receivedAsNeo4jInteger)) === -1;
    },
};
function getFilteringFn<T>(operator: string | undefined): ComparatorFn<T> {
    if (!operator) {
        return (received: T, filtered: T) => received === filtered;
    }
    return operatorCheckMap[operator];
}

function parseFilterProperty(key: string): { fieldName: string; operator: string | undefined } {
    const match = whereRegEx.exec(key);
    if (!match) {
        throw new Error(`Failed to match key in filter: ${key}`);
    }
    const { fieldName, operator } = match.groups as WhereRegexGroups;
    if (!fieldName) {
        throw new Error(`Failed to find field name in filter: ${key}`);
    }
    return { fieldName, operator };
}

const multipleConditionsAggregationMap = {
    AND: (results: boolean[]): boolean => {
        for (const res of results) {
            if (!res) {
                return false;
            }
        }
        return true;
    },
    OR: (results: boolean[]): boolean => {
        for (const res of results) {
            if (res) {
                return true;
            }
        }
        return false;
    },
};

/** Returns true if receivedProperties comply with filters specified in whereProperties, false otherwise. */
export function filterByProperties<T>(
    node: Node,
    whereProperties: Record<string, T | Array<Record<string, T>>>,
    receivedProperties: Record<string, T>
): boolean {
    for (const [k, v] of Object.entries(whereProperties)) {
        if (Object.keys(multipleConditionsAggregationMap).includes(k)) {
            const comparisonResultsAggregationFn = multipleConditionsAggregationMap[k];
            const comparisonResults = (v as Array<Record<string, T>>).map((whereCl) => {
                return filterByProperties(node, whereCl, receivedProperties);
            });
            if (!comparisonResultsAggregationFn(comparisonResults)) {
                return false;
            }
        } else {
            const { fieldName, operator } = parseFilterProperty(k);
            const receivedValue = receivedProperties[fieldName];
            if (!receivedValue) {
                return false;
            }
            const fieldMeta = node.primitiveFields.find((f) => f.fieldName === fieldName);
            const checkFilterPasses = getFilteringFn(operator);
            if (!checkFilterPasses(receivedValue, v, fieldMeta)) {
                return false;
            }
        }
    }
    return true;
}

export type RecordType = Record<string, unknown>;
export type StandardType = Record<string, Record<string, unknown>>;
export type UnionType = Record<string, StandardType>;
export type InterfaceType = Record<string, unknown | InterfaceSpecificType>;
export type InterfaceSpecificType = Record<string, Record<string, unknown>>;
export type RelationshipType = Record<string, Record<string, UnionType | InterfaceType | StandardType>>;
type EventProperties = {
    from: Record<string, unknown>;
    to: Record<string, unknown>;
    relationship: Record<string, unknown>;
};
export function filterRelationshipConnectionsByProperties({
    node,
    whereProperties,
    receivedEvent,
    nodes,
    relationshipFields,
}: {
    node: Node;
    whereProperties: Record<string, RecordType | Record<string, RecordType | RelationshipType>>;
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
    const receivedEventRelationship = relationships[0]; // ONE relationship only possible

    for (const [wherePropertyKey, wherePropertyValue] of Object.entries(whereProperties)) {
        const { fieldName } = parseFilterProperty(wherePropertyKey);

        const connectedNodeFieldName = node.subscriptionEventPayloadFieldNames.connect;
        if (fieldName === connectedNodeFieldName) {
            const inFrom = filterByProperties(node, wherePropertyValue, receivedEventProperties.from);
            const inTo = filterByProperties(node, wherePropertyValue, receivedEventProperties.to);
            if (!inFrom && !inTo) {
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
            const key = receivedEventRelationship.direction === "IN" ? "from" : "to";
            const relationshipPropertiesInterfaceName = receivedEventRelationship.properties || "";

            const {
                edge: receivedEventRelationshipDataEdgeProp,
                node: receivedEventRelationshipDataNodeProp,
                unionMap: receivedEventRelationshipDataUnionMapProp,
            } = buildRelationshipDataPropertyMap(receivedEventRelationshipData);

            if (
                receivedEventRelationshipDataEdgeProp &&
                !filterRelationshipEdgeProperty({
                    relationshipFields,
                    relationshipPropertiesInterfaceName,
                    receivedEventRelationshipDataEdgeProp,
                    receivedEventProperties,
                })
            ) {
                return false;
            }

            if (receivedEventRelationshipDataNodeProp) {
                if (isInterfaceType(receivedEventRelationshipDataNodeProp, receivedEventRelationship)) {
                    const targetNodeTypename = receivedEvent[`${key}Typename`];
                    if (
                        !filterRelationshipInterfaceProperty({
                            receivedEventRelationshipDataNodeProp,
                            nodes,
                            receivedEventProperties,
                            targetNodeTypename,
                            key,
                        })
                    ) {
                        return false;
                    }
                } else if (isStandardType(receivedEventRelationshipDataNodeProp, receivedEventRelationship)) {
                    // standard type fields
                    const nodeTo = nodes.find((n) => n.name === receivedEventRelationship.typeMeta.name) as Node;
                    if (
                        !filterByProperties(nodeTo, receivedEventRelationshipDataNodeProp, receivedEventProperties[key])
                    ) {
                        return false;
                    }
                }
            }
            if (receivedEventRelationshipDataUnionMapProp) {
                // union types
                const targetNodeTypename = receivedEvent[`${key}Typename`];
                const targetNodePropsByTypename = receivedEventRelationshipDataUnionMapProp[targetNodeTypename];
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

function isInterfaceType(
    node: StandardType | InterfaceType,
    receivedEventRelationship: RelationField
): node is InterfaceType {
    return !!receivedEventRelationship.interface?.implementations;
}
function isStandardType(
    node: StandardType | InterfaceType,
    receivedEventRelationship: RelationField
): node is StandardType {
    return !receivedEventRelationship.interface?.implementations;
}
function isInterfaceSpecificFieldType(node: unknown): node is InterfaceSpecificType {
    return !!node;
}

function buildRelationshipDataPropertyMap(receivedEventRelationshipData: RelationshipType): {
    edge?: StandardType;
    node?: InterfaceType | StandardType;
    unionMap?: Record<string, Record<string, UnionType>>;
} {
    return Object.entries(receivedEventRelationshipData).reduce((acc, [innerK, innerV]) => {
        if (innerK === "edge") {
            acc["edge"] = innerV;
        } else if (innerK === "node") {
            acc["node"] = innerV;
        } else {
            acc["unionMap"] = { ...acc["unionMap"], [innerK]: innerV };
        }
        return acc;
    }, {});
}

function filterRelationshipEdgeProperty({
    relationshipFields,
    relationshipPropertiesInterfaceName,
    receivedEventRelationshipDataEdgeProp,
    receivedEventProperties,
}: {
    relationshipFields: Map<string, ObjectFields>;
    relationshipPropertiesInterfaceName: string;
    receivedEventRelationshipDataEdgeProp: StandardType;
    receivedEventProperties: EventProperties;
}): boolean {
    const relationship = relationshipFields.get(relationshipPropertiesInterfaceName);
    const noRelationshipPropertiesFound = !relationship;
    if (noRelationshipPropertiesFound) {
        return true;
    }
    return filterByProperties(
        relationship as Node,
        receivedEventRelationshipDataEdgeProp,
        receivedEventProperties.relationship
    );
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
                receivedEventRelationshipDataEdgeProp: propertyValueAsUnionTypeData,
                receivedEventProperties,
            })
        ) {
            return false;
        }
    }
    return true;
}

function filterRelationshipInterfaceProperty({
    receivedEventRelationshipDataNodeProp,
    nodes,
    receivedEventProperties,
    targetNodeTypename,
    key,
}: {
    receivedEventRelationshipDataNodeProp: InterfaceType;
    nodes: Node[];
    receivedEventProperties: EventProperties;
    targetNodeTypename: string;
    key: string;
}): boolean {
    const { _on, ...commonFields } = receivedEventRelationshipDataNodeProp;
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
