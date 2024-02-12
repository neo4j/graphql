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

import { Kind, type FieldNode, type GraphQLResolveInfo } from "graphql";
import type { SchemaComposer } from "graphql-compose";
import type { Node } from "../../../classes";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { UpdateMutationArgumentNames } from "../../../schema-model/entity/model-adapters/ImplementingEntityOperations";
import { translateUpdate } from "../../../translate";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { execute } from "../../../utils";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import { publishEventsToSubscriptionMechanism } from "../../subscriptions/publish-events-to-subscription-mechanism";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";

export function updateResolver({
    node,
    composer,
    concreteEntityAdapter,
}: {
    node: Node;
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}) {
    async function resolve(
        _root: any,
        args: any,
        context: Neo4jGraphQLComposedContext,
        info: GraphQLResolveInfo
    ): Promise<{
        info: {
            bookmark: string | null;
        };
    }> {
        const resolveTree = getNeo4jResolveTree(info, { args });

        (context as Neo4jGraphQLTranslationContext).resolveTree = resolveTree;

        const [cypher, params] = await translateUpdate({ context: context as Neo4jGraphQLTranslationContext, node });
        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "WRITE",
            context,
            info,
        });

        publishEventsToSubscriptionMechanism(executeResult, context.features?.subscriptions, context.schemaModel);

        const nodeProjection = info.fieldNodes[0]?.selectionSet?.selections.find(
            (selection): selection is FieldNode =>
                selection.kind === Kind.FIELD && selection.name.value === concreteEntityAdapter.plural
        );

        // TODO: Ask why we are returning bookmark still
        const resolveResult = {
            info: {
                bookmark: executeResult.bookmark,
                ...executeResult.statistics,
            },
        };

        if (nodeProjection) {
            const nodeKey = nodeProjection.alias ? nodeProjection.alias.value : nodeProjection.name.value;
            resolveResult[nodeKey] = executeResult.records[0]?.data || [];
        }

        return resolveResult;
    }

    const relationFields: Partial<UpdateMutationArgumentNames> = {};

    if (composer.has(concreteEntityAdapter.operations.updateMutationArgumentNames.connect)) {
        relationFields.connect = concreteEntityAdapter.operations.updateMutationArgumentNames.connect;
    }
    if (composer.has(concreteEntityAdapter.operations.updateMutationArgumentNames.disconnect)) {
        relationFields.disconnect = concreteEntityAdapter.operations.updateMutationArgumentNames.disconnect;
    }
    if (composer.has(concreteEntityAdapter.operations.updateMutationArgumentNames.create)) {
        relationFields.create = concreteEntityAdapter.operations.updateMutationArgumentNames.create;
    }
    if (composer.has(concreteEntityAdapter.operations.updateMutationArgumentNames.delete)) {
        relationFields.delete = concreteEntityAdapter.operations.updateMutationArgumentNames.delete;
    }
    if (composer.has(concreteEntityAdapter.operations.updateMutationArgumentNames.connectOrCreate)) {
        relationFields.connectOrCreate = concreteEntityAdapter.operations.updateMutationArgumentNames.connectOrCreate;
    }

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
