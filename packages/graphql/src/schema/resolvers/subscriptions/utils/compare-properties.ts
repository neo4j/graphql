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
import type { PrimitiveField } from "../../../../types";
import { whereRegEx } from "../../../../translate/where/utils";
import type { WhereRegexGroups } from "../../../../translate/where/utils";
import { isSameType } from "../../../../utils/utils";

function isDifferentNumberOfItems(o1: Record<string, any>, o2: Record<string, any>) {
    return Object.keys(o1).length !== Object.keys(o2).length;
}
/**
 * Returns true if all properties in obj1 exists in obj2, false otherwise.
 * Properties can only be primitives or Array<primitive>
 */
export function compareProperties(obj1: Record<string, any>, obj2: Record<string, any>): boolean {
    if (!isSameType(obj1, obj2) || isDifferentNumberOfItems(obj1, obj2)) {
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

/*
export function compareProperties(obj1: unknown, obj2: unknown): boolean {
    // check types match
    if (!isSameType(obj1, obj2)) {
        return false;
    }
    // primitive types
    if (!isNotPrimitive(obj1)) {
        // coming from: array of strings
        return obj1 === obj2;
    }
    if (isSameType(obj1, obj2)) {
        // not primitive types
        if (isDifferentNumberOfItems(obj1, obj2)) {
            return false;
        }
        for (const [k, value] of Object.entries(obj1)) {
            const otherValue = obj2[k];
            if (otherValue === null || otherValue === undefined) {
                return false;
            }
            if (!isSameType(value, otherValue)) {
                return false;
            }
            if (Array.isArray(value)) {
                const areArraysMatching = compareArraysProperties(value, otherValue);
                if (!areArraysMatching) {
                    return false;
                }
            }
            if (isObject(value)) {
                const areObjectPropertiesEqual = compareProperties(value, otherValue);
                if (!areObjectPropertiesEqual) {
                    return false;
                }
            }
            if (!isNotPrimitive(value) && otherValue !== value) {
                return false;
            }
        }
    }
    return true;
}
*/

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

/** Returns true if receivedProperties comply with filters specified in whereProperties, false otherwise. */
export function filterByProperties<T>(
    node: Node,
    whereProperties: Record<string, T>,
    receivedProperties: Record<string, T>
): boolean {
    for (const [k, v] of Object.entries(whereProperties)) {
        const { fieldName, operator } = parseFilterProperty(k);
        const receivedValue = receivedProperties[fieldName];
        const fieldMeta = node.primitiveFields.find((f) => f.fieldName === fieldName);
        const checkFilterPasses = getFilteringFn(operator);
        if (!checkFilterPasses(receivedValue, v, fieldMeta)) {
            return false;
        }
    }
    return true;
}
