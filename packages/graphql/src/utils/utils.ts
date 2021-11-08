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

import { Integer, isInt } from "neo4j-driver";

/** Checks if value is string */
export function isString(value: unknown): value is string {
    return typeof value === "string" || value instanceof String;
}

/** Checks if value is a Neo4j int object */
export function isNeoInt(value: unknown): value is Integer {
    return isInt(value);
}

/** Joins all strings with given separator, ignoring empty or undefined statements */
export function joinStrings(statements: string | Array<string | undefined>, separator = "\n"): string {
    return filterTruthy(arrayfy(statements)).join(separator);
}

/** Makes sure input is an array, if not it turns into an array (empty array if input is null or undefined) */
export function arrayfy<T>(raw: T | Array<T> | undefined | null): Array<T> {
    if (Array.isArray(raw)) return raw;
    if (raw === undefined || raw === null) return [];
    return [raw];
}

/** Filter all elements in an array, only leaving truthy values */
export function filterTruthy(arr: Array<boolean | null | undefined>): Array<true>;
export function filterTruthy<T>(arr: Array<T | null | undefined>): Array<T>;
export function filterTruthy<T>(arr: Array<T | null | undefined>) {
    return arr.filter(Boolean);
}
