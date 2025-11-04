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

import Cypher from "@neo4j/cypher-builder";
import { AggregationPropertyFilter } from "./AggregationPropertyFilter";
import type { AggregationLogicalOperator } from "../../../factory/parsers/parse-where-field";

export class AggregationDurationFilter extends AggregationPropertyFilter {
    protected getOperation(expr: Cypher.Expr): Cypher.ComparisonOp {
        return this.createDurationOperation({
            operator: this.logicalOperator,
            property: expr,
            param: new Cypher.Param(this.comparisonValue),
        });
    }

    private createDurationOperation({
        operator,
        property,
        param,
    }: {
        operator: AggregationLogicalOperator;
        property: Cypher.Expr;
        param: Cypher.Expr;
    }) {
        const variable = Cypher.plus(Cypher.datetime(), param);
        const propertyRef = Cypher.plus(Cypher.datetime(), property);

        return this.createBaseOperation({
            operator,
            property: propertyRef,
            param: variable,
        });
    }
}
