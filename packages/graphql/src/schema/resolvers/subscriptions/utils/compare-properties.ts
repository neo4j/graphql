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

type ComparatorFn<T> = (received: T, filtered: T) => boolean;

const operatorCheckMap = {
    NOT: (received: string, filtered: string) => received !== filtered,
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
    whereProperties: Record<string, T>,
    receivedProperties: Record<string, T>
): boolean {
    for (const [k, v] of Object.entries(whereProperties)) {
        const { fieldName, operator } = parseFilterProperty(k);
        const receivedValue = receivedProperties[fieldName];
        const checkFilterPasses = getFilteringFn(operator);
        if (!checkFilterPasses(receivedValue, v)) {
            return false;
        }
    }
    return true;
}
