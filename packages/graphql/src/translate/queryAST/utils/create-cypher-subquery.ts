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
import { QueryASTContext } from "../ast/QueryASTContext";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { CypherAnnotation } from "../../../schema-model/annotation/CypherAnnotation";
import type { Field } from "../ast/fields/Field";

export function createCypherAnnotationSubquery({
    context,
    attribute,
    projectionFields,
    nestedFields,
}: {
    context: QueryASTContext;
    attribute: AttributeAdapter;
    projectionFields?: Record<string, string>;
    nestedFields?: Field[];
}): Cypher.Clause {
    const cypherAnnotation = attribute.annotations.cypher;
    if (!cypherAnnotation) throw new Error("Missing Cypher Annotation on Cypher field");

    const columnName = new Cypher.NamedVariable(cypherAnnotation.columnName);
    const returnVariable = context.getScopeVariable(attribute.name);

    const statementSubquery = getStatementSubquery(context, cypherAnnotation);
    const nestedFieldsSubqueries = getNestedFieldsSubqueries(returnVariable, context, nestedFields);

    if (attribute.isScalar() || attribute.isEnum()) {
        statementSubquery.unwind([columnName, returnVariable]);
    } else {
        statementSubquery.with([columnName, returnVariable]);
    }

    const returnProjection = getProjectionExpr({
        fromVariable: returnVariable,
        fields: projectionFields,
        attribute,
        nestedFields,
    });

    return Cypher.concat(
        statementSubquery,
        nestedFieldsSubqueries,
        new Cypher.Return([returnProjection, returnVariable])
    );
}

function isCypherNode(variable: Cypher.Variable): asserts variable is Cypher.Node {
    if (!(variable instanceof Cypher.Node)) {
        throw new Error("Compile Error: Expected Cypher.Variable to be a Cypher.Node");
    }
}

function getNestedFieldsSubqueries(
    target: Cypher.Variable,
    context: QueryASTContext,
    nestedFields: Field[] | undefined
): Cypher.Clause | undefined {
    if (!nestedFields) return undefined;
    isCypherNode(target);
    const nodeProjectionSubqueries = nestedFields.flatMap((f) =>
        f
            .getSubqueries(new QueryASTContext({ target, queryASTEnv: context.env }))
            .map((sq) => new Cypher.Call(sq).innerWith(target))
    );
    return Cypher.concat(...nodeProjectionSubqueries);
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
    nestedFields,
}: {
    fromVariable: Cypher.Variable;
    fields: Record<string, string> | undefined;
    attribute: AttributeAdapter;
    nestedFields?: Field[];
}): Cypher.Expr {
    let projection: Cypher.Expr = fromVariable;
    if (fields) {
        projection = new Cypher.MapProjection(fromVariable);
        // nested fields are presents only if the attribute is an object or an abstract type, and they produce a different projection
        if (nestedFields) {
            setSubqueriesProjection(projection, nestedFields, fromVariable);
        } else {
            setLeafsProjection(projection, fields, fromVariable);
        }
    }

    const collectedProjection = Cypher.collect(projection);

    if (!attribute.isList()) {
        return Cypher.head(collectedProjection);
    }
    return collectedProjection;
}

function setSubqueriesProjection(projection: Cypher.MapProjection, fields: Field[], fromVariable: Cypher.Variable) {
    const subqueriesProjection = fields?.map((f) => f.getProjectionField(fromVariable));
    for (const subqueryProjection of subqueriesProjection) {
        projection.set(subqueryProjection);
    }
}

function setLeafsProjection(
    projection: Cypher.MapProjection,
    fields: Record<string, string>,
    fromVariable: Cypher.Variable
) {
    for (const [alias, name] of Object.entries(fields)) {
        if (alias === name) projection.set(alias);
        else {
            projection.set({
                [alias]: fromVariable.property(name),
            });
        }
    }
}
