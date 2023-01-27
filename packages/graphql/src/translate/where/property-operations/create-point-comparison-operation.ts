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

import type { Neo4jDatabaseInfo } from "../../../classes/Neo4jDatabaseInfo";
import type { PointField } from "../../../types";
import Cypher from "@neo4j/cypher-builder";

/** Translates a point comparison operation */
export function createPointComparisonOperation({
    operator,
    propertyRefOrCoalesce,
    param,
    pointField,
    neo4jDatabaseInfo,
}: {
    operator: string | undefined;
    propertyRefOrCoalesce: Cypher.PropertyRef | Cypher.Function | Cypher.Variable;
    param: Cypher.Param;
    pointField: PointField;
    neo4jDatabaseInfo: Neo4jDatabaseInfo;
}): Cypher.ComparisonOp {
    const pointDistance = createPointDistanceExpression(propertyRefOrCoalesce, param, neo4jDatabaseInfo);
    const distanceRef = param.property("distance");

    switch (operator || "EQ") {
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
        case "NOT":
        case "EQ": {
            if (pointField?.typeMeta.array) {
                const pointList = createPointListComprehension(param);
                return Cypher.eq(propertyRefOrCoalesce, pointList);
            }

            return Cypher.eq(propertyRefOrCoalesce, Cypher.point(param));
        }
        case "IN": {
            const pointList = createPointListComprehension(param);
            return Cypher.in(propertyRefOrCoalesce, pointList);
        }
        case "INCLUDES":
            return Cypher.in(Cypher.point(param), propertyRefOrCoalesce);
        default:
            throw new Error(`Invalid operator ${operator}`);
    }
}

function createPointListComprehension(param: Cypher.Param): Cypher.ListComprehension {
    const comprehensionVar = new Cypher.Variable();
    const mapPoint = Cypher.point(comprehensionVar);
    return new Cypher.ListComprehension(comprehensionVar, param).map(mapPoint);
}

function createPointDistanceExpression(
    property: Cypher.Expr,
    param: Cypher.Param,
    neo4jDatabaseInfo: Neo4jDatabaseInfo
): Cypher.Function {
    const nestedPointRef = param.property("point");
    if (neo4jDatabaseInfo.gte("4.4")) {
        return Cypher.pointDistance(property, Cypher.point(nestedPointRef));
    }
    return Cypher.distance(property, Cypher.point(nestedPointRef));
}
