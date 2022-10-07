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
import { GraphQLUnionType } from "graphql";
import type { Node } from "../../../classes";
import type { GraphQLSortArg, Context, CypherField } from "../../../types";
import * as CypherBuilder from "../../cypher-builder/CypherBuilder";

import createProjectionAndParams, { ProjectionMeta } from "../../create-projection-and-params";

interface Res {
    projection: string[];
    params: any;
    meta: ProjectionMeta;
    subqueries: Array<CypherBuilder.Clause>;
    subqueriesBeforeSort: Array<CypherBuilder.Clause>;
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
    const graphqlType = context.schema.getType(cypherField.typeMeta.name);
    const referenceUnion = graphqlType instanceof GraphQLUnionType ? graphqlType.astNode : undefined;

    const isArray = Boolean(cypherField.typeMeta.array);
    const expectMultipleValues = Boolean((referenceNode || referenceUnion) && isArray);

    const fieldFields = field.fieldsByTypeName;

    const returnVariable = new CypherBuilder.NamedVariable(param);
    const subqueries: CypherBuilder.Clause[] = [];
    let projectionExpr: CypherBuilder.Expr | undefined;
    let hasUnionLabelsPredicate: CypherBuilder.Predicate | undefined;

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

        projectionExpr = new CypherBuilder.RawCypher(`${param} ${str}`);
        res.params = { ...res.params, ...p };
        subqueries.push(...nestedSubqueriesBeforeSort, ...nestedSubqueries);
    } else if (referenceUnion) {
        const unionProjections: Array<{ predicate: CypherBuilder.Predicate; projection: string }> = [];
        const labelsSubPredicates: CypherBuilder.Predicate[] = [];

        const fieldFieldsKeys = Object.keys(fieldFields);
        const hasMultipleFieldFields = fieldFieldsKeys.length > 1;

        let referencedNodes =
            referenceUnion?.types
                ?.map((u) => context.nodes.find((n) => n.name === u.name.value))
                ?.filter((b) => b !== undefined) || [];
        if (hasMultipleFieldFields) {
            referencedNodes = referencedNodes?.filter((n) => fieldFieldsKeys.includes(n?.name ?? "")) || [];
        }
        referencedNodes.forEach((refNode, index) => {
            if (refNode) {
                const cypherNodeRef = new CypherBuilder.NamedNode(param);
                const hasLabelsPredicates = refNode.getLabels(context).map((label) => cypherNodeRef.hasLabel(label));
                const labelsSubPredicate = CypherBuilder.and(...hasLabelsPredicates);

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
                        const projectionVariable = new CypherBuilder.NamedVariable(subqueryParam);

                        const beforeCallWith = new CypherBuilder.With("*", [cypherNodeRef, projectionVariable]);

                        const withAndSubqueries = CypherBuilder.concat(beforeCallWith, ...nestedSubqueries);
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

        hasUnionLabelsPredicate = CypherBuilder.or(...labelsSubPredicates);
        projectionExpr = new CypherBuilder.Case();
        for (const { projection, predicate } of unionProjections) {
            projectionExpr.when(predicate).then(new CypherBuilder.RawCypher(`${param} ${projection}`));
        }
    }

    const runCypherInApocClause = createCypherDirectiveApocProcedure({
        nodeRef: new CypherBuilder.NamedNode(chainStr),
        expectMultipleValues,
        context,
        field,
        cypherField,
    });
    const unwindClause = new CypherBuilder.Unwind([runCypherInApocClause, param]);

    const unionExpression = hasUnionLabelsPredicate
        ? new CypherBuilder.With("*").where(hasUnionLabelsPredicate)
        : undefined;

    const returnClause = createReturnClause({
        isArray,
        returnVariable,
        projectionExpr,
    });

    const callSt = new CypherBuilder.Call(
        CypherBuilder.concat(unwindClause, unionExpression, ...subqueries, returnClause)
    ).innerWith(new CypherBuilder.NamedVariable(chainStr));

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
    nodeRef: CypherBuilder.Node;
}): CypherBuilder.apoc.RunFirstColumn {
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

    const apocParams: Record<string, CypherBuilder.Param> = rawApocParams.reduce((acc, [key, value]) => {
        acc[key] = new CypherBuilder.Param(value);
        return acc;
    }, {});

    const apocParamsMap = new CypherBuilder.Map({
        ...apocParams,
        this: nodeRef,
        ...(context.auth && { auth: new CypherBuilder.NamedParam("auth") }),
        ...(Boolean(context.cypherParams) && { cypherParams: new CypherBuilder.NamedParam("cypherParams") }),
    });
    const apocClause = new CypherBuilder.apoc.RunFirstColumn(
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
    returnVariable: CypherBuilder.Variable;
    isArray: boolean;
    projectionExpr: CypherBuilder.Expr | undefined;
}): CypherBuilder.Return {
    let returnData: CypherBuilder.Expr = projectionExpr || returnVariable;
    returnData = CypherBuilder.collect(returnData);
    if (!isArray) {
        returnData = CypherBuilder.head(returnData);
    }
    return new CypherBuilder.Return([returnData, returnVariable]);
}
