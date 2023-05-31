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

import { multipleConditionsAggregationMap } from "../utils/multiple-conditions-aggregation-map";
import { parseFilterProperty } from "../utils/parse-filter-property";

type ComparatorFn<T> = (received: T, filtered: T) => boolean;

const operatorCheckMap = {
    NOT: (received: string, filtered: string) => received !== filtered,
    LT: (received: number | string, filtered: number | string) => {
        return received < filtered;
    },
    LTE: (received: number, filtered: number) => {
        return received <= filtered;
    },
    GT: (received: number, filtered: number) => {
        return received > filtered;
    },
    GTE: (received: number | string, filtered: number | string) => {
        return received >= filtered;
    },
    STARTS_WITH: (received: string, filtered: string) => received.startsWith(filtered),
    NOT_STARTS_WITH: (received: string, filtered: string) => !received.startsWith(filtered),
    ENDS_WITH: (received: string, filtered: string) => received.endsWith(filtered),
    NOT_ENDS_WITH: (received: string, filtered: string) => !received.endsWith(filtered),
    CONTAINS: (received: string, filtered: string) => received.includes(filtered),
    NOT_CONTAINS: (received: string, filtered: string) => !received.includes(filtered),
    INCLUDES: (received: [string | number], filtered: string | number) => {
        return received.findIndex((v) => v === filtered) !== -1;
    },
    NOT_INCLUDES: (received: [string | number], filtered: string | number) => {
        return received.findIndex((v) => v === filtered) === -1;
    },
    IN: (received: string | number, filtered: [string | number]) => {
        return filtered.findIndex((v) => v === received) !== -1;
    },
    NOT_IN: (received: string | number, filtered: [string | number]) => {
        return filtered.findIndex((v) => v === received) === -1;
    },
};
function getFilteringFn<T>(operator: string | undefined): ComparatorFn<T> {
    if (!operator) {
        return (received: T, filtered: T) => received === filtered;
    }
    return operatorCheckMap[operator];
}

export function filterByValues<T>(
    whereInput: Record<string, T | Array<Record<string, T>> | Record<string, T>>,
    receivedValues: Record<string, T>
): boolean {
    for (const [k, v] of Object.entries(whereInput)) {
        if (Object.keys(multipleConditionsAggregationMap).includes(k)) {
            const comparisonResultsAggregationFn = multipleConditionsAggregationMap[k];
            let comparisonResults;
            if (k === "NOT") {
                comparisonResults = filterByValues(v as Record<string, T>, receivedValues);
            } else {
                comparisonResults = (v as Array<Record<string, T>>).map((whereCl) => {
                    return filterByValues(whereCl, receivedValues);
                });
            }

            if (!comparisonResultsAggregationFn(comparisonResults)) {
                return false;
            }
        } else {
            const { fieldName, operator } = parseFilterProperty(k);
            const receivedValue = receivedValues[fieldName];
            if (!receivedValue) {
                return false;
            }

            const checkFilterPasses = getFilteringFn(operator);
            if (!checkFilterPasses(receivedValue, v)) {
                return false;
            }
        }
    }
    return true;
}
