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

import type { AttributeAdapter } from "./AttributeAdapter";

import { AGGREGATION_COMPARISON_OPERATORS } from "../../../constants";
import type { ValueOf } from "../../../utils/value-of";

type ComparisonOperator = ValueOf<typeof AGGREGATION_COMPARISON_OPERATORS>;

export class AggregationAdapter {
    readonly AttributeAdapter: AttributeAdapter;
    constructor(AttributeAdapter: AttributeAdapter) {
        if (!AttributeAdapter.typeHelper.isScalar()) {
            throw new Error("Aggregation model available only for scalar attributes");
        }
        this.AttributeAdapter = AttributeAdapter;
    }

    getAggregationComparators(): string[] {
        return AGGREGATION_COMPARISON_OPERATORS.map((comparator) => {
            const aggregationList: string[] = [];
            aggregationList.push(this.getAverageComparator(comparator));
            aggregationList.push(this.getMinComparator(comparator));
            aggregationList.push(this.getMaxComparator(comparator));
            if (this.AttributeAdapter.typeHelper.isNumeric()) {
                aggregationList.push(this.getSumComparator(comparator));
            }
            return aggregationList;
        }).flat();
    }

    getAverageComparator(comparator: ComparisonOperator): string {
        return this.AttributeAdapter.typeHelper.isString()
            ? `${this.AttributeAdapter.name}_AVERAGE_LENGTH_${comparator}`
            : `${this.AttributeAdapter.name}_AVERAGE_${comparator}`;
    }

    getMinComparator(comparator: ComparisonOperator): string {
        return this.AttributeAdapter.typeHelper.isString()
            ? `${this.AttributeAdapter.name}_SHORTEST_LENGTH_${comparator}`
            : `${this.AttributeAdapter.name}_MIN_${comparator}`;
    }

    getMaxComparator(comparator: ComparisonOperator): string {
        return this.AttributeAdapter.typeHelper.isString()
            ? `${this.AttributeAdapter.name}_LONGEST_LENGTH_${comparator}`
            : `${this.AttributeAdapter.name}_MAX_${comparator}`;
    }

    getSumComparator(comparator: ComparisonOperator): string {
        if (!this.AttributeAdapter.typeHelper.isNumeric()) {
            throw new Error("Sum aggregation is available only for numeric attributes");
        }
        return `${this.AttributeAdapter.name}_SUM_${comparator}`;
    }
}
