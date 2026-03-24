/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import Cypher from "@neo4j/cypher-builder";
import type { AttributeAdapter } from "../../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { FilterOperator } from "../Filter";

export function createPointOperation({
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
    const pointDistance = createPointDistanceExpression(property, param);
    const distanceRef = param.property("distance");

    switch (operator) {
        case "LT":
            return Cypher.lt(pointDistance, distanceRef);
        case "LTE":
            return Cypher.lte(pointDistance, distanceRef);
        case "GT":
            return Cypher.gt(pointDistance, distanceRef);
        case "GTE":
            return Cypher.gte(pointDistance, distanceRef);
        case "DISTANCE":
            return Cypher.eq(pointDistance, distanceRef);
        case "EQ": {
            if (attribute.typeHelper.isList()) {
                const pointList = createPointListComprehension(param);
                return Cypher.eq(property, pointList);
            }

            return Cypher.eq(property, Cypher.point(param));
        }
        case "IN": {
            const pointList = createPointListComprehension(param);
            return Cypher.in(property, pointList);
        }
        case "INCLUDES":
            return Cypher.in(Cypher.point(param), property);
        default:
            throw new Error(`Invalid operator ${operator}`);
    }
}

function createPointListComprehension(
    param: Cypher.Param | Cypher.Variable | Cypher.Property
): Cypher.ListComprehension {
    const comprehensionVar = new Cypher.Variable();
    const mapPoint = Cypher.point(comprehensionVar);
    return new Cypher.ListComprehension(comprehensionVar).in(param).map(mapPoint);
}

function createPointDistanceExpression(
    property: Cypher.Expr,
    param: Cypher.Param | Cypher.Variable | Cypher.Property
): Cypher.Function {
    const nestedPointRef = param.property("point");
    return Cypher.point.distance(property, Cypher.point(nestedPointRef));
}
