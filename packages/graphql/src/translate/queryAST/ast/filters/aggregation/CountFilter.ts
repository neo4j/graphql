import Cypher from "@neo4j/cypher-builder";
import type { FilterOperator } from "../Filter";
import { Filter } from "../Filter";
import type { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";

export class CountFilter extends Filter {
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
        super();
        this.comparisonValue = comparisonValue;
        this.operator = operator;
        this.isNot = isNot;
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        return this.createBaseOperation({
            operator: this.operator,
            expr: Cypher.count(queryASTContext.target),
            param: new Cypher.Param(this.comparisonValue),
        });
    }

    public getChildren(): QueryASTNode[] {
        return [];
    }

    public print(): string {
        return `${super.print()} <${this.isNot ? "NOT " : ""}${this.operator}>`;
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
