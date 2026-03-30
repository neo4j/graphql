/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { FilterOperator } from "../Filter";

export function createDateTimeOperation({
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
    const datetime = Cypher.datetime(param);

    switch (operator) {
        case "LT":
            return Cypher.lt(property, datetime);
        case "LTE":
            return Cypher.lte(property, datetime);
        case "GT":
            return Cypher.gt(property, datetime);
        case "GTE":
            return Cypher.gte(property, datetime);
        case "EQ": {
            if (attribute.typeHelper.isList()) {
                const dateTimeList = createDateTimeListComprehension(param);
                return Cypher.eq(property, dateTimeList);
            }

            return Cypher.eq(property, datetime);
        }
        case "IN": {
            const dateTimeList = createDateTimeListComprehension(param);
            return Cypher.in(property, dateTimeList);
        }
        case "INCLUDES":
            return Cypher.in(datetime, property);
        default:
            throw new Error(`Invalid operator ${operator}`);
    }
}

function createDateTimeListComprehension(
    param: Cypher.Param | Cypher.Variable | Cypher.Property
): Cypher.ListComprehension {
    const comprehensionVar = new Cypher.Variable();
    const mapDateTime = Cypher.datetime(comprehensionVar);
    return new Cypher.ListComprehension(comprehensionVar).in(param).map(mapDateTime);
}
