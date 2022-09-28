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

import type { Integer } from "neo4j-driver";
import { isInt } from "neo4j-driver";

/** Checks if value is string */
export function isString(value: unknown): value is string {
    return typeof value === "string";
}

/** Checks if value is object (array not included) */
export function isObject(value: unknown): value is object {
    return typeof value === "object" && !Array.isArray(value) && value !== null;
}

/** Checks if two value have the same type */
export function isSameType<T>(a: T, b: unknown): b is T {
    return typeof a === typeof b && isObject(a) === isObject(b) && Array.isArray(a) === Array.isArray(b);
}

/** Checks if two objects have the number of properties */
export function haveSameLength(o1: Record<string, any>, o2: Record<string, any>) {
    return Object.keys(o1).length === Object.keys(o2).length;
}

/** Checks if value is a Neo4j int object */
export function isNeoInt(value: unknown): value is Integer {
    return isInt(value);
}

/** Transforms a value to number, if possible */
export function toNumber(value: Integer | number): number {
    return isNeoInt(value) ? value.toNumber() : value;
}

/** Joins all strings with given separator, ignoring empty or undefined statements */
export function joinStrings(statements: string | Array<string | undefined>, separator = "\n"): string {
    return filterTruthy(asArray(statements)).join(separator);
}

/** Makes sure input is an array, if not it turns into an array (empty array if input is null or undefined) */
export function asArray<T>(raw: T | Array<T> | undefined | null): Array<T> {
    if (Array.isArray(raw)) return raw;
    if (raw === undefined || raw === null) return [];
    return [raw];
}

/** Filter all elements in an array, only leaving truthy values */
export function filterTruthy<T>(arr: Array<T | null | undefined>): Array<T> {
    return arr.filter((v): v is T => !!v);
}

/** Check if both arrays share at least one element */
export function haveSharedElement(arr1: Array<any>, arr2: Array<any>): boolean {
    for (const element of arr1) {
        if (arr2.includes(element)) return true;
    }
    return false;
}

/** Removes duplicate elements of an array */
export function removeDuplicates<T>(arr: T[]): T[] {
    return Array.from(new Set(arr));
}

/** Awaitable version of setTimeout */
export function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/** Omits fields from record */
export function omitFields<T>(obj: Record<string, T>, fields: string[]): Record<string, T> {
    return Object.entries(obj)
        .filter((item) => !fields.includes(item[0]))
        .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
        }, {});
}
