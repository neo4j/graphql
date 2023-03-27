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
import type { PointField, PrimitiveField } from "../../../types";
import Cypher from "@neo4j/cypher-builder";
import { createPointComparisonOperation } from "./create-point-comparison-operation";

/** Translates an atomic comparison operation (e.g. "this0 <= $param0") */
export function createComparisonOperation({
    operator,
    propertyRefOrCoalesce,
    param,
    durationField,
    pointField,
    neo4jDatabaseInfo,
}: {
    operator: string | undefined;
    propertyRefOrCoalesce: Cypher.Property | Cypher.Function | Cypher.Variable;
    param: Cypher.Param | Cypher.Property;
    durationField: PrimitiveField | undefined;
    pointField: PointField | undefined;
    neo4jDatabaseInfo: Neo4jDatabaseInfo;
}): Cypher.ComparisonOp {
    if (pointField) {
        return createPointComparisonOperation({
            operator,
            propertyRefOrCoalesce,
            param,
            pointField,
            neo4jDatabaseInfo,
        });
    }

    // Comparison operations requires adding dates to durations
    // See https://neo4j.com/developer/cypher/dates-datetimes-durations/#comparing-filtering-values
    if (durationField && operator) {
        return createDurationOperation({ operator, property: propertyRefOrCoalesce, param });
    }

    return createBaseOperation({
        operator: operator || "EQ",
        target: propertyRefOrCoalesce,
        value: param,
    });
}

function createDurationOperation({
    operator,
    property,
    param,
}: {
    operator: string;
    property: Cypher.Expr;
    param: Cypher.Expr;
}) {
    const variable = Cypher.plus(Cypher.datetime(), param);
    const propertyRef = Cypher.plus(Cypher.datetime(), property);

    return createBaseOperation({
        operator,
        target: propertyRef,
        value: variable,
    });
}

export function createBaseOperation({
    operator,
    target,
    value,
}: {
    operator: string;
    target: Cypher.Expr;
    value: Cypher.Expr;
}): Cypher.ComparisonOp {
    switch (operator) {
        case "LT":
            return Cypher.lt(target, value);
        case "LTE":
            return Cypher.lte(target, value);
        case "GT":
            return Cypher.gt(target, value);
        case "GTE":
            return Cypher.gte(target, value);
        case "ENDS_WITH":
        case "NOT_ENDS_WITH":
            return Cypher.endsWith(target, value);
        case "STARTS_WITH":
        case "NOT_STARTS_WITH":
            return Cypher.startsWith(target, value);
        case "MATCHES":
            return Cypher.matches(target, value);
        case "CONTAINS":
        case "NOT_CONTAINS":
            return Cypher.contains(target, value);
        case "IN":
        case "NOT_IN":
            return Cypher.in(target, value);
        case "INCLUDES":
        case "NOT_INCLUDES":
            return Cypher.in(value, target);
        case "EQ":
        case "EQUAL":
        case "NOT":
            return Cypher.eq(target, value);
        default:
            throw new Error(`Invalid operator ${operator}`);
    }
}
