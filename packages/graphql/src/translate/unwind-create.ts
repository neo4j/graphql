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
import type { Context } from "../types";
import type { GraphQLCreateInput } from "./batch-create/types";
import { UnsupportedUnwindOptimization } from "./batch-create/types";
import { mergeTreeDescriptors, getTreeDescriptor, parseCreate } from "./batch-create/parser";
import { UnwindCreateVisitor } from "./batch-create/unwind-create-visitors/UnwindCreateVisitor";
import createProjectionAndParams from "./create-projection-and-params";
import { META_CYPHER_VARIABLE } from "../constants";
import { filterTruthy } from "../utils/utils";
import { CallbackBucket } from "../classes/CallbackBucket";
import Cypher from "@neo4j/cypher-builder";
import { compileCypher, compileCypherIfExists } from "../utils/compile-cypher";

export default async function unwindCreate({
    context,
    node,
}: {
    context: Context;
    node: Node;
}): Promise<{ cypher: string; params: Record<string, any> }> {
    if (context.subscriptionsEnabled) {
        throw new UnsupportedUnwindOptimization("Unwind create optimisation does not yet support subscriptions");
    }
    const { resolveTree } = context;
    const input = resolveTree.args.input as GraphQLCreateInput | GraphQLCreateInput[];
    const treeDescriptor = Array.isArray(input)
        ? mergeTreeDescriptors(input.map((el: GraphQLCreateInput) => getTreeDescriptor(el, node, context)))
        : getTreeDescriptor(input, node, context);
    const createNodeAST = parseCreate(treeDescriptor, node, context);
    const callbackBucket = new CallbackBucket(context);
    const unwindVar = new Cypher.Variable();
    const unwind = new Cypher.Param(input);
    const unwindQuery = new Cypher.Unwind([unwind, unwindVar]);
    const unwindCreateVisitor = new UnwindCreateVisitor(unwindVar, callbackBucket, context);
    createNodeAST.accept(unwindCreateVisitor);
    const [rootNodeVariable, createCypher] = unwindCreateVisitor.build() as [Cypher.Node, Cypher.Clause];

    const projectionWith: string[] = [];
    const mutationResponse = resolveTree.fieldsByTypeName[node.mutationResponseTypeNames.create] || {};
    const nodeProjection = Object.values(mutationResponse).find((field) => field.name === node.plural);
    const metaNames: string[] = [];
    let projectionCypher: Cypher.Expr | undefined;

    if (metaNames.length > 0) {
        projectionWith.push(`${metaNames.join(" + ")} AS meta`);
    }

    let projectionSubquery: Cypher.Clause | undefined;
    if (nodeProjection) {
        const projection = createProjectionAndParams({
            node,
            context,
            resolveTree: nodeProjection,
            varName: rootNodeVariable,
            cypherFieldAliasMap: {},
        });
        projectionSubquery = Cypher.concat(...projection.subqueries);
        projectionCypher = new Cypher.RawCypher((env: Cypher.Environment) => {
            return `${compileCypher(rootNodeVariable, env)} ${compileCypher(projection.projection, env)}`;
        });
    }

    const unwindCreate = Cypher.concat(unwindQuery, createCypher);
    const returnStatement = generateCreateReturnStatementCypher(projectionCypher, context.subscriptionsEnabled);
    const projectionWithStr = context.subscriptionsEnabled ? `WITH ${projectionWith.join(", ")}` : "";

    const createQuery = new Cypher.RawCypher((env) => {
        const projectionSubqueryStr = compileCypherIfExists(projectionSubquery, env);

        const cypher = filterTruthy([
            compileCypher(unwindCreate, env),
            projectionWithStr,
            projectionSubqueryStr,
            compileCypher(returnStatement, env),
        ])
            .filter(Boolean)
            .join("\n");

        return cypher;
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
    projection: Cypher.Expr | undefined,
    subscriptionsEnabled: boolean
): Cypher.Expr {
    return new Cypher.RawCypher((env: Cypher.Environment) => {
        const statements: string[] = [];

        if (projection) {
            statements.push(`collect(${compileCypher(projection, env)}) AS data`);
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
