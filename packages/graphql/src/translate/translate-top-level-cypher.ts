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

import type { GraphQLResolveInfo } from "graphql";
import createProjectionAndParams from "./create-projection-and-params";
import type { Context, CypherField } from "../types";
import { createAuthAndParams } from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import Cypher from "@neo4j/cypher-builder";
import getNeo4jResolveTree from "../utils/get-neo4j-resolve-tree";
import createAuthParam from "./create-auth-param";
import { CompositeEntity } from "../schema-model/entity/CompositeEntity";

export function translateTopLevelCypher({
    context,
    info,
    field,
    args,
    type,
    statement,
}: {
    context: Context;
    info: GraphQLResolveInfo;
    field: CypherField;
    args: any;
    statement: string;
    type: "Query" | "Mutation";
}): Cypher.CypherResult {
    context.resolveTree = getNeo4jResolveTree(info);
    const { resolveTree } = context;
    let params = { ...args, auth: createAuthParam({ context }), cypherParams: context.cypherParams };
    const cypherStrs: string[] = [];

    const preAuth = createAuthAndParams({ entity: field, context });
    if (preAuth[0]) {
        params = { ...params, ...preAuth[1] };
        cypherStrs.push(`CALL apoc.util.validate(NOT (${preAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
    }

    let projectionStr = "";
    const projectionAuthStrs: string[] = [];
    const projectionSubqueries: Cypher.Clause[] = [];
    const connectionProjectionStrs: string[] = [];

    const referenceNode = context.nodes.find((x) => x.name === field.typeMeta.name);

    if (referenceNode) {
        const recurse = createProjectionAndParams({
            resolveTree,
            node: referenceNode,
            context,
            varName: `this`,
        });

        const { projection: str, params: p, meta, subqueries, subqueriesBeforeSort } = recurse;
        projectionStr = str;
        projectionSubqueries.push(...subqueriesBeforeSort, ...subqueries);
        params = { ...params, ...p };

        if (meta.authValidateStrs?.length) {
            projectionAuthStrs.push(...projectionAuthStrs, meta.authValidateStrs.join(" AND "));
        }
    }

    const unionWhere: string[] = [];

    const entity = context.schemaModel.entities.get(field.typeMeta.name);

    if (entity instanceof CompositeEntity) {
        const headStrs: string[] = [];
        const referencedNodes =
            entity.concreteEntities
                ?.map((u) => context.nodes.find((n) => n.name === u.name))
                ?.filter((b) => b !== undefined)
                ?.filter((n) => Object.keys(resolveTree.fieldsByTypeName).includes(n?.name ?? "")) || [];

        referencedNodes.forEach((node) => {
            if (node) {
                const labelsStatements = node.getLabels(context).map((label) => `"${label}" IN labels(this)`);
                unionWhere.push(`(${labelsStatements.join("AND")})`);

                const innerHeadStr: string[] = [`[ this IN [this] WHERE (${labelsStatements.join(" AND ")})`];

                if (resolveTree.fieldsByTypeName[node.name]) {
                    const {
                        projection: str,
                        params: p,
                        meta,
                        subqueries,
                    } = createProjectionAndParams({
                        resolveTree,
                        node,
                        context,
                        varName: "this",
                    });

                    projectionSubqueries.push(...subqueries);

                    innerHeadStr.push(
                        [`| this { __resolveType: "${node.name}", `, ...str.replace("{", "").split("")].join("")
                    );
                    params = { ...params, ...p };

                    if (meta.authValidateStrs?.length) {
                        projectionAuthStrs.push(meta.authValidateStrs.join(" AND "));
                    }
                } else {
                    innerHeadStr.push(`| this { __resolveType: "${node.name}" } `);
                }

                innerHeadStr.push(`]`);

                headStrs.push(innerHeadStr.join(" "));
            }
        });

        projectionStr = `${headStrs.join(" + ")}`;
    }

    const initApocParamsStrs = ["auth: $auth", ...(context.cypherParams ? ["cypherParams: $cypherParams"] : [])];

    // Null default argument values are not passed into the resolve tree therefore these are not being passed to
    // `apocParams` below causing a runtime error when executing.
    const nullArgumentValues = field.arguments.reduce(
        (res, argument) => ({
            ...res,
            ...{ [argument.name.value]: null },
        }),
        {}
    );

    const apocParams = Object.entries({ ...nullArgumentValues, ...resolveTree.args }).reduce(
        (result: { strs: string[]; params: { [key: string]: unknown } }, entry) => ({
            strs: [...result.strs, `${entry[0]}: $${entry[0]}`],
            params: { ...result.params, [entry[0]]: entry[1] },
        }),
        { strs: initApocParamsStrs, params }
    );

    params = { ...params, ...apocParams.params };

    const apocParamsStr = `{${apocParams.strs.length ? `${apocParams.strs.join(", ")}` : ""}}`;

    if (type === "Query") {
        if (field.columnName) {
            const experimentalCypherStatement = createCypherDirectiveSubquery({
                field,
            });
            cypherStrs.push(...experimentalCypherStatement);
        } else {
            const legacyCypherStatement = createCypherDirectiveApocProcedure({
                field,
                apocParams: apocParamsStr,
            });
            cypherStrs.push(...legacyCypherStatement);
        }
    } else {
        cypherStrs.push(`
            CALL apoc.cypher.doIt("${statement}", ${apocParamsStr}) YIELD value
            WITH [k in keys(value) | value[k]][0] AS this
            `);
    }

    if (unionWhere.length) {
        cypherStrs.push(`WHERE ${unionWhere.join(" OR ")}`);
    }

    if (projectionAuthStrs.length) {
        cypherStrs.push(
            `WHERE apoc.util.validatePredicate(NOT (${projectionAuthStrs.join(
                " AND "
            )}), "${AUTH_FORBIDDEN_ERROR}", [0])`
        );
    }

    cypherStrs.push(connectionProjectionStrs.join("\n"));
    const projectionSubquery = Cypher.concat(...projectionSubqueries);

    return new Cypher.RawCypher((env) => {
        const subqueriesStr = projectionSubquery ? `\n${projectionSubquery.getCypher(env)}` : "";
        if (subqueriesStr) cypherStrs.push(subqueriesStr);

        if (field.isScalar || field.isEnum) {
            cypherStrs.push(`RETURN this`);
        } else if (entity instanceof CompositeEntity) {
            cypherStrs.push(`RETURN head( ${projectionStr} ) AS this`);
        } else {
            cypherStrs.push(`RETURN this ${projectionStr} AS this`);
        }
        return [cypherStrs.join("\n"), params];
    }).build();
}

function createCypherDirectiveApocProcedure({
    field,
    apocParams,
}: {
    field: CypherField;
    apocParams: string;
}): string[] {
    const isArray = field.typeMeta.array;
    const expectMultipleValues = !field.isScalar && !field.isEnum && isArray;
    const cypherStrs: string[] = [];

    if (expectMultipleValues) {
        cypherStrs.push(`WITH apoc.cypher.runFirstColumnMany("${field.statement}", ${apocParams}) as x`);
    } else {
        cypherStrs.push(`WITH apoc.cypher.runFirstColumnSingle("${field.statement}", ${apocParams}) as x`);
    }

    cypherStrs.push("UNWIND x as this\nWITH this");
    return cypherStrs;
}

function createCypherDirectiveSubquery({ field }: { field: CypherField }): string[] {
    const cypherStrs: string[] = [];
    cypherStrs.push("CALL {", field.statement, "}");

    if (field.columnName) {
        if (field.isScalar || field.isEnum) {
            cypherStrs.push(`UNWIND ${field.columnName} as this`);
        } else {
            cypherStrs.push(`WITH ${field.columnName} as this`);
        }
    }
    return cypherStrs;
}
