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
import type { Node } from "../classes";
import createProjectionAndParams from "./create-projection-and-params";
import createCreateAndParams from "./create-create-and-params";
import type { Context, ConnectionField, RelationField } from "../types";
import { AUTH_FORBIDDEN_ERROR, META_CYPHER_VARIABLE } from "../constants";
import createConnectionAndParams from "./connection/create-connection-and-params";
import { filterTruthy } from "../utils/utils";
import { CallbackBucket } from "../classes/CallbackBucket";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { compileCypherIfExists } from "./cypher-builder/utils/utils";

import type { TreeDescriptor, CreateInput } from "./batch-create/batch-create";
import { inputTreeToCypherMap, mergeTreeDescriptors, getTreeDescriptor, parseCreate, UnwindCreateVisitor  } from "./batch-create/batch-create";

export default async function translateCreate({
    context,
    node,
}: {
    context: Context;
    node: Node;
}): Promise<{ cypher: string; params: Record<string, any> }> {
    const { resolveTree } = context;
    const connectionStrs: string[] = [];
    const interfaceStrs: string[] = [];

    const projectionWith: string[] = [];
    const callbackBucket: CallbackBucket = new CallbackBucket(context);

    let connectionParams: any = {};

    const mutationResponse = resolveTree.fieldsByTypeName[node.mutationResponseTypeNames.create];

    const nodeProjection = Object.values(mutationResponse).find((field) => field.name === node.plural);
    const metaNames: string[] = [];

    const input = resolveTree.args.input as CreateInput | CreateInput[];
    const unwind = inputTreeToCypherMap(input, node, context);
    const treeDescriptor = Array.isArray(input)
        ? mergeTreeDescriptors(input.map((el: CreateInput) => getTreeDescriptor(el, node, context)))
        : getTreeDescriptor(input, node, context);
    const unwindVar = new CypherBuilder.Variable();
    const unwindQuery = new CypherBuilder.Unwind([unwind, unwindVar]);

    const createNodeAST = parseCreate(treeDescriptor, node, context);
    const unwindCreateVisitor = new UnwindCreateVisitor(unwindVar, context);
    createNodeAST.accept(unwindCreateVisitor);
    const [rootNodeVariable, createPhase] = unwindCreateVisitor.build();
    if (!rootNodeVariable || !createPhase) {
        throw new Error("Generic Error");
    }
    const createUnwind = CypherBuilder.concat(unwindQuery, createPhase);

    let replacedProjectionParams: Record<string, unknown> = {};
    let projectionCypher: CypherBuilder.Expr | undefined;
    let authCalls: string | undefined;

    if (metaNames.length > 0) {
        projectionWith.push(`${metaNames.join(" + ")} AS meta`);
    }

    let projectionSubquery: CypherBuilder.Clause | undefined;
    if (nodeProjection) {
        let projAuth = "";
        const projection = createProjectionAndParams({
            node,
            context,
            resolveTree: nodeProjection,
            varName: "REPLACE_ME",
        });
        projectionSubquery = CypherBuilder.concat(...projection.subqueries);
        if (projection.meta?.authValidateStrs?.length) {
            projAuth = `CALL apoc.util.validate(NOT (${projection.meta.authValidateStrs.join(
                " AND "
            )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
        }

        replacedProjectionParams = Object.entries(projection.params).reduce((res, [key, value]) => {
            return { ...res, [key.replace("REPLACE_ME", "projection")]: value };
        }, {});

        projectionCypher = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
            return `${rootNodeVariable.getCypher(env)} ${projection.projection
                // First look to see if projection param is being reassigned
                // e.g. in an apoc.cypher.runFirstColumn function call used in createProjection->connectionField
                .replace(/REPLACE_ME(?=\w+: \$REPLACE_ME)/g, "projection")
                .replace(/\$REPLACE_ME/g, "$projection")
                .replace(/REPLACE_ME/g, `${rootNodeVariable.getCypher(env)}`)}`;
        });

        /*      TODO: AUTH
        authCalls = createStrs
            .map((_, i) => projAuth.replace(/\$REPLACE_ME/g, "$projection").replace(/REPLACE_ME/g, `this${i}`))
            .join("\n"); */

        const withVars = context.subscriptionsEnabled ? [META_CYPHER_VARIABLE] : [];
        if (projection.meta?.connectionFields?.length) {
            projection.meta.connectionFields.forEach((connectionResolveTree) => {
                const connectionField = node.connectionFields.find(
                    (x) => x.fieldName === connectionResolveTree.name
                ) as ConnectionField;
                const connection = createConnectionAndParams({
                    resolveTree: connectionResolveTree,
                    field: connectionField,
                    context,
                    nodeVariable: "REPLACE_ME",
                    withVars,
                });
                connectionStrs.push(connection[0]);
                if (!connectionParams) connectionParams = {};
                connectionParams = { ...connectionParams, ...connection[1] };
            });
        }
    }

    const replacedConnectionStrs = connectionStrs.length
        ? new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
              return connectionStrs
                  .map((connectionStr) => connectionStr.replace(/REPLACE_ME/g, `${rootNodeVariable.getCypher(env)}`))
                  .join("\n");
          })
        : undefined;

    const replacedInterfaceStrs = interfaceStrs.length
        ? new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
              return interfaceStrs
                  .map((interfaceStr) => interfaceStr.replace(/REPLACE_ME/g, `${rootNodeVariable.getCypher(env)}`))
                  .join("\n");
          })
        : undefined;

    // TODO: support it
    /*     const replacedConnectionParams = connectionParams
        ? createStrs.reduce((res1, _, i) => {
              return {
                  ...res1,
                  ...Object.entries(connectionParams).reduce((res2, [key, value]) => {
                      return { ...res2, [key.replace("REPLACE_ME", `this${i}`)]: value };
                  }, {}),
              };
          }, {})

        : {}; */

    /*     const replacedInterfaceParams = interfaceParams
        ? createStrs.reduce((res1, _, i) => {
              return {
                  ...res1,
                  ...Object.entries(interfaceParams).reduce((res2, [key, value]) => {
                      return { ...res2, [key.replace("REPLACE_ME", `this${i}`)]: value };
                  }, {}),
              };
          }, {})
        : {}; */

    const returnStatement = generateCreateReturnStatementCypher(projectionCypher, context.subscriptionsEnabled);
    const projectionWithStr = context.subscriptionsEnabled ? `WITH ${projectionWith.join(", ")}` : "";

    const createQuery = new CypherBuilder.RawCypher((env) => {
        const projectionSubqueryStr = compileCypherIfExists(projectionSubquery, env);
        const projectionConnectionStrs = compileCypherIfExists(replacedConnectionStrs, env);
        const projectionInterfaceStrs = compileCypherIfExists(replacedInterfaceStrs, env);
        // TODO: avoid REPLACE_ME

        const replacedProjectionSubqueryStrs = projectionSubqueryStr
            .replace(/REPLACE_ME(?=\w+: \$REPLACE_ME)/g, "projection")
            .replace(/\$REPLACE_ME/g, "$projection")
            .replace(/REPLACE_ME/g, `${rootNodeVariable.getCypher(env)}`);

        const cypher = filterTruthy([
            createUnwind.getCypher(env),
            projectionWithStr,
            authCalls,
            projectionConnectionStrs,
            projectionInterfaceStrs,
            replacedProjectionSubqueryStrs,
            returnStatement.getCypher(env),
        ])
            .filter(Boolean)
            .join("\n");

        return [
            cypher,
            {
                ...replacedProjectionParams,
            },
        ];
    });
    const createQueryCypher = createQuery.build("create_");
    const { cypher, params: resolvedCallbacks } = await callbackBucket.resolveCallbacksAndFilterCypher({
        cypher: createQueryCypher.cypher,
    });
    return {
        cypher,
        params: {
            ...createQueryCypher.params,
            resolvedCallbacks,
        },
    };
}
function generateCreateReturnStatementCypher(
    projection: CypherBuilder.Expr | undefined,
    subscriptionsEnabled: boolean
): CypherBuilder.Expr {
    return new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
        const statements: string[] = [];

        if (projection) {
            statements.push(`collect(${projection.getCypher(env)}) AS data`);
        }

        if (subscriptionsEnabled) {
            statements.push(META_CYPHER_VARIABLE);
        }

        if (statements.length === 0) {
            statements.push("'Query cannot conclude with CALL'");
        }

        return `RETURN ${statements.join(", ")}`;
    });
}
