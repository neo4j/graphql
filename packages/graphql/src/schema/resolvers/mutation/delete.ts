/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLResolveInfo } from "graphql";
import type { SchemaComposer } from "graphql-compose";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { translateDelete } from "../../../translate/translate-delete";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { execute } from "../../../utils";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";

export function deleteResolver({
    composer,
    concreteEntityAdapter,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}) {
    async function resolve(_root: any, args: any, context: Neo4jGraphQLComposedContext, info: GraphQLResolveInfo) {
        const resolveTree = getNeo4jResolveTree(info, { args });

        (context as Neo4jGraphQLTranslationContext).resolveTree = resolveTree;

        const { cypher, params } = translateDelete({
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

        return executeResult.statistics;
    }

    const hasDeleteInput = composer.has(concreteEntityAdapter.operations.deleteInputTypeName);

    return {
        type: `DeleteInfo!`,
        resolve,
        args: {
            where: concreteEntityAdapter.operations.whereInputTypeName,
            ...(hasDeleteInput
                ? {
                      delete: concreteEntityAdapter.operations.deleteInputTypeName,
                  }
                : {}),
        },
    };
}
