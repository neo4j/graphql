import Cypher from "@neo4j/cypher-builder";
import type { FilterOperator } from "../ast/filters/Filter";

/** Returns the default operation for a given filter */
export function createComparisonOperation({
    operator,
    property,
    param,
}: {
    operator: FilterOperator;
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
        case "ENDS_WITH":
            return Cypher.endsWith(property, param);
        case "STARTS_WITH":
            return Cypher.startsWith(property, param);
        case "MATCHES":
            return Cypher.matches(property, param);
        case "CONTAINS":
            return Cypher.contains(property, param);
        case "IN":
            return Cypher.in(property, param);
        case "INCLUDES":
            return Cypher.in(param, property);
        case "EQ":
            return Cypher.eq(property, param);
        default:
            throw new Error(`Invalid operator ${operator}`);
    }
}
