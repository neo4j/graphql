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

import type { ResolveTree } from "graphql-parse-resolve-info";
import type { TemporalField } from "../../../types";
import * as Cypher from "../../cypher-builder/CypherBuilder";

/** Deprecated in favor of createDatetimeExpression */
export function createDatetimeElement({
    resolveTree,
    field,
    variable,
    valueOverride,
}: {
    resolveTree: ResolveTree;
    field: TemporalField;
    variable: string;
    valueOverride?: string;
}): string {
    const dbFieldName = field.dbPropertyName || resolveTree.name;
    return field.typeMeta.array
        ? `${resolveTree.alias}: [ dt in ${variable}.${dbFieldName} | ${wrapApocConvertDate("dt")} ]`
        : `${resolveTree.alias}: ${wrapApocConvertDate(valueOverride || `${variable}.${dbFieldName}`)}`;
}

export function wrapApocConvertDate(value: string): string {
    return `apoc.date.convertFormat(toString(${value}), "iso_zoned_date_time", "iso_offset_date_time")`;
}

export function createDatetimeExpression({
    resolveTree,
    field,
    variable,
}: {
    resolveTree: ResolveTree;
    field: TemporalField;
    variable: Cypher.Variable;
}): Cypher.Expr {
    const dbFieldName = field.dbPropertyName || resolveTree.name;

    const fieldProperty = variable.property(dbFieldName);

    if (field.typeMeta.array) {
        const comprehensionVariable = new Cypher.Variable();
        const apocFormat = createApocConvertFormat(comprehensionVariable);

        return new Cypher.ListComprehension(comprehensionVariable).in(fieldProperty).map(apocFormat);
    }
    return createApocConvertFormat(fieldProperty);
}

function createApocConvertFormat(variableOrProperty: Cypher.Variable | Cypher.PropertyRef): Cypher.Expr {
    return Cypher.apoc.date.convertFormat(variableOrProperty, "iso_zoned_date_time", "iso_offset_date_time");
}
