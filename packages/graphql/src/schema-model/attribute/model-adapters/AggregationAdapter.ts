/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
