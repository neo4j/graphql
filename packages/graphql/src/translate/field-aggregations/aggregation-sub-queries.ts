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

import { AggregationAuth } from "./field-aggregations-auth";
import { generateResultObject } from "./utils";
import { wrapApocConvertDate } from "../projection/elements/create-datetime-element";

export function createMatchWherePattern(matchPattern: string, auth: AggregationAuth): string {
    return `MATCH ${matchPattern}
        ${auth.whereQuery ? `WHERE ${auth.whereQuery}` : ""}${auth.query}`;
}

export function stringAggregationQuery(matchWherePattern: string, fieldName: string, targetAlias: string): string {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `${matchWherePattern}
        WITH ${targetAlias} as ${targetAlias}
        ORDER BY size(${fieldPath}) DESC
        WITH collect(${fieldPath}) as list
        RETURN {longest: head(list), shortest: last(list)}`;
}

export function numberAggregationQuery(matchWherePattern: string, fieldName: string, targetAlias: string): string {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `${matchWherePattern}
        RETURN {min: min(${fieldPath}), max: max(${fieldPath}), average: avg(${fieldPath})}`;
}

export function defaultAggregationQuery(matchWherePattern: string, fieldName: string, targetAlias: string): string {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `${matchWherePattern}
        RETURN {min: min(${fieldPath}), max: max(${fieldPath})}`;
}

export function dateTimeAggregationQuery(matchWherePattern: string, fieldName: string, targetAlias: string): string {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `${matchWherePattern}
        RETURN ${generateResultObject({
            min: wrapApocConvertDate(`min(${fieldPath})`),
            max: wrapApocConvertDate(`max(${fieldPath})`),
        })}`;
}

export function countQuery(matchWherePattern: string, targetAlias: string): string {
    return `${matchWherePattern}
    RETURN COUNT(${targetAlias})`;
}
