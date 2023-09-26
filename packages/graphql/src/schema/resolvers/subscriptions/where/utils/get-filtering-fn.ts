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

import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";

type ComparatorFn<T> = (received: T, filtered: T, fieldMeta?: AttributeAdapter | undefined) => boolean;

const operatorCheckMap = {
    NOT: (received: string, filtered: string) => received !== filtered,
    LT: (received: number | string, filtered: number) => {
        const parsed = typeof received === "string" ? BigInt(received) : received;

        return parsed < filtered;
    },
    LTE: (received: number, filtered: number) => {
        const parsed = typeof received === "string" ? BigInt(received) : received;

        return parsed <= filtered;
    },
    GT: (received: number, filtered: number) => {
        const parsed = typeof received === "string" ? BigInt(received) : received;

        return parsed > filtered;
    },
    GTE: (received: number | string, filtered: number) => {
        const parsed = typeof received === "string" ? BigInt(received) : received;

        return parsed >= filtered;
    },
    STARTS_WITH: (received: string, filtered: string) => received.startsWith(filtered),
    NOT_STARTS_WITH: (received: string, filtered: string) => !received.startsWith(filtered),
    ENDS_WITH: (received: string, filtered: string) => received.endsWith(filtered),
    NOT_ENDS_WITH: (received: string, filtered: string) => !received.endsWith(filtered),
    CONTAINS: (received: string, filtered: string) => received.includes(filtered),
    NOT_CONTAINS: (received: string, filtered: string) => !received.includes(filtered),
    INCLUDES: (received: [string | number], filtered: string | number) => {
        return received.some((v) => v === filtered);
    },
    NOT_INCLUDES: (received: [string | number], filtered: string | number) => {
        return !received.some((v) => v === filtered);
    },
    IN: (received: string | number, filtered: [string | number]) => {
        return filtered.some((v) => v === received);
    },
    NOT_IN: (received: string | number, filtered: [string | number]) => {
        return !filtered.some((v) => v === received);
    },
};

export function getFilteringFn<T>(
    operator: string | undefined,
    overrides?: Record<string, (received: any, filtered: any, fieldMeta?: any) => boolean>
): ComparatorFn<T> {
    if (!operator) {
        return (received: T, filtered: T) => received === filtered;
    }

    const operators = { ...operatorCheckMap, ...overrides };

    return operators[operator];
}
