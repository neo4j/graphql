import Cypher from "@neo4j/cypher-builder";
import type { Attribute } from "../../../../../schema-model/attribute/Attribute";
import type { AggregationLogicalOperator } from "../../../factory/parsers/parse-where-field";

export class AggregationPropertyFilter {
    protected attribute: Attribute;
    protected comparisonValue: unknown;

    protected logicalOperator: AggregationLogicalOperator;

    constructor({
        attribute,
        logicalOperator,
        comparisonValue,
    }: {
        attribute: Attribute;
        logicalOperator: AggregationLogicalOperator;
        comparisonValue: unknown;
    }) {
        this.attribute = attribute;
        this.comparisonValue = comparisonValue;
        this.logicalOperator = logicalOperator;
    }

    public getPredicate(variable: Cypher.Variable): Cypher.Predicate | undefined {
        const comparisonVar = new Cypher.Variable();
        const property = variable.property(this.attribute.name);
        return Cypher.any(
            comparisonVar,
            Cypher.collect(property),
            Cypher.eq(comparisonVar, new Cypher.Param(this.comparisonValue))
        );
    }
}
