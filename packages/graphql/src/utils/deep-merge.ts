/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
