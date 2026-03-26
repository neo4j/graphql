/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { FilterOperator } from "../Filter";

export function createTimeOperation({
    operator,
    property,
    param,
    attribute,
}: {
    operator: FilterOperator;
    property: Cypher.Expr;
    param: Cypher.Param | Cypher.Variable | Cypher.Property;
    attribute: AttributeAdapter;
}): Cypher.ComparisonOp {
    const time = Cypher.time(param);

    switch (operator) {
        case "LT":
            return Cypher.lt(property, time);
        case "LTE":
            return Cypher.lte(property, time);
        case "GT":
            return Cypher.gt(property, time);
        case "GTE":
            return Cypher.gte(property, time);
        case "EQ": {
            if (attribute.typeHelper.isList()) {
                const timeList = createTimeListComprehension(param);
                return Cypher.eq(property, timeList);
            }

            return Cypher.eq(property, time);
        }
        case "IN": {
            const timeList = createTimeListComprehension(param);
            return Cypher.in(property, timeList);
        }
        case "INCLUDES":
            return Cypher.in(time, property);
        default:
            throw new Error(`Invalid operator ${operator}`);
    }
}

function createTimeListComprehension(
    param: Cypher.Param | Cypher.Variable | Cypher.Property
): Cypher.ListComprehension {
    const comprehensionVar = new Cypher.Variable();
    const mapTime = Cypher.time(comprehensionVar);
    return new Cypher.ListComprehension(comprehensionVar).in(param).map(mapTime);
}
