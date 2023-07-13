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

type ComparisonOperator = typeof AGGREGATION_COMPARISON_OPERATORS[number];

export class AggregationModel {
    readonly attributeModel: AttributeModel;
    constructor(attributeModel: AttributeModel) {
        if (!attributeModel.isScalar()) {
            throw new Error("Attribute is not a scalar");
        }
        this.attributeModel = attributeModel;
    }

    getAggregationComparators(): string[] {
        return AGGREGATION_COMPARISON_OPERATORS.map((comparator) => [
            this.getAverageComparator(comparator),
            this.getMinComparator(comparator),
            this.getMaxComparator(comparator),
            this.getSumComparator(comparator),
        ]).flat();
    }

    getAverageComparator(comparator: ComparisonOperator): string {
        return this.attributeModel.isString()
            ? `${this.attributeModel.name}_AVERAGE_LENGTH_${comparator}`
            : `${this.attributeModel.name}_AVERAGE_${comparator}`;
    }

    getMinComparator(comparator: ComparisonOperator): string {
        return `${this.attributeModel.name}_MIN_${comparator}`;
    }

    getMaxComparator(comparator: ComparisonOperator): string {
        return `${this.attributeModel.name}_MAX_${comparator}`;
    }

    getSumComparator(comparator: ComparisonOperator): string {
        return `${this.attributeModel.name}_SUM_${comparator}`;
    }

    /**
     * Given the GraphQL field name, returns the semantic information about the aggregation it tries to perform
     **/
    getAggregationMetadata(graphQLField: string): { fieldName: string; operator: string; comparator: string } {
        throw new Error("Not implemented");
    }
}
