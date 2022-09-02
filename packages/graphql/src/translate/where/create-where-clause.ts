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
import type { Neo4jDatabaseInfo } from "../../classes/Neo4jDatabaseInfo";
import type { PointField, PrimitiveField } from "../../types";
import type { WhereOperator } from "./types";
import { comparisonMap } from "./utils";

// TODO: remove after refactor
export default function createWhereClause({
    property,
    param,
    operator,
    isNot,
    durationField,
    pointField,
    neo4jDatabaseInfo,
}: {
    property: string;
    param: string;
    operator?: WhereOperator;
    isNot: boolean;
    pointField?: PointField;
    durationField?: PrimitiveField;
    neo4jDatabaseInfo: Neo4jDatabaseInfo;
}): string {
    const negateClauseIfNOT = (clause: string) => (isNot ? `(NOT ${clause})` : clause);

    if (pointField) {
        const paramPoint = `point($${param})`;
        const paramPointArray = `[p in $${param} | point(p)]`;
        const distanceFn = neo4jDatabaseInfo.gte("4.4") ? "point.distance" : "distance";
        switch (operator) {
            case "LT":
            case "LTE":
            case "GT":
            case "GTE":
            case "DISTANCE":
                return `${distanceFn}(${property}, point($${param}.point)) ${comparisonMap[operator]} $${param}.distance`;
            case "NOT_IN":
            case "IN":
                return negateClauseIfNOT(`${property} IN ${paramPointArray}`);
            case "NOT_INCLUDES":
            case "INCLUDES":
                return negateClauseIfNOT(`${paramPoint} IN ${property}`);
            default:
                return negateClauseIfNOT(`${property} = ${pointField.typeMeta.array ? paramPointArray : paramPoint}`);
        }
    }
    // Comparison operations requires adding dates to durations
    // See https://neo4j.com/developer/cypher/dates-datetimes-durations/#comparing-filtering-values
    if (durationField && operator) {
        return `datetime() + ${property} ${comparisonMap[operator]} datetime() + $${param}`;
    }

    const comparison = operator ? comparisonMap[operator] : "=";

    switch (operator) {
        case "NOT_INCLUDES":
        case "INCLUDES":
            return negateClauseIfNOT(`$${param} ${comparison} ${property}`);
        default:
            return negateClauseIfNOT(`${property} ${comparison} $${param}`);
    }
}
