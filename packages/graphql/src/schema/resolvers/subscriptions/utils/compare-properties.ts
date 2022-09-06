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

/** Returns true if all properties in obj1 exists in obj2, false otherwise */
export function compareProperties<T>(obj1: Record<string, T>, obj2: Record<string, T>): boolean {
    for (const [k, value] of Object.entries(obj1)) {
        if (obj2[k] !== value) {
            return false;
        }
    }
    return true;
}

function isFloatType(fieldMeta: PrimitiveField | undefined) {
    return fieldMeta?.typeMeta.name === "Float";
}

type ComparatorFn<T> = (received: T, filtered: T) => boolean;

const operatorCheckMap = (fieldMeta: PrimitiveField | undefined) => ({
    NOT: (received: string, filtered: string) => received !== filtered,
    LT: (received: number | string, filtered: number | string) => {
        if (isFloatType(fieldMeta)) {
            return received < filtered;
        }
        return int(received).lessThan(int(filtered));
    },
    LTE: (received: number, filtered: number) => {
        if (isFloatType(fieldMeta)) {
            return received <= filtered;
        }
        return int(received).lessThanOrEqual(int(filtered));
    },
    GT: (received: number, filtered: number) => {
        if (isFloatType(fieldMeta)) {
            return received > filtered;
        }
        return int(received).greaterThan(int(filtered));
    },
    GTE: (received: number | string, filtered: number | string) => {
        console.log("comparing received", received, "with where", filtered);
        if (isFloatType(fieldMeta)) {
            return received >= filtered;
        }
        // int/ bigint
        console.log("comp", int(received), int(filtered), int(received).greaterThanOrEqual(filtered));
        return int(received).greaterThanOrEqual(int(filtered));
    },
    STARTS_WITH: (received: string, filtered: string) => received.startsWith(filtered),
    NOT_STARTS_WITH: (received: string, filtered: string) => !received.startsWith(filtered),
    ENDS_WITH: (received: string, filtered: string) => received.endsWith(filtered),
    NOT_ENDS_WITH: (received: string, filtered: string) => !received.endsWith(filtered),
    CONTAINS: (received: string, filtered: string) => received.includes(filtered),
    NOT_CONTAINS: (received: string, filtered: string) => !received.includes(filtered),
});
function getFilteringFn<T>(operator: string | undefined, fieldMeta: PrimitiveField | undefined): ComparatorFn<T> {
    if (!operator) {
        return (received: T, filtered: T) => received === filtered;
    }
    return operatorCheckMap(fieldMeta)[operator];
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
        const checkFilterPasses = getFilteringFn(operator, fieldMeta);
        if (!checkFilterPasses(receivedValue, v)) {
            return false;
        }
    }
    return true;
}
