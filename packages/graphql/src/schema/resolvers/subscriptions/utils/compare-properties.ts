/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { haveSameLength, isSameType } from "../../../../utils/utils";

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
