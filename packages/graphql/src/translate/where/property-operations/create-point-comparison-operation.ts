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

import type { PointField } from "../../../types";
import * as CypherBuilder from "../../cypher-builder/CypherBuilder";

/** Translates a point comparison operation */
export function createPointComparisonOperation({
    operator,
    propertyRefOrCoalesce,
    param,
    pointField,
}: {
    operator: string | undefined;
    propertyRefOrCoalesce: CypherBuilder.PropertyRef | CypherBuilder.Function;
    param: CypherBuilder.Param;
    pointField: PointField;
}): CypherBuilder.ComparisonOp {
    const pointDistance = createPointDistanceExpression(propertyRefOrCoalesce, param);
    const distanceRef = param.property("distance");

    switch (operator || "EQ") {
        case "LT":
            return CypherBuilder.lt(pointDistance, distanceRef);
        case "LTE":
            return CypherBuilder.lte(pointDistance, distanceRef);
        case "GT":
            return CypherBuilder.gt(pointDistance, distanceRef);
        case "GTE":
            return CypherBuilder.gte(pointDistance, distanceRef);
        case "DISTANCE":
            return CypherBuilder.eq(pointDistance, distanceRef);
        case "NOT":
        case "EQ": {
            if (pointField?.typeMeta.array) {
                const pointList = createPointListComprehension(param);
                return CypherBuilder.eq(propertyRefOrCoalesce, pointList);
            }

            return CypherBuilder.eq(propertyRefOrCoalesce, CypherBuilder.point(param));
        }
        case "IN":
        case "NOT_IN": {
            const pointList = createPointListComprehension(param);
            return CypherBuilder.in(propertyRefOrCoalesce, pointList);
        }
        case "INCLUDES":
        case "NOT_INCLUDES":
            return CypherBuilder.in(CypherBuilder.point(param), propertyRefOrCoalesce);
        default:
            throw new Error(`Invalid operator ${operator}`);
    }
}

function createPointListComprehension(param: CypherBuilder.Param): CypherBuilder.ListComprehension {
    const comprehensionVar = new CypherBuilder.Variable();
    const mapPoint = CypherBuilder.point(comprehensionVar);
    return new CypherBuilder.ListComprehension(comprehensionVar, param, undefined, mapPoint);
}

function createPointDistanceExpression(
    property: CypherBuilder.Expr,
    param: CypherBuilder.Param
): CypherBuilder.Function {
    const nestedPointRef = param.property("point");
    return CypherBuilder.distance(property, CypherBuilder.point(nestedPointRef));
}
