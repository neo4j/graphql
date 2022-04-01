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

import { Node } from "../classes";
import createProjectionAndParams from "./create-projection-and-params";
import createCreateAndParams from "./create-create-and-params";
import { Context, ConnectionField, RelationField } from "../types";
import { AUTH_FORBIDDEN_ERROR, META_CYPHER_VARIABLE } from "../constants";
import createConnectionAndParams from "./connection/create-connection-and-params";
import createInterfaceProjectionAndParams from "./create-interface-projection-and-params";
import { filterTruthy } from "../utils/utils";
import { CallbackBucket } from "../classes/CallbackBucket";

export default async function translateCreate({
    context,
    node,
}: {
    context: Context;
    node: Node;
}): Promise<[string, any]> {
    const { resolveTree } = context;
    const connectionStrs: string[] = [];
    const interfaceStrs: string[] = [];
    const projectionWith: string[] = [];
    const callbackBucket: CallbackBucket = new CallbackBucket(context);

    let connectionParams: any;
    let interfaceParams: any;

    const mutationResponse = resolveTree.fieldsByTypeName[node.mutationResponseTypeNames.create];

    const nodeProjection = Object.values(mutationResponse).find((field) => field.name === node.plural);
    const metaNames: string[] = [];

    const { createStrs, params } = (resolveTree.args.input as any[]).reduce(
        (res, input, index) => {
            const varName = `this${index}`;
            const create = [`CALL {`];

            const withVars = [varName];
            projectionWith.push(varName);
            if (context.subscriptionsEnabled) {
                create.push(`WITH [] AS ${META_CYPHER_VARIABLE}`);
                withVars.push(META_CYPHER_VARIABLE);
            }

            const createAndParams = createCreateAndParams({
                input,
                node,
                context,
                varName,
                withVars,
                includeRelationshipValidation: true,
                topLevelNodeVariable: varName,
                callbackBucket,
            });

            create.push(`${createAndParams[0]}`);
            if (context.subscriptionsEnabled) {
                const metaVariable = `${varName}_${META_CYPHER_VARIABLE}`;
                create.push(`RETURN ${varName}, ${META_CYPHER_VARIABLE} AS ${metaVariable}`);
                metaNames.push(metaVariable);
            } else {
                create.push(`RETURN ${varName}`);
            }

            create.push(`}`);

            res.createStrs.push(create.join("\n"));
            res.params = { ...res.params, ...createAndParams[1] };

            return res;
        },
        { createStrs: [], params: {}, withVars: [] }
    ) as {
        createStrs: string[];
        params: any;
    };

    let replacedProjectionParams: Record<string, unknown> = {};
    let projectionStr: string | undefined;
    let authCalls: string | undefined;

    if (metaNames.length > 0) {
        projectionWith.push(`${metaNames.join(" + ")} AS meta`);
    }

    if (nodeProjection) {
        let projAuth = "";
        const projection = createProjectionAndParams({
            node,
            context,
            resolveTree: nodeProjection,
            varName: "REPLACE_ME",
        });
        if (projection[2]?.authValidateStrs?.length) {
            projAuth = `CALL apoc.util.validate(NOT(${projection[2].authValidateStrs.join(
                " AND "
            )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
        }

        replacedProjectionParams = Object.entries(projection[1]).reduce((res, [key, value]) => {
            return { ...res, [key.replace("REPLACE_ME", "projection")]: value };
        }, {});

        projectionStr = createStrs
            .map(
                (_, i) =>
                    `\nthis${i} ${projection[0]
                        // First look to see if projection param is being reassigned
                        // e.g. in an apoc.cypher.runFirstColumn function call used in createProjection->connectionField
                        .replace(/REPLACE_ME(?=\w+: \$REPLACE_ME)/g, "projection")
                        .replace(/\$REPLACE_ME/g, "$projection")
                        .replace(/REPLACE_ME/g, `this${i}`)}`
            )
            .join(", ");

        authCalls = createStrs
            .map((_, i) => projAuth.replace(/\$REPLACE_ME/g, "$projection").replace(/REPLACE_ME/g, `this${i}`))
            .join("\n");

        const withVars = context.subscriptionsEnabled ? [META_CYPHER_VARIABLE] : [];
        if (projection[2]?.connectionFields?.length) {
            projection[2].connectionFields.forEach((connectionResolveTree) => {
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

        if (projection[2]?.interfaceFields?.length) {
            const prevRelationshipFields: string[] = [];
            projection[2].interfaceFields.forEach((interfaceResolveTree) => {
                const relationshipField = node.relationFields.find(
                    (x) => x.fieldName === interfaceResolveTree.name
                ) as RelationField;
                const interfaceProjection = createInterfaceProjectionAndParams({
                    resolveTree: interfaceResolveTree,
                    field: relationshipField,
                    context,
                    nodeVariable: "REPLACE_ME",
                    withVars: [...withVars, ...prevRelationshipFields],
                });
                prevRelationshipFields.push(relationshipField.dbPropertyName || relationshipField.fieldName);
                interfaceStrs.push(interfaceProjection.cypher);
                if (!interfaceParams) interfaceParams = {};
                interfaceParams = { ...interfaceParams, ...interfaceProjection.params };
            });
        }
    }

    const replacedConnectionStrs = connectionStrs.length
        ? createStrs.map((_, i) => {
              return connectionStrs
                  .map((connectionStr) => {
                      return connectionStr.replace(/REPLACE_ME/g, `this${i}`);
                  })
                  .join("\n");
          })
        : [];

    const replacedInterfaceStrs = interfaceStrs.length
        ? createStrs.map((_, i) => {
              return interfaceStrs
                  .map((interfaceStr) => {
                      return interfaceStr.replace(/REPLACE_ME/g, `this${i}`);
                  })
                  .join("\n");
          })
        : [];

    const replacedConnectionParams = connectionParams
        ? createStrs.reduce((res1, _, i) => {
              return {
                  ...res1,
                  ...Object.entries(connectionParams).reduce((res2, [key, value]) => {
                      return { ...res2, [key.replace("REPLACE_ME", `this${i}`)]: value };
                  }, {}),
              };
          }, {})
        : {};

    const replacedInterfaceParams = interfaceParams
        ? createStrs.reduce((res1, _, i) => {
              return {
                  ...res1,
                  ...Object.entries(interfaceParams).reduce((res2, [key, value]) => {
                      return { ...res2, [key.replace("REPLACE_ME", `this${i}`)]: value };
                  }, {}),
              };
          }, {})
        : {};

    const returnStatement = generateCreateReturnStatement(projectionStr, context.subscriptionsEnabled);
    const projectionWithStr = context.subscriptionsEnabled ? `WITH ${projectionWith.join(", ")}` : "";

    let cypher = filterTruthy([
        `${createStrs.join("\n")}`,
        projectionWithStr,
        authCalls,
        ...replacedConnectionStrs,
        ...replacedInterfaceStrs,
        returnStatement,
    ])
        .filter(Boolean)
        .join("\n");

    let resolvedCallbacks = {};

    ({ cypher, params: resolvedCallbacks } = await callbackBucket.resolveCallbacksAndFilterCypher({ cypher }));

    return [
        cypher,
        {
            ...params,
            ...replacedProjectionParams,
            ...replacedConnectionParams,
            ...replacedInterfaceParams,
            resolvedCallbacks,
        },
    ];
}

function generateCreateReturnStatement(projectionStr: string | undefined, subscriptionsEnabled: boolean): string {
    const statements: string[] = [];

    if (projectionStr) {
        statements.push(`[${projectionStr}] AS data`);
    }

    if (subscriptionsEnabled) {
        statements.push(META_CYPHER_VARIABLE);
    }

    if (statements.length === 0) {
        statements.push("'Query cannot conclude with CALL'");
    }

    return `RETURN ${statements.join(", ")}`;
}
