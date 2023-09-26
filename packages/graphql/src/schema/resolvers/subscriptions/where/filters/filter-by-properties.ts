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
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { getFilteringFn } from "../utils/get-filtering-fn";
import { multipleConditionsAggregationMap } from "../utils/multiple-conditions-aggregation-map";
import { parseFilterProperty } from "../utils/parse-filter-property";

/** Returns true if receivedProperties comply with filters specified in whereProperties, false otherwise. */
export function filterByProperties<T>({
    attributes,
    whereProperties,
    receivedProperties,
}: {
    attributes: Map<string, AttributeAdapter>;
    whereProperties: Record<string, T | Array<Record<string, T>> | Record<string, T>>;
    receivedProperties: Record<string, T>;
}): boolean {
    for (const [k, v] of Object.entries(whereProperties)) {
        if (Object.keys(multipleConditionsAggregationMap).includes(k)) {
            const comparisonResultsAggregationFn = multipleConditionsAggregationMap[k];
            let comparisonResults;
            if (k === "NOT") {
                comparisonResults = filterByProperties({
                    attributes,
                    whereProperties: v as Record<string, T>,
                    receivedProperties,
                });
            } else {
                comparisonResults = (v as Array<Record<string, T>>).map((whereCl) => {
                    return filterByProperties({ attributes, whereProperties: whereCl, receivedProperties });
                });
            }

            if (!comparisonResultsAggregationFn(comparisonResults)) {
                return false;
            }
        } else {
            const { fieldName, operator } = parseFilterProperty(k);
            const receivedValue = receivedProperties[fieldName];
            if (!receivedValue) {
                return false;
            }
            const fieldMeta = attributes.get(fieldName);
            const checkFilterPasses = getFilteringFn(operator, operatorMapOverrides);

            if (!checkFilterPasses(receivedValue, v, fieldMeta)) {
                return false;
            }
        }
    }
    return true;
}

const isFloatOrStringOrIDAsString = (attributeAdapter: AttributeAdapter | undefined, value: string | number) =>
    attributeAdapter?.isFloat() ||
    attributeAdapter?.isString() ||
    (attributeAdapter?.isID() && int(value).toString() !== value);

const operatorMapOverrides = {
    INCLUDES: (received: [string | number], filtered: string | number, fieldMeta: AttributeAdapter | undefined) => {
        if (isFloatOrStringOrIDAsString(fieldMeta, filtered)) {
            return received.some((v) => v === filtered);
        }
        // int/ bigint
        const filteredAsNeo4jInteger = int(filtered);
        return received.some((r) => int(r).equals(filteredAsNeo4jInteger));
    },
    NOT_INCLUDES: (received: [string | number], filtered: string | number, fieldMeta: AttributeAdapter | undefined) => {
        if (isFloatOrStringOrIDAsString(fieldMeta, filtered)) {
            return !received.some((v) => v === filtered);
        }
        // int/ bigint
        const filteredAsNeo4jInteger = int(filtered);
        return !received.some((r) => int(r).equals(filteredAsNeo4jInteger));
    },
    IN: (received: string | number, filtered: [string | number], fieldMeta: AttributeAdapter | undefined) => {
        if (isFloatOrStringOrIDAsString(fieldMeta, received)) {
            return filtered.some((v) => v === received);
        }
        // int/ bigint
        const receivedAsNeo4jInteger = int(received);
        return filtered.some((r) => int(r).equals(receivedAsNeo4jInteger));
    },
    NOT_IN: (received: string | number, filtered: [string | number], fieldMeta: AttributeAdapter | undefined) => {
        if (isFloatOrStringOrIDAsString(fieldMeta, received)) {
            return !filtered.some((v) => v === received);
        }
        // int/ bigint
        const receivedAsNeo4jInteger = int(received);
        return !filtered.some((r) => int(r).equals(receivedAsNeo4jInteger));
    },
};
