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

import dotProp from "dot-prop";
import { getFilteringFn } from "../../../schema/resolvers/subscriptions/where/utils/get-filtering-fn";
import { multipleConditionsAggregationMap } from "../../../schema/resolvers/subscriptions/where/utils/multiple-conditions-aggregation-map";
import { parseFilterProperty } from "../../../schema/resolvers/subscriptions/where/utils/parse-filter-property";

export function filterByValues<T>(
    whereInput: Record<string, T | Array<Record<string, T>> | Record<string, T>>,
    receivedValues: Record<string, T>,
    jwtClaims?: Map<string, string>
): boolean {
    for (const [k, v] of Object.entries(whereInput)) {
        if (Object.keys(multipleConditionsAggregationMap).includes(k)) {
            const comparisonResultsAggregationFn = multipleConditionsAggregationMap[k];
            let comparisonResults;
            if (k === "NOT") {
                comparisonResults = filterByValues(v as Record<string, T>, receivedValues, jwtClaims);
            } else {
                comparisonResults = (v as Array<Record<string, T>>).map((whereCl) => {
                    return filterByValues(whereCl, receivedValues, jwtClaims);
                });
            }

            if (!comparisonResultsAggregationFn(comparisonResults)) {
                return false;
            }
        } else {
            const { fieldName, operator } = parseFilterProperty(k);
            if (!operator) {
                return filterByValuesOnGenericOperator({
                    fieldName,
                    receivedValues,
                    jwtClaims,
                    value: v as Record<string, any>,
                });
            }
            const receivedValue = getReceivedValue({ fieldName, receivedValues, jwtClaims });
            if (!receivedValue) {
                return false;
            }

            const filteringFn = getFilteringFn(operator);
            if (!filteringFn(receivedValue, v)) {
                return false;
            }
        }
    }
    return true;
}

function filterByValuesOnGenericOperator({
    fieldName,
    receivedValues,
    jwtClaims,
    value,
}: {
    fieldName: string;
    receivedValues: Record<string, any>;
    jwtClaims?: Map<string, string>;
    value: Record<string, any>;
}): boolean {
    const predicates = Object.entries(value).map(([k, v]) => {
        const receivedValue = getReceivedValue({ fieldName, receivedValues, jwtClaims });
        if (!receivedValue) {
            return false;
        }
        const filteringFn = getFilteringFn(k);

        if (!filteringFn(receivedValue, v)) {
            return false;
        }
        return true;
    });
    return multipleConditionsAggregationMap.AND(predicates);
}

function getReceivedValue<T>({
    fieldName,
    receivedValues,
    jwtClaims,
}: {
    fieldName: string;
    receivedValues: Record<string, T>;
    jwtClaims?: Map<string, string>;
}): T | undefined {
    const mappedJwtClaim = jwtClaims?.get(fieldName);
    if (mappedJwtClaim) {
        // expand the jwt claim
        return dotProp.get<T>(receivedValues, mappedJwtClaim);
    } else {
        return receivedValues[fieldName];
    }
}
