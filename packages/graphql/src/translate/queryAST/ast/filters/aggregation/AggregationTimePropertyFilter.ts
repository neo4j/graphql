/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { AggregationLogicalOperator } from "../../../factory/parsers/parse-where-field";
import { AggregationPropertyFilter } from "./AggregationPropertyFilter";

export class AggregationTimeFilter extends AggregationPropertyFilter {
    protected getOperation(expr: Cypher.Expr): Cypher.ComparisonOp {
        return this.createTimeOperation({
            operator: this.logicalOperator,
            expr,
            param: new Cypher.Param(this.comparisonValue),
        });
    }

    private createTimeOperation({
        operator,
        expr,
        param,
    }: {
        operator: AggregationLogicalOperator;
        expr: Cypher.Expr;
        param: Cypher.Expr;
    }) {
        const variable = Cypher.time(param);

        return this.createBaseOperation({
            operator,
            expr,
            param: variable,
        });
    }
}
