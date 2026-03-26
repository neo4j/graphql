/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";

type ComparatorFn<T> = (received: T, filtered: T, fieldMeta?: AttributeAdapter) => boolean;

const legacyOperatorCheckMap = {
    EQ: (received: string, filtered: string) => received == filtered,
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
    ENDS_WITH: (received: string, filtered: string) => received.endsWith(filtered),
    CONTAINS: (received: string, filtered: string) => received.includes(filtered),
    INCLUDES: (received: [string | number], filtered: string | number) => {
        return received.some((v) => v === filtered);
    },
    IN: (received: string | number, filtered: [string | number]) => {
        return filtered.some((v) => v === received);
    },
};

const operatorCheckMap = {
    ...legacyOperatorCheckMap,
    eq: legacyOperatorCheckMap.EQ,
    lt: legacyOperatorCheckMap.LT,
    lte: legacyOperatorCheckMap.LTE,
    gt: legacyOperatorCheckMap.GT,
    gte: legacyOperatorCheckMap.GTE,
    in: legacyOperatorCheckMap.IN,
    startsWith: legacyOperatorCheckMap.STARTS_WITH,
    endsWith: legacyOperatorCheckMap.ENDS_WITH,
    contains: legacyOperatorCheckMap.CONTAINS,
    includes: legacyOperatorCheckMap.INCLUDES,
};

export function getFilteringFn<T>(
    operator: string | undefined,
    overrides?: Record<string, (received: any, filtered: any, fieldMeta?: any) => boolean>
): ComparatorFn<T> {
    if (!operator) {
        return (received: T, filtered: T) => received === filtered;
    }

    const operators = { ...operatorCheckMap, ...overrides };

    const comparatorFunction = operators[operator];
    if (!comparatorFunction) {
        throw new Error(`Operator ${operator} not supported`);
    }
    return comparatorFunction;
}
