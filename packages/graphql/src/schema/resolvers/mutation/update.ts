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

import type Cypher from "@neo4j/cypher-builder";
import { debug } from "console";
import { Kind, type FieldNode, type GraphQLResolveInfo } from "graphql";
import type {
    ObjectTypeComposerArgumentConfigAsObjectDefinition,
    ObjectTypeComposerFieldConfigAsObjectDefinition,
} from "graphql-compose";
import type { ResolveTree } from "graphql-parse-resolve-info";
import type { Node } from "../../../classes";
import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { QueryASTFactory } from "../../../translate/queryAST/factory/QueryASTFactory";
import { CallbackBucket } from "../../../translate/queryAST/utils/callback-bucket";
import { buildClause } from "../../../translate/utils/build-clause";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { execute } from "../../../utils";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";

export function updateResolver({
    node,
    concreteEntityAdapter,
}: {
    node: Node;
    concreteEntityAdapter: ConcreteEntityAdapter;
}): ObjectTypeComposerFieldConfigAsObjectDefinition<any, any> {
    async function resolve(_root: any, args: any, context: Neo4jGraphQLComposedContext, info: GraphQLResolveInfo) {
        const resolveTree = getNeo4jResolveTree(info, { args });

        (context as Neo4jGraphQLTranslationContext).resolveTree = resolveTree;

        const { cypher, params } = await translateUpdate({ context: context as Neo4jGraphQLTranslationContext, node });
        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "WRITE",
            context,
            info,
        });

        const nodeProjection = info.fieldNodes[0]?.selectionSet?.selections.find(
            (selection): selection is FieldNode =>
                selection.kind === Kind.FIELD && selection.name.value === concreteEntityAdapter.plural
        );

        const resolveResult = {
            info: {
                ...executeResult.statistics,
            },
        };

        if (nodeProjection) {
            const nodeKey = nodeProjection.alias ? nodeProjection.alias.value : nodeProjection.name.value;
            // resolveResult[nodeKey] = executeResult.records[0]?.data || [];
            resolveResult[nodeKey] = executeResult.records.map((x) => x.this);
        }

        return resolveResult;
    }

    const relationFields: Record<string, string | ObjectTypeComposerArgumentConfigAsObjectDefinition> = {};

    return {
        type: `${concreteEntityAdapter.operations.mutationResponseTypeNames.update}!`,
        resolve,
        args: {
            where: concreteEntityAdapter.operations.updateMutationArgumentNames.where,
            update: concreteEntityAdapter.operations.updateMutationArgumentNames.update,
            ...relationFields,
        },
    };
}

async function translateUsingQueryAST({
    context,
    entityAdapter,
    resolveTree,
    varName,
}: {
    context: Neo4jGraphQLTranslationContext;
    entityAdapter: EntityAdapter;
    resolveTree: ResolveTree;
    varName: string;
}): Promise<Cypher.CypherResult> {
    const operationsTreeFactory = new QueryASTFactory(context.schemaModel);

    if (!entityAdapter) {
        throw new Error("Entity not found");
    }

    const callbackBucket = new CallbackBucket(context);

    const operationsTree = operationsTreeFactory.createMutationAST({
        resolveTree,
        entityAdapter,
        context,
        varName,
        callbackBucket,
    });

    debug(operationsTree.print());
    await callbackBucket.resolveCallbacks();

    const clause = operationsTree.build(context, varName);
    return buildClause(clause, { context });
}

async function translateUpdate({
    context,
    node,
}: {
    context: Neo4jGraphQLTranslationContext;
    node: Node;
}): Promise<{ cypher: string; params: Record<string, any> }> {
    const { resolveTree } = context;
    const entityAdapter = context.schemaModel.getConcreteEntityAdapter(node.name);
    if (!entityAdapter) {
        throw new Error(`Transpilation error: ${node.name} is not a concrete entity`);
    }

    const varName = "this";
    const result = await translateUsingQueryAST({ context, entityAdapter, resolveTree, varName });

    return result;
}
