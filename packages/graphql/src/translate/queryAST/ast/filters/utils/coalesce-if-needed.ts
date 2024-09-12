import Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";

export function coalesceValueIfNeeded(attribute: AttributeAdapter, expr: Cypher.Expr): Cypher.Expr {
    if (attribute.annotations.coalesce) {
        const value = attribute.annotations.coalesce.value;
        const literal = new Cypher.Literal(value);
        return Cypher.coalesce(expr, literal);
    }
    return expr;
}
