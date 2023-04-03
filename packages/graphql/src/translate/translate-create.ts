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
import type { Context } from "../types";
import { AUTH_FORBIDDEN_ERROR, META_CYPHER_VARIABLE } from "../constants";
import { filterTruthy } from "../utils/utils";
import { CallbackBucket } from "../classes/CallbackBucket";
import Cypher from "@neo4j/cypher-builder";
import unwindCreate from "./unwind-create";
import { UnsupportedUnwindOptimization } from "./batch-create/types";
import type { ResolveTree } from "graphql-parse-resolve-info";

type ProjectionAndParamsResult = {
    projection: Cypher.Expr;
    projectionSubqueries: Cypher.Clause;
    projectionAuth?: Cypher.Clause;
};

type CompositeProjectionAndParamsResult = {
    projectionSubqueriesClause: Cypher.Clause | undefined;
    projectionList: Cypher.Expr[];
    authCalls: Cypher.Clause | undefined;
};

export default async function translateCreate({
    context,
    node,
}: {
    context: Context;
    node: Node;
}): Promise<{ cypher: string; params: Record<string, any> }> {
    try {
        return await unwindCreate({ context, node });
    } catch (error) {
        if (!(error instanceof UnsupportedUnwindOptimization)) {
            throw error;
        }
    }

    const { resolveTree } = context;
    const mutationInputs = resolveTree.args.input as any[];

    const projectionWith: string[] = [];
    const callbackBucket: CallbackBucket = new CallbackBucket(context);

    const mutationResponse = resolveTree.fieldsByTypeName[node.mutationResponseTypeNames.create] as Record<
        string,
        ResolveTree
    >;

    const nodeProjection = Object.values(mutationResponse).find((field) => field.name === node.plural);
    const metaNames: string[] = [];

    // TODO: after the createCreateAndParams refactor, remove varNameStrs and only use Cypher Variables
    const varNameStrs = mutationInputs.map((_, i) => `this${i}`);
    const varNameVariables = varNameStrs.map((varName) => new Cypher.NamedNode(varName));

    const { createStrs, params } = mutationInputs.reduce(
        (res, input, index) => {
            const varName = varNameStrs[index] as string;
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

    if (metaNames.length > 0) {
        projectionWith.push(`${metaNames.join(" + ")} AS meta`);
    }

    let parsedProjection: CompositeProjectionAndParamsResult | undefined;
    if (nodeProjection) {
        const projectionFromInput: ProjectionAndParamsResult[] = varNameVariables.map((varName) => {
            const projection = createProjectionAndParams({
                node,
                context,
                resolveTree: nodeProjection,
                varName,
                cypherFieldAliasMap: {},
            });

            const projectionExpr = new Cypher.RawCypher(
                (env) => `${varName.getCypher(env)} ${projection.projection.getCypher(env)}`
            );
            const projectionSubquery = Cypher.concat(...projection.subqueriesBeforeSort, ...projection.subqueries);

            if (projection.meta?.authValidatePredicates?.length) {
                const projAuth = Cypher.apoc.util.validate(
                    Cypher.not(Cypher.and(...projection.meta.authValidatePredicates)),
                    AUTH_FORBIDDEN_ERROR,
                    new Cypher.Literal([0])
                );
                return {
                    projection: projectionExpr,
                    projectionSubqueries: projectionSubquery,
                    projectionAuth: projAuth,
                };
            }
            return { projection: projectionExpr, projectionSubqueries: projectionSubquery };
        });

        parsedProjection = projectionFromInput.reduce(
            (acc: CompositeProjectionAndParamsResult, { projection, projectionSubqueries, projectionAuth }) => {
                return {
                    authCalls: Cypher.concat(acc.authCalls, projectionAuth),
                    projectionSubqueriesClause: Cypher.concat(acc.projectionSubqueriesClause, projectionSubqueries),
                    projectionList: acc.projectionList.concat(projection),
                };
            },
            {
                projectionSubqueriesClause: undefined,
                projectionList: [],
                authCalls: undefined,
            }
        );
    }

    const projectionList = parsedProjection?.projectionList.length
        ? new Cypher.List(parsedProjection.projectionList)
        : undefined;
    const returnStatement = generateCreateReturnStatement(projectionList, context.subscriptionsEnabled);

    const createQuery = new Cypher.RawCypher((env) => {
        const projectionSubqueriesStr = parsedProjection?.projectionSubqueriesClause?.getCypher(env);

        const cypher = filterTruthy([
            `${createStrs.join("\n")}`,
            context.subscriptionsEnabled ? `WITH ${projectionWith.join(", ")}` : "",
            parsedProjection?.authCalls?.getCypher(env),
            projectionSubqueriesStr ? `\n${projectionSubqueriesStr}` : "",
            returnStatement.getCypher(env),
        ])
            .filter(Boolean)
            .join("\n");
        return [
            cypher,
            {
                ...params,
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
function generateCreateReturnStatement(
    projectionExpr: Cypher.Expr | undefined,
    subscriptionsEnabled: boolean
): Cypher.Clause {
    const statements = new Cypher.RawCypher((env) => {
        let statStr;
        if (projectionExpr) {
            statStr = `${projectionExpr.getCypher(env)} AS data`;
        }

        if (subscriptionsEnabled) {
            statStr = statStr ? `${statStr}, ${META_CYPHER_VARIABLE}` : META_CYPHER_VARIABLE;
        }

        if (!statStr) {
            statStr = "'Query cannot conclude with CALL'";
        }
        return statStr;
    });

    return new Cypher.Return(statements);
}
