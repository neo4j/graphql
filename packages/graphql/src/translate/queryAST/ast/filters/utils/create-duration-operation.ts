import Cypher from "@neo4j/cypher-builder";
import { createComparisonOperation } from "../../../utils/create-comparison-operator";
import type { WhereOperator } from "../Filter";

export function createDurationOperation({
    operator,
    property,
    param,
}: {
    operator: WhereOperator | "EQ";
    property: Cypher.Expr;
    param: Cypher.Expr;
}): Cypher.ComparisonOp {
    // NOTE: When we simply compare values, we don't need to prepend Cypher.datetime()
    if (operator === "EQ") {
        return Cypher.eq(property, param);
    }

    const variable = Cypher.plus(Cypher.datetime(), param);
    const propertyRef = Cypher.plus(Cypher.datetime(), property);

    return createComparisonOperation({ operator, property: propertyRef, param: variable });
}
