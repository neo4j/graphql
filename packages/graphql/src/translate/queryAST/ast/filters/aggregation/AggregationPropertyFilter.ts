import Cypher from "@neo4j/cypher-builder";
import { AttributeType, type Attribute } from "../../../../../schema-model/attribute/Attribute";
import type { AggregationLogicalOperator, AggregationOperator } from "../../../factory/parsers/parse-where-field";

export class AggregationPropertyFilter {
    protected attribute: Attribute;
    protected comparisonValue: unknown;

    protected logicalOperator: AggregationLogicalOperator;
    private aggregationOperator: AggregationOperator | undefined;

    constructor({
        attribute,
        logicalOperator,
        comparisonValue,
        aggregationOperator,
    }: {
        attribute: Attribute;
        logicalOperator: AggregationLogicalOperator;
        comparisonValue: unknown;
        aggregationOperator: AggregationOperator | undefined;
    }) {
        this.attribute = attribute;
        this.comparisonValue = comparisonValue;
        this.logicalOperator = logicalOperator;
        this.aggregationOperator = aggregationOperator;
    }

    public getPredicate(variable: Cypher.Variable): Cypher.Predicate | undefined {
        const comparisonVar = new Cypher.Variable();
        const property = variable.property(this.attribute.name);

        if (this.aggregationOperator) {
            const aggrOperation = this.getAggregateOperation(Cypher.size(property), this.aggregationOperator);
            return this.createBaseOperation({
                operator: this.logicalOperator,
                property: aggrOperation,
                param: new Cypher.Param(this.comparisonValue),
            });
        } else {
            let listExpr: Cypher.Expr;

            if (this.logicalOperator !== "EQUAL" && this.attribute.type === AttributeType.String) {
                listExpr = Cypher.collect(Cypher.size(property));
            } else {
                listExpr = Cypher.collect(property);
            }

            const comparisonOperation = this.createBaseOperation({
                operator: this.logicalOperator,
                property: comparisonVar,
                param: new Cypher.Param(this.comparisonValue),
            });

            return Cypher.any(comparisonVar, listExpr, comparisonOperation);
        }
    }

    private getAggregateOperation(
        property: Cypher.Property | Cypher.Function,
        aggregationOperator: string
    ): Cypher.Function {
        switch (aggregationOperator) {
            case "AVERAGE":
                return Cypher.avg(property);
            case "MIN":
            case "SHORTEST":
                return Cypher.min(property);
            case "MAX":
            case "LONGEST":
                return Cypher.max(property);
            case "SUM":
                return Cypher.sum(property);
            default:
                throw new Error(`Invalid operator ${aggregationOperator}`);
        }
    }

    /** Returns the default operation for a given filter */
    protected createBaseOperation({
        operator,
        property,
        param,
    }: {
        operator: AggregationLogicalOperator;
        property: Cypher.Expr;
        param: Cypher.Expr;
    }): Cypher.ComparisonOp {
        switch (operator) {
            case "LT":
                return Cypher.lt(property, param);
            case "LTE":
                return Cypher.lte(property, param);
            case "GT":
                return Cypher.gt(property, param);
            case "GTE":
                return Cypher.gte(property, param);
            case "EQUAL":
                return Cypher.eq(property, param);
            default:
                throw new Error(`Invalid operator ${operator}`);
        }
    }
}
