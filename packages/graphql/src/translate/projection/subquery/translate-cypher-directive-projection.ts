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
import type { Node } from "../../../classes";
import type { GraphQLSortArg, Context, CypherField } from "../../../types";
import Cypher from "@neo4j/cypher-builder";

import createProjectionAndParams, { ProjectionMeta } from "../../create-projection-and-params";
import { CompositeEntity } from "../../../schema-model/entity/CompositeEntity";

interface Res {
    projection: string[];
    params: any;
    meta: ProjectionMeta;
    subqueries: Array<Cypher.Clause>;
    subqueriesBeforeSort: Array<Cypher.Clause>;
}

export function translateCypherDirectiveProjection({
    context,
    cypherField,
    field,
    node,
    alias,
    param,
    chainStr,
    res,
}: {
    context: Context;
    cypherField: CypherField;
    field: ResolveTree;
    node: Node;
    chainStr: string;
    alias: string;
    param: string;
    res: Res;
}): Res {
    const referenceNode = context.nodes.find((x) => x.name === cypherField.typeMeta.name);
    const entity = context.schemaModel.entities.get(cypherField.typeMeta.name);

    const isArray = Boolean(cypherField.typeMeta.array);
    const expectMultipleValues = Boolean((referenceNode || entity instanceof CompositeEntity) && isArray);

    const fieldFields = field.fieldsByTypeName;

    const returnVariable = new Cypher.NamedVariable(param);
    const subqueries: Cypher.Clause[] = [];
    let projectionExpr: Cypher.Expr | undefined;
    let hasUnionLabelsPredicate: Cypher.Predicate | undefined;

    if (referenceNode) {
        const {
            projection: str,
            params: p,
            subqueries: nestedSubqueries,
            subqueriesBeforeSort: nestedSubqueriesBeforeSort,
        } = createProjectionAndParams({
            resolveTree: field,
            node: referenceNode || node,
            context,
            varName: param,
            chainStr: param,
        });

        projectionExpr = new Cypher.RawCypher(`${param} ${str}`);
        res.params = { ...res.params, ...p };
        subqueries.push(...nestedSubqueriesBeforeSort, ...nestedSubqueries);
    } else if (entity instanceof CompositeEntity) {
        const unionProjections: Array<{ predicate: Cypher.Predicate; projection: string }> = [];
        const labelsSubPredicates: Cypher.Predicate[] = [];

        const fieldFieldsKeys = Object.keys(fieldFields);
        const hasMultipleFieldFields = fieldFieldsKeys.length > 1;

        let referencedNodes =
            entity.concreteEntities
                ?.map((u) => context.nodes.find((n) => n.name === u.name))
                ?.filter((b) => b !== undefined) || [];
        if (hasMultipleFieldFields) {
            referencedNodes = referencedNodes?.filter((n) => fieldFieldsKeys.includes(n?.name ?? "")) || [];
        }
        referencedNodes.forEach((refNode, index) => {
            if (refNode) {
                const cypherNodeRef = new Cypher.NamedNode(param);
                const hasLabelsPredicates = refNode.getLabels(context).map((label) => cypherNodeRef.hasLabel(label));
                const labelsSubPredicate = Cypher.and(...hasLabelsPredicates);

                labelsSubPredicates.push(labelsSubPredicate);

                const subqueryParam = `${param}_${index}`;
                if (fieldFields[refNode.name]) {
                    const {
                        projection: str,
                        params: p,
                        subqueries: nestedSubqueries,
                    } = createProjectionAndParams({
                        resolveTree: field,
                        node: refNode,
                        context,
                        varName: subqueryParam,
                    });

                    if (nestedSubqueries.length > 0) {
                        const projectionVariable = new Cypher.NamedVariable(subqueryParam);

                        const beforeCallWith = new Cypher.With("*", [cypherNodeRef, projectionVariable]);

                        const withAndSubqueries = Cypher.concat(beforeCallWith, ...nestedSubqueries);
                        subqueries.push(withAndSubqueries);
                    }
                    unionProjections.push({
                        projection: `{ __resolveType: "${refNode.name}", ${str.replace("{", "")}`,
                        predicate: labelsSubPredicate,
                    });

                    res.params = { ...res.params, ...p };
                } else {
                    unionProjections.push({
                        projection: `{ __resolveType: "${refNode.name}" }`,
                        predicate: labelsSubPredicate,
                    });
                }
            }
        });

        hasUnionLabelsPredicate = Cypher.or(...labelsSubPredicates);
        projectionExpr = new Cypher.Case();
        for (const { projection, predicate } of unionProjections) {
            projectionExpr.when(predicate).then(new Cypher.RawCypher(`${param} ${projection}`));
        }
    }

    const runCypherInApocClause = createCypherDirectiveApocProcedure({
        nodeRef: new Cypher.NamedNode(chainStr),
        expectMultipleValues,
        context,
        field,
        cypherField,
    });
    const unwindClause = new Cypher.Unwind([runCypherInApocClause, param]);

    const unionExpression = hasUnionLabelsPredicate ? new Cypher.With("*").where(hasUnionLabelsPredicate) : undefined;

    const returnClause = createReturnClause({
        isArray,
        returnVariable,
        projectionExpr,
    });

    const callSt = new Cypher.Call(Cypher.concat(unwindClause, unionExpression, ...subqueries, returnClause)).innerWith(
        new Cypher.NamedVariable(chainStr)
    );

    const sortInput = (context.resolveTree.args.sort ??
        (context.resolveTree.args.options as any)?.sort ??
        []) as GraphQLSortArg[];
    const isSortArg = sortInput.find((obj) => Object.keys(obj)[0] === alias);
    if (isSortArg) {
        if (!res.meta.cypherSortFields) {
            res.meta.cypherSortFields = [];
        }
        res.meta.cypherSortFields.push(alias);
        res.subqueriesBeforeSort.push(callSt);
    } else {
        res.subqueries.push(callSt);
    }

    res.projection.push(`${alias}: ${param}`);
    return res;
}

// TODO: change this
function createCypherDirectiveApocProcedure({
    cypherField,
    field,
    expectMultipleValues,
    context,
    nodeRef,
}: {
    cypherField: CypherField;
    field: ResolveTree;
    expectMultipleValues: boolean;
    context: Context;
    nodeRef: Cypher.Node;
}): Cypher.apoc.RunFirstColumn {
    // Null default argument values are not passed into the resolve tree therefore these are not being passed to
    // `apocParams` below causing a runtime error when executing.
    const nullArgumentValues = cypherField.arguments.reduce(
        (r, argument) => ({
            ...r,
            [argument.name.value]: null,
        }),
        {}
    );

    const rawApocParams = Object.entries({ ...nullArgumentValues, ...field.args });

    const apocParams: Record<string, Cypher.Param> = rawApocParams.reduce((acc, [key, value]) => {
        acc[key] = new Cypher.Param(value);
        return acc;
    }, {});

    const apocParamsMap = new Cypher.Map({
        ...apocParams,
        this: nodeRef,
        ...(context.auth && { auth: new Cypher.NamedParam("auth") }),
        ...(Boolean(context.cypherParams) && { cypherParams: new Cypher.NamedParam("cypherParams") }),
    });
    const apocClause = new Cypher.apoc.RunFirstColumn(
        cypherField.statement,
        apocParamsMap,
        Boolean(expectMultipleValues)
    );
    return apocClause;
}

function createReturnClause({
    returnVariable,
    isArray,
    projectionExpr,
}: {
    returnVariable: Cypher.Variable;
    isArray: boolean;
    projectionExpr: Cypher.Expr | undefined;
}): Cypher.Return {
    let returnData: Cypher.Expr = projectionExpr || returnVariable;
    returnData = Cypher.collect(returnData);
    if (!isArray) {
        returnData = Cypher.head(returnData);
    }
    return new Cypher.Return([returnData, returnVariable]);
}
