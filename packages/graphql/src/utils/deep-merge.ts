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

/** Merges the provided objects in an array, returning a single object
 * nullish values are ignored, and an empty array will return an empty object
 */
export function deepMerge<T extends Record<string, any>>(input: Array<T>): T {
    if (input.length === 0) {
        return {} as T;
    }

    return input.reduce((acc, obj) => {
        if (!isObject(obj)) {
            return acc;
        }
        return mergeObjects(acc, obj);
    }, {} as T);
}

function mergeObjects<T extends Record<string, any>>(target: T, source: T): T {
    const result: Record<string, any> = { ...target };

    for (const key of Object.keys(source)) {
        const sourceValue = source[key];
        const targetValue = target[key];
        if (isObject(sourceValue) && isObject(targetValue)) {
            result[key] = mergeObjects(targetValue, sourceValue);
        } else if (source[key] !== undefined) {
            result[key] = source[key];
        }
    }
    return result as T;
}

function isObject(a: unknown): a is Record<string, any> {
    return typeof a === "object" && Boolean(a) && !Array.isArray(a);
}
