import Cypher from "@neo4j/cypher-builder";
import type { Attribute } from "../../../../../schema-model/attribute/Attribute";
import type { AggregationLogicalOperator, AggregationOperator } from "../../../factory/parsers/parse-where-field";
import { Filter } from "../Filter";
import type { QueryASTContext } from "../../QueryASTContext";
import { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";

export class AggregationPropertyFilter extends Filter {
    protected attribute: AttributeAdapter;
    protected comparisonValue: unknown;

    protected logicalOperator: AggregationLogicalOperator;
    private aggregationOperator: AggregationOperator | undefined;
    protected attachedTo: "node" | "relationship";

    constructor({
        attribute,
        logicalOperator,
        comparisonValue,
        aggregationOperator,
        attachedTo,
    }: {
        attribute: AttributeAdapter;
        logicalOperator: AggregationLogicalOperator;
        comparisonValue: unknown;
        aggregationOperator: AggregationOperator | undefined;
        attachedTo?: "node" | "relationship";
    }) {
        super();
        this.attribute = attribute;
        this.comparisonValue = comparisonValue;
        this.logicalOperator = logicalOperator;
        this.aggregationOperator = aggregationOperator;
        this.attachedTo = attachedTo ?? "node";
    }

    public getPredicate(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const comparisonVar = new Cypher.Variable();
        const property = this.getPropertyRef(queryASTContext);

        if (this.aggregationOperator) {
            let propertyExpr: Cypher.Expr = property;

            if (this.attribute.isString()) {
                propertyExpr = Cypher.size(property);
            }

            const aggrOperation = this.getAggregateOperation(propertyExpr, this.aggregationOperator);
            return this.createBaseOperation({
                operator: this.logicalOperator,
                property: aggrOperation,
                param: new Cypher.Param(this.comparisonValue),
            });
        } else {
            let listExpr: Cypher.Expr;

            if (this.logicalOperator !== "EQUAL" && this.attribute.isString()) {
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

    private getPropertyRef(queryASTContext: QueryASTContext): Cypher.Property {
        if (this.attachedTo === "node") {
            return queryASTContext.target.property(this.attribute.name);
        } else if (this.attachedTo === "relationship" && queryASTContext.relationship) {
            return queryASTContext.relationship.property(this.attribute.name);
        } else {
            throw new Error("Transpilation error");
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
