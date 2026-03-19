/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Kind, type FieldNode, type GraphQLResolveInfo } from "graphql";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { translateCreate } from "../../../translate/translate-create";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { execute } from "../../../utils";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";

export function createResolver({ concreteEntityAdapter }: { concreteEntityAdapter: ConcreteEntityAdapter }) {
    async function resolve(_root: any, args: any, context: Neo4jGraphQLComposedContext, info: GraphQLResolveInfo) {
        const resolveTree = getNeo4jResolveTree(info, { args });

        (context as Neo4jGraphQLTranslationContext).resolveTree = resolveTree;

        const { cypher, params } = await translateCreate({
            context: context as Neo4jGraphQLTranslationContext,
            entityAdapter: concreteEntityAdapter,
        });

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
            const nodeKey = nodeProjection?.alias ? nodeProjection.alias.value : nodeProjection?.name?.value;
            resolveResult[nodeKey] = executeResult.records[0]?.data || [];
        }

        return resolveResult;
    }

    return {
        type: `${concreteEntityAdapter.operations.mutationResponseTypeNames.create}!`,
        resolve,
        args: concreteEntityAdapter.operations.createMutationArgumentNames,
    };
}
