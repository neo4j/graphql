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
import type { QueryASTContext } from "../ast/QueryASTContext";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { CypherAnnotation } from "../../../schema-model/annotation/CypherAnnotation";

export function createCypherAnnotationSubquery({
    context,
    attribute,
    projectionFields,
}: {
    context: QueryASTContext;
    attribute: AttributeAdapter;
    projectionFields?: Record<string, string>;
}): Cypher.Clause {
    const cypherAnnotation = attribute.annotations.cypher;
    if (!cypherAnnotation) throw new Error("Missing Cypher Annotation on Cypher field");

    const statementSubquery = getStatementSubquery(context, cypherAnnotation);

    const columnName = new Cypher.NamedVariable(cypherAnnotation.columnName);
    const returnVariable = context.getScopeVariable(attribute.name);

    if (attribute.isScalar() || attribute.isEnum()) {
        statementSubquery.unwind([columnName, returnVariable]);
    } else {
        statementSubquery.with([columnName, returnVariable]);
    }

    const returnProjection = getProjectionExpr({ fromVariable: returnVariable, fields: projectionFields, attribute });
    return statementSubquery.return([returnProjection, returnVariable]);
}

function getStatementSubquery(context: QueryASTContext, cypherAnnotation: CypherAnnotation): Cypher.Call {
    const innerAlias = new Cypher.With([context.target, "this"]);
    const statementSubquery = new Cypher.RawCypher(cypherAnnotation.statement);

    return new Cypher.Call(Cypher.concat(innerAlias, statementSubquery)).innerWith(context.target);
}

function getProjectionExpr({
    fromVariable,
    fields,
    attribute,
}: {
    fromVariable: Cypher.Variable;
    fields: Record<string, string> | undefined;
    attribute: AttributeAdapter;
}): Cypher.Expr {
    let projection: Cypher.Expr = fromVariable;
    if (fields) {
        projection = new Cypher.MapProjection(fromVariable);

        for (const [alias, name] of Object.entries(fields)) {
            if (alias === name) projection.set(alias);
            else {
                projection.set({
                    [alias]: fromVariable.property(name),
                });
            }
        }
    }

    const collectedProjection = Cypher.collect(projection);

    if (!attribute.isList()) {
        return Cypher.head(collectedProjection);
    }
    return collectedProjection;
}
