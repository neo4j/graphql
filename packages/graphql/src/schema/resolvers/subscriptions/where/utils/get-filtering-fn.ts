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
import type { PrimitiveField } from "../../../../../types";
import { isFloatType, isIDAsString, isStringType } from "./type-checks";

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

export function getFilteringFn<T>(operator: string | undefined): ComparatorFn<T> {
    if (!operator) {
        return (received: T, filtered: T) => received === filtered;
    }
    return operatorCheckMap[operator];
}
