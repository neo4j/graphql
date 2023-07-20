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

import type { AttributeModel } from "./AttributeModel";

import { AGGREGATION_COMPARISON_OPERATORS } from "../../../constants";

type ComparisonOperator = (typeof AGGREGATION_COMPARISON_OPERATORS)[number];

export class AggregationModel {
    readonly attributeModel: AttributeModel;
    constructor(attributeModel: AttributeModel) {
        if (!attributeModel.isScalar()) {
            throw new Error("Aggregation model available only for scalar attributes");
        }
        this.attributeModel = attributeModel;
    }

    getAggregationComparators(): string[] {
        return AGGREGATION_COMPARISON_OPERATORS.map((comparator) => {
            const aggregationList: string[] = [];
            aggregationList.push(this.getAverageComparator(comparator));
            aggregationList.push(this.getMinComparator(comparator));
            aggregationList.push(this.getMaxComparator(comparator));
            if (this.attributeModel.isNumeric()) {
                aggregationList.push(this.getSumComparator(comparator));
            }
            return aggregationList;
        }).flat();
    }

    getAverageComparator(comparator: ComparisonOperator): string {
        return this.attributeModel.isString()
            ? `${this.attributeModel.name}_AVERAGE_LENGTH_${comparator}`
            : `${this.attributeModel.name}_AVERAGE_${comparator}`;
    }

    getMinComparator(comparator: ComparisonOperator): string {
        return this.attributeModel.isString()
            ? `${this.attributeModel.name}_SHORTEST_LENGTH_${comparator}`
            : `${this.attributeModel.name}_MIN_${comparator}`;
    }

    getMaxComparator(comparator: ComparisonOperator): string {
        return this.attributeModel.isString()
            ? `${this.attributeModel.name}_LONGEST_LENGTH_${comparator}`
            : `${this.attributeModel.name}_MAX_${comparator}`;
    }

    getSumComparator(comparator: ComparisonOperator): string {
        if (!this.attributeModel.isNumeric()) {
            throw new Error("Sum aggregation is available only for numeric attributes");
        }
        return `${this.attributeModel.name}_SUM_${comparator}`;
    }
}
