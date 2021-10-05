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

export function stringAggregationQuery(
    matchPattern: string,
    fieldName: string,
    targetAlias: string,
    authQuery: string
): string {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `MATCH ${matchPattern}
        ${authQuery}
        WITH ${targetAlias} as ${targetAlias}
        ORDER BY size(${fieldPath}) DESC
        WITH collect(${fieldPath}) as list
        RETURN {longest: head(list), shortest: last(list)}`;
}

export function numberAggregationQuery(
    matchPattern: string,
    fieldName: string,
    targetAlias: string,
    authQuery: string
): string {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `MATCH ${matchPattern}
        ${authQuery}
        RETURN {min: MIN(${fieldPath}), max: MAX(${fieldPath}), average: AVG(${fieldPath})}`;
}

export function defaultAggregationQuery(
    matchPattern: string,
    fieldName: string,
    targetAlias: string,
    authQuery: string
): string {
    const fieldPath = `${targetAlias}.${fieldName}`;
    return `MATCH ${matchPattern}
        ${authQuery}
        RETURN {min: MIN(${fieldPath}), max: MAX(${fieldPath})}`;
}

export function countQuery(matchPattern: string, targetAlias: string, authQuery: string): string {
    return `MATCH ${matchPattern}
    ${authQuery}
    RETURN COUNT(${targetAlias})`;
}
