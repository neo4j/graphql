import Cypher from "@neo4j/cypher-builder";
import type { FilterOperator } from "../Filter";

export class CountFilter {
    protected comparisonValue: unknown;
    protected operator: FilterOperator;
    protected isNot: boolean; // _NOT is deprecated

    constructor({
        isNot,
        operator,
        comparisonValue,
    }: {
        operator: FilterOperator;
        isNot: boolean;
        comparisonValue: unknown;
    }) {
        this.comparisonValue = comparisonValue;
        this.operator = operator;
        this.isNot = isNot;
    }

    public getPredicate(variable: Cypher.Variable): Cypher.Predicate | undefined {
        return this.createBaseOperation({
            operator: this.operator,
            expr: Cypher.count(variable),
            param: new Cypher.Param(this.comparisonValue),
        });
    }

    /** Returns the default operation for a given filter */
    // NOTE: duplicate from property filter
    protected createBaseOperation({
        operator,
        expr,
        param,
    }: {
        operator: FilterOperator;
        expr: Cypher.Expr;
        param: Cypher.Expr;
    }): Cypher.ComparisonOp {
        switch (operator) {
            case "LT":
                return Cypher.lt(expr, param);
            case "LTE":
                return Cypher.lte(expr, param);
            case "GT":
                return Cypher.gt(expr, param);
            case "GTE":
                return Cypher.gte(expr, param);
            case "ENDS_WITH":
                return Cypher.endsWith(expr, param);
            case "STARTS_WITH":
                return Cypher.startsWith(expr, param);
            case "MATCHES":
                return Cypher.matches(expr, param);
            case "CONTAINS":
                return Cypher.contains(expr, param);
            case "IN":
                return Cypher.in(expr, param);
            case "INCLUDES":
                return Cypher.in(param, expr);
            case "EQ":
                return Cypher.eq(expr, param);
            default:
                throw new Error(`Invalid operator ${operator}`);
        }
    }
}
