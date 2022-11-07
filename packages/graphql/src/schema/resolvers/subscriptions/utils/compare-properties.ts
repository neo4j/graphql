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

// TODO: refactor
type recordType<T> = Record<string, T>;
type standardType<T> = Record<string, Record<string, T>>;
type unionType<T> = Record<string, standardType<T>>;
type interfaceType<T> = Record<"edge", Record<string, T>> | Record<"node", Record<string, T | Record<string, T>>>;
export function filterRelationshipConnectionsByProperties<T>(
    node: Node,
    whereProperties: Record<
        string,
        recordType<T> | Record<string, Record<string, unionType<T> | interfaceType<T> | standardType<T>>>
    >,
    receivedEvent: RelationshipSubscriptionsEvent,
    nodes: Node[] | undefined,
    relationshipFields: Map<string, ObjectFields> | undefined
): boolean {
    console.log("in filter", whereProperties, receivedEvent);
    const receivedProperties = receivedEvent.properties;
    const relationshipName = receivedEvent.relationshipName;
    const relationships = node.relationFields.filter((f) => f.type === relationshipName);
    if (!relationships.length) {
        console.log("no relationships");
        return false;
    }
    const relationByRelationshipName = relationships[0]; // ONE relationship only possible

    for (const [k, v] of Object.entries(whereProperties)) {
        console.log("in where", k, v);
        const { fieldName } = parseFilterProperty(k);

        const connectedNodeFieldName = node.subscriptionEventPayloadFieldNames.connect;
        if (fieldName === connectedNodeFieldName) {
            const inFrom = filterByProperties(node, v as Record<string, T>, receivedProperties.from);
            const inTo = filterByProperties(node, v as Record<string, T>, receivedProperties.to);
            if (!inFrom && !inTo) {
                return false;
            }
        }

        if (fieldName === "createdRelationship" || fieldName === "deletedRelationship") {
            if (!nodes) {
                // TODO: why?
                console.log("why1");
                return false;
            }
            if (!Object.keys(v).includes(relationByRelationshipName.fieldName)) {
                return false;
            }
            for (const [relationshipNameK, relationshipDataV] of Object.entries(v)) {
                if (relationByRelationshipName.fieldName !== relationshipNameK) {
                    continue;
                }
                const key = relationByRelationshipName.direction === "IN" ? "from" : "to";

                if (!Object.keys(relationshipDataV).length) {
                    console.log("returning true");
                    return true;
                }

                for (const [innerK, innerV] of Object.entries(
                    relationshipDataV as Record<
                        string,
                        Record<string, unionType<T> | interfaceType<T> | standardType<T>>
                    >
                )) {
                    if (innerK === "edge") {
                        const e = relationshipFields?.get(relationByRelationshipName.properties || "");
                        if (!e) {
                            // TODO: why?
                            return false;
                        }
                        const r = filterByProperties(e as Node, innerV, receivedProperties.relationship);
                        if (!r) {
                            return false;
                        }
                    } else if (innerK === "node") {
                        const interfaceNodeTypes = relationByRelationshipName.interface?.implementations;
                        if (interfaceNodeTypes) {
                            // interface type
                            const nodesTo = nodes.filter((n) => interfaceNodeTypes.includes(n.name));
                            if (!nodesTo.length) {
                                // TODO: why?
                                return false;
                            }
                            const { _on, ...commonFields } = innerV;
                            if (commonFields && !_on) {
                                const r = nodesTo
                                    .map((nodeTo) => filterByProperties(nodeTo, commonFields, receivedProperties[key]))
                                    .filter((x) => x === false);
                                if (r.length) {
                                    return false;
                                }
                            }
                            if (_on) {
                                if (!Object.keys(_on).includes(receivedEvent[`${key}Typename`])) {
                                    return false;
                                }

                                const actualType = nodesTo.find((n) => n.name === receivedEvent[`${key}Typename`]);
                                if (!actualType) {
                                    // TODO: why?
                                    return false;
                                }
                                const r = filterByProperties(
                                    actualType,
                                    { ...commonFields, ..._on[receivedEvent[`${key}Typename`]] }, //override common <fields, filter> combination with specific <fields, filter>
                                    receivedProperties[key]
                                );
                                console.log("is this r?", { ...commonFields, ..._on[receivedEvent[`${key}Typename`]] });
                                if (!r) {
                                    return false;
                                }
                            }
                        } else {
                            // standard type fields
                            const nodeTo = nodes.find((n) => n.name === relationByRelationshipName.typeMeta.name);
                            if (!nodeTo) {
                                // TODO: why?
                                return false;
                            }
                            const r = filterByProperties(nodeTo, innerV as any, receivedProperties[key]);
                            if (!r) {
                                return false;
                            }
                        }
                    } else {
                        // union types

                        if (!Object.keys(relationshipDataV).includes(receivedEvent[`${key}Typename`])) {
                            return false;
                        }
                        if (innerK === receivedEvent[`${key}Typename`]) {
                            const unionNodeTypes = relationByRelationshipName.union?.nodes as any[];
                            const nodeTo = nodes.find((n) => unionNodeTypes.includes(n.name) && innerK === n.name);
                            if (!nodeTo) {
                                return false;
                            }
                            for (const [unionTypeK, unionDataV] of Object.entries(innerV)) {
                                if (unionTypeK === "node") {
                                    const r = filterByProperties(nodeTo, unionDataV, receivedProperties[key]);
                                    console.log("compare result:", r);
                                    if (!r) {
                                        return false;
                                    }
                                }
                                if (unionTypeK === "edge") {
                                    const e = relationshipFields?.get(relationByRelationshipName.properties || "");
                                    if (!e) {
                                        // TODO: why?
                                        return false;
                                    }
                                    const r = filterByProperties(
                                        e as Node,
                                        unionDataV,
                                        receivedProperties.relationship
                                    );
                                    if (!r) {
                                        return false;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return true;
}
