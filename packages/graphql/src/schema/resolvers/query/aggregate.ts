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
import type { Node } from "../../../classes";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { translateAggregate } from "../../../translate";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { execute } from "../../../utils";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";

export function aggregateResolver({ node }: { node: Node }) {
    async function resolve(_root: any, _args: any, context: Neo4jGraphQLComposedContext, info: GraphQLResolveInfo) {
        const resolveTree = getNeo4jResolveTree(info);

        (context as Neo4jGraphQLTranslationContext).resolveTree = resolveTree;

        const [aggregateCypher, aggregateParams] = translateAggregate({
            context: context as Neo4jGraphQLTranslationContext,
            node,
        });

        const { cypher, params: builtParams } = aggregateCypher.build();
        const params = { ...aggregateParams, ...builtParams };

        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
            info,
        });

        return Object.values(executeResult.records[0] || {})[0];
    }

    return {
        type: `${node.aggregateTypeNames.selection}!`,
        resolve,
        args: {
            where: `${node.name}Where`,
            ...(node.fulltextDirective
                ? {
                      fulltext: {
                          type: `${node.name}Fulltext`,
                          description:
                              "Query a full-text index. Allows for the aggregation of results, but does not return the query score. Use the root full-text query fields if you require the score.",
                      },
                  }
                : {}),
        },
    };
}

export function aggregateResolver2({
    node,
    concreteEntityAdapter,
}: {
    node: Node;
    concreteEntityAdapter: ConcreteEntityAdapter;
}) {
    async function resolve(_root: any, _args: any, context: Neo4jGraphQLComposedContext, info: GraphQLResolveInfo) {
        const resolveTree = getNeo4jResolveTree(info);

        (context as Neo4jGraphQLTranslationContext).resolveTree = resolveTree;

        const [aggregateCypher, aggregateParams] = translateAggregate({
            context: context as Neo4jGraphQLTranslationContext,
            node,
        });

        const { cypher, params: builtParams } = aggregateCypher.build();
        const params = { ...aggregateParams, ...builtParams };

        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
            info,
        });

        return Object.values(executeResult.records[0] || {})[0];
    }

    return {
        type: `${concreteEntityAdapter.operations.aggregateTypeNames.selection}!`,
        resolve,
        args: {
            where: concreteEntityAdapter.operations.whereInputTypeName,
            ...(concreteEntityAdapter.annotations.fulltext
                ? {
                      fulltext: {
                          type: concreteEntityAdapter.operations.fullTextInputTypeName,
                          description:
                              "Query a full-text index. Allows for the aggregation of results, but does not return the query score. Use the root full-text query fields if you require the score.",
                      },
                  }
                : {}),
        },
    };
}
