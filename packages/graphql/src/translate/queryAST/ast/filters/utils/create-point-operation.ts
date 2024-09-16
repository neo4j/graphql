/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
    param: Cypher.Param;
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

function createPointListComprehension(param: Cypher.Param): Cypher.ListComprehension {
    const comprehensionVar = new Cypher.Variable();
    const mapPoint = Cypher.point(comprehensionVar);
    return new Cypher.ListComprehension(comprehensionVar, param).map(mapPoint);
}

function createPointDistanceExpression(property: Cypher.Expr, param: Cypher.Param): Cypher.Function {
    const nestedPointRef = param.property("point");
    return Cypher.point.distance(property, Cypher.point(nestedPointRef));
}
