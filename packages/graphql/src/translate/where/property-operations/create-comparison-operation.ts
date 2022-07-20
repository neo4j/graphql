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

import type { PointField, PrimitiveField } from "../../../types";
import * as CypherBuilder from "../../cypher-builder/CypherBuilder";
import { createPointComparisonOperation } from "./create-point-comparison-operation";

/** Translates an atomic comparison operation (e.g. "this0 <= $param0") */
export function createComparisonOperation({
    operator,
    propertyRefOrCoalesce,
    param,
    durationField,
    pointField,
}: {
    operator: string | undefined;
    propertyRefOrCoalesce: CypherBuilder.PropertyRef | CypherBuilder.Function;
    param: CypherBuilder.Param;
    durationField: PrimitiveField | undefined;
    pointField: PointField | undefined;
}): CypherBuilder.ComparisonOp {
    if (pointField) {
        return createPointComparisonOperation({
            operator,
            propertyRefOrCoalesce,
            param,
            pointField,
        });
    }

    // Comparison operations requires adding dates to durations
    // See https://neo4j.com/developer/cypher/dates-datetimes-durations/#comparing-filtering-values
    if (durationField && operator) {
        return createDurationOperation({ operator, property: propertyRefOrCoalesce, param });
    }

    return createBaseOperation({
        operator: operator || "EQ",
        property: propertyRefOrCoalesce,
        param,
    });
}

function createDurationOperation({
    operator,
    property,
    param,
}: {
    operator: string;
    property: CypherBuilder.Expr;
    param: CypherBuilder.Expr;
}) {
    const variable = CypherBuilder.plus(CypherBuilder.datetime(), param);
    const propertyRef = CypherBuilder.plus(CypherBuilder.datetime(), property);

    return createBaseOperation({
        operator,
        property: propertyRef,
        param: variable,
    });
}

function createBaseOperation({
    operator,
    property,
    param,
}: {
    operator: string;
    property: CypherBuilder.Expr;
    param: CypherBuilder.Expr;
}): CypherBuilder.ComparisonOp {
    switch (operator) {
        case "LT":
            return CypherBuilder.lt(property, param);
        case "LTE":
            return CypherBuilder.lte(property, param);
        case "GT":
            return CypherBuilder.gt(property, param);
        case "GTE":
            return CypherBuilder.gte(property, param);
        case "ENDS_WITH":
        case "NOT_ENDS_WITH":
            return CypherBuilder.endsWith(property, param);
        case "STARTS_WITH":
        case "NOT_STARTS_WITH":
            return CypherBuilder.startsWith(property, param);
        case "MATCHES":
            return CypherBuilder.matches(property, param);
        case "CONTAINS":
        case "NOT_CONTAINS":
            return CypherBuilder.contains(property, param);
        case "IN":
        case "NOT_IN":
            return CypherBuilder.in(property, param);
        case "INCLUDES":
        case "NOT_INCLUDES":
            return CypherBuilder.in(param, property);
        case "EQ":
        case "NOT":
            return CypherBuilder.eq(property, param);
        default:
            throw new Error(`Invalid operator ${operator}`);
    }
}
