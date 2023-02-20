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
    projection: Cypher.Expr[];
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
    nodeRef,
    res,
    cypherFieldAliasMap,
}: {
    context: Context;
    cypherField: CypherField;
    field: ResolveTree;
    node: Node;
    nodeRef: Cypher.Node;
    alias: string;
    param: Cypher.Relationship | Cypher.Node;
    res: Res;
    cypherFieldAliasMap: any;
}): Res {
    const resultVariable = new Cypher.Node();
    cypherFieldAliasMap[`${nodeRef.prefix}_${alias}`] = resultVariable;
    //const resultVariable = new Cypher.NamedNode(`${nodeRef.prefix}_${alias}`);
    const referenceNode = context.nodes.find((x) => x.name === cypherField.typeMeta.name);
    const entity = context.schemaModel.entities.get(cypherField.typeMeta.name);

    const isArray = Boolean(cypherField.typeMeta.array);
    const expectMultipleValues = Boolean((referenceNode || entity instanceof CompositeEntity) && isArray);

    const fieldFields = field.fieldsByTypeName;

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
            varName: resultVariable,
            cypherFieldAliasMap
        });

        projectionExpr = new Cypher.RawCypher((env) => {
            return `${resultVariable.getCypher(env)} ${str.getCypher(env)}`;
        });
        res.params = { ...res.params, ...p };
        subqueries.push(...nestedSubqueriesBeforeSort, ...nestedSubqueries);
    } else if (entity instanceof CompositeEntity) {
        const unionProjections: Array<{ predicate: Cypher.Predicate; projection: Cypher.Expr }> = [];
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
                const subqueryParam = new Cypher.Node();

                const cypherNodeRef = resultVariable as Cypher.Node;
                const hasLabelsPredicates = refNode.getLabels(context).map((label) => cypherNodeRef.hasLabel(label));
                const labelsSubPredicate = Cypher.and(...hasLabelsPredicates);

                labelsSubPredicates.push(labelsSubPredicate);

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
                        cypherFieldAliasMap
                    });

                    if (nestedSubqueries.length > 0) {
                        const projectionVariable = subqueryParam;

                        const beforeCallWith = new Cypher.With("*", [cypherNodeRef, projectionVariable]);

                        const withAndSubqueries = Cypher.concat(beforeCallWith, ...nestedSubqueries);
                        subqueries.push(withAndSubqueries);
                    }
                    const projection = new Cypher.RawCypher(
                        (env) => `{ __resolveType: "${refNode.name}", ${str.getCypher(env).replace("{", "")}`
                    );
                    unionProjections.push({
                        projection,
                        predicate: labelsSubPredicate,
                    });

                    res.params = { ...res.params, ...p };
                } else {
                    const projection = new Cypher.RawCypher(() => `{ __resolveType: "${refNode.name}" }`);
                    unionProjections.push({
                        projection,
                        predicate: labelsSubPredicate,
                    });
                }
            }
        });

        hasUnionLabelsPredicate = Cypher.or(...labelsSubPredicates);
        projectionExpr = new Cypher.Case();
        for (const { projection, predicate } of unionProjections) {
            projectionExpr
                .when(predicate)
                .then(new Cypher.RawCypher((env) => `${resultVariable.getCypher(env)} ${projection.getCypher(env)}`));
        }
    }

    let customCypherClause: Cypher.Clause | undefined;

    // Null default argument values are not passed into the resolve tree therefore these are not being passed to
    // `apocParams` below causing a runtime error when executing.
    const nullArgumentValues = cypherField.arguments.reduce(
        (r, argument) => ({
            ...r,
            [argument.name.value]: null,
        }),
        {}
    );
    const extraArgs = { ...nullArgumentValues, ...field.args };

    if (!cypherField.columnName) {
        const runCypherInApocClause = createCypherDirectiveApocProcedure({
            nodeRef,
            expectMultipleValues,
            context,
            cypherField,
            extraArgs,
        });
        customCypherClause = new Cypher.Unwind([runCypherInApocClause, resultVariable]);
    } else {
        customCypherClause = createCypherDirectiveSubquery({
            cypherField,
            nodeRef,
            resultVariable,
            extraArgs,
        });
    }

    const unionExpression = hasUnionLabelsPredicate ? new Cypher.With("*").where(hasUnionLabelsPredicate) : undefined;

    const returnClause = createReturnClause({
        isArray,
        returnVariable: resultVariable,
        projectionExpr,
    });

    const callSt = new Cypher.Call(
        Cypher.concat(customCypherClause, unionExpression, ...subqueries, returnClause)
    ).innerWith(nodeRef);

    const sortInput = (context.resolveTree.args.sort ??
        (context.resolveTree.args.options as any)?.sort ??
        []) as GraphQLSortArg[];
    const isSortArg = sortInput.find((obj) => Object.keys(obj).includes(alias));
    if (isSortArg) {
        if (!res.meta.cypherSortFields) {
            res.meta.cypherSortFields = [];
        }
        res.meta.cypherSortFields.push(alias);
        res.subqueriesBeforeSort.push(callSt);
    } else {
        res.subqueries.push(callSt);
    }
    const aliasVar = new Cypher.NamedVariable(alias);
    //const paramVar = param;
    res.projection.push(new Cypher.RawCypher((env) => `${aliasVar.getCypher(env)}: ${resultVariable.getCypher(env)}`));
    return res;
}

function createCypherDirectiveApocProcedure({
    cypherField,
    expectMultipleValues,
    context,
    nodeRef,
    extraArgs,
}: {
    cypherField: CypherField;
    expectMultipleValues: boolean;
    context: Context;
    nodeRef: Cypher.Node;
    extraArgs: Record<string, any>;
}): Cypher.apoc.RunFirstColumn {
    const rawApocParams = Object.entries(extraArgs);

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

function createCypherDirectiveSubquery({
    cypherField,
    nodeRef,
    resultVariable,
    extraArgs,
}: {
    cypherField: CypherField;
    nodeRef: Cypher.Node;
    resultVariable: Cypher.Variable;
    extraArgs: Record<string, any>;
}): Cypher.Clause {
    const innerWithAlias = new Cypher.With([nodeRef, new Cypher.NamedNode("this")]);
    const rawCypher = new Cypher.RawCypher((env) => {
        let statement = cypherField.statement;
        for (const [key, value] of Object.entries(extraArgs)) {
            const param = new Cypher.Param(value);
            const paramName = param.getCypher(env);
            statement = statement.replaceAll(`$${key}`, `${paramName}`);
        }
        return statement;
    });

    const callClause = new Cypher.Call(Cypher.concat(innerWithAlias, rawCypher)).innerWith(nodeRef);

    if (cypherField.columnName) {
        const columnVariable = new Cypher.NamedVariable(cypherField.columnName);

        if (cypherField.isScalar || cypherField.isEnum) {
            callClause.unwind([columnVariable, resultVariable]);
        } else {
            callClause.with([columnVariable, resultVariable]);
        }
    }
    return callClause;
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
