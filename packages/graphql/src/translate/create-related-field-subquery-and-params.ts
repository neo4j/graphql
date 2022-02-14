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

import { ResolveTree } from "graphql-parse-resolve-info";
import { mergeDeep } from "@graphql-tools/utils";
import { Context, GraphQLWhereArg, RelatedField } from "../types";
// eslint-disable-next-line import/no-cycle
import createProjectionAndParams from "./create-projection-and-params";
import filterInterfaceNodes from "../utils/filter-interface-nodes";

function createRelatedFieldSubqueryAndParams({
    resolveTree,
    field,
    context,
    nodeVariable,
}: {
    field: RelatedField;
    context: Context;
    nodeVariable: string;
    resolveTree: ResolveTree;
    parameterPrefix?: string;
}): [string, Record<string, any>] {
    let params = {};
    const targetVariable = `${nodeVariable}_${resolveTree.alias}`;

    const whereInput = (resolveTree.args.where ?? {}) as GraphQLWhereArg;

    const isAbstractType = Boolean(field.union || field.interface);

    const nodeSubquery = context.nodes
        .filter(
            (node) =>
                node.name === field.typeMeta.name ||
                (field.interface?.implementations?.includes(node.name) && filterInterfaceNodes({ node, whereInput })) ||
                (field.union?.nodes?.includes(node.name) &&
                    (!resolveTree.args.where ||
                        Object.prototype.hasOwnProperty.call(resolveTree.args.where, node.name)))
        )
        .map((node) => {
            const labels = node.getLabelString(context);

            const splitStatement = field.statement
                // TODO: OPTIONAL? This will otherwise affect the number of rows.
                .replace(/MATCH/gi, "OPTIONAL MATCH")
                .split(/(RETURN\s+\$\$target)/gi);
            const returnIndex = splitStatement.findIndex((v) => /RETURN\s+\$\$target/i.test(v));

            const replacedStatement = splitStatement.map((s) =>
                s
                    .replace("$$source", nodeVariable)
                    .replace("($$target", `(${targetVariable}${labels}`)
                    .replace("$$target", targetVariable)
                    .trim()
            );
            const before = replacedStatement.slice(0, returnIndex);
            // TODO: Handle subclause
            // const after = replacedStatement.slice(returnIndex + 1);

            // Projection
            const [projection, projectionParams, projectionMeta] = createProjectionAndParams({
                resolveTree,
                node,
                context,
                varName: targetVariable,
                resolveType: isAbstractType,
            });
            params = mergeDeep([params, projectionParams]);
            return [
                isAbstractType ? `WITH ${nodeVariable}` : "",
                before,
                projectionMeta.subQueries.join("\n"),
                `RETURN ${targetVariable} ${projection} AS ${targetVariable}`,
            ]
                .filter(Boolean)
                .join("\n");
        })
        .join("\nUNION\n");

    const subquery = [
        "CALL {",
        `WITH ${nodeVariable}`,
        isAbstractType ? ["CALL {", nodeSubquery, "}"].join("\n") : nodeSubquery,
        isAbstractType ? `RETURN ${targetVariable}` : "",
        "}",
    ]
        .filter(Boolean)
        .join("\n");

    return [subquery, params];
}

export default createRelatedFieldSubqueryAndParams;
