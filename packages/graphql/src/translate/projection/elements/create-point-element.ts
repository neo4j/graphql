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
import { getOrCreateCypherVariable } from "../../utils/get-or-create-cypher-variable";
import type { PointField } from "../../../types";
import * as Cypher from "../../cypher-builder/CypherBuilder";

export default function createPointElement({
    resolveTree,
    field,
    variable,
}: {
    resolveTree: ResolveTree;
    field: PointField;
    variable: string;
}): string {
    const expression = createPointExpression({ resolveTree, field, variable });

    const cypherClause = new Cypher.RawCypher((env) => {
        return expression.getCypher(env);
    });
    const { cypher } = cypherClause.build("p_");
    return `${resolveTree.alias}: (${cypher})`;
}

export function createPointExpression({
    resolveTree,
    field,
    variable,
}: {
    resolveTree: ResolveTree;
    field: PointField;
    variable: string | Cypher.Variable;
}): Cypher.Expr {
    const isArray = field.typeMeta.array;

    const { crs, ...point } = resolveTree.fieldsByTypeName[field.typeMeta.name];
    const dbFieldName = field.dbPropertyName || resolveTree.name;

    const CypherVariable = getOrCreateCypherVariable(variable);

    // Sadly need to select the whole point object due to the risk of height/z
    // being selected on a 2D point, to which the database will throw an error
    let caseResult: Cypher.Expr;
    if (isArray) {
        const projectionVar = new Cypher.Variable();

        const projectionMap = createPointProjectionMap({
            variableOrProperty: projectionVar,
            crs,
            point,
        });

        caseResult = new Cypher.ListComprehension(projectionVar)
            .in(CypherVariable.property(dbFieldName))
            .map(projectionMap);
    } else {
        caseResult = createPointProjectionMap({
            variableOrProperty: CypherVariable.property(dbFieldName),
            crs,
            point,
        });
    }

    return new Cypher.Case()
        .when(Cypher.isNotNull(CypherVariable.property(dbFieldName)))
        .then(caseResult)
        .else(Cypher.Null);
}

function createPointProjectionMap({
    variableOrProperty,
    crs,
    point,
}: {
    variableOrProperty: Cypher.Variable | Cypher.PropertyRef;
    crs: unknown;
    point: unknown;
}): Cypher.Map {
    const projectionMap = new Cypher.Map();
    if (point) {
        projectionMap.set({ point: variableOrProperty });
    }
    if (crs) {
        projectionMap.set({ crs: variableOrProperty.property("crs") });
    }

    return projectionMap;
}
