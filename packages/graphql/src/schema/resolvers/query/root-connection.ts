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

import type { DirectiveNode, GraphQLResolveInfo, SelectionSetNode } from "graphql";
import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import type { PageInfo } from "graphql-relay";
import type { Node } from "../../../classes";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { translateRead } from "../../../translate";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { execute } from "../../../utils";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import { isNeoInt } from "../../../utils/utils";
import { createConnectionWithEdgeProperties } from "../../pagination";
import { graphqlDirectivesToCompose } from "../../to-compose";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";

export function rootConnectionResolver({
    node,
    composer,
    concreteEntityAdapter,
    propagatedDirectives,
}: {
    node: Node;
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
    propagatedDirectives: DirectiveNode[];
}) {
    async function resolve(_root: any, args: any, context: Neo4jGraphQLComposedContext, info: GraphQLResolveInfo) {
        const resolveTree = getNeo4jResolveTree(info, { args });

        const edgeTree = resolveTree.fieldsByTypeName[`${concreteEntityAdapter.upperFirstPlural}Connection`]?.edges;
        const nodeTree = edgeTree?.fieldsByTypeName[`${concreteEntityAdapter.name}Edge`]?.node;
        const resolveTreeForContext = nodeTree || resolveTree;

        (context as Neo4jGraphQLTranslationContext).resolveTree = {
            ...resolveTreeForContext,
            args: resolveTree.args,
        };

        const { cypher, params } = translateRead({
            context: context as Neo4jGraphQLTranslationContext,
            node,
            isRootConnectionField: true,
        });

        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
        });

        let totalCount = 0;
        let edges: any[] = [];
        let pageInfo: PageInfo = {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
        };

        if (executeResult.records[0]) {
            const record = executeResult.records[0].this;

            totalCount = isNeoInt(record.totalCount) ? record.totalCount.toNumber() : record.totalCount;

            const connection = createConnectionWithEdgeProperties({
                selectionSet: resolveTree as unknown as SelectionSetNode,
                source: { edges: record.edges },
                args: { first: args.first, after: args.after },
                totalCount,
            });

            // TODO: Question why are these not taking into account the potential aliases?
            edges = connection.edges as any[];
            pageInfo = connection.pageInfo as PageInfo;
        }

        return {
            totalCount,
            edges,
            pageInfo,
        };
    }

    const rootEdge = composer.createObjectTC({
        name: `${concreteEntityAdapter.name}Edge`,
        fields: {
            cursor: "String!",
            node: `${concreteEntityAdapter.name}!`,
        },
        directives: graphqlDirectivesToCompose(propagatedDirectives),
    });

    const rootConnection = composer.createObjectTC({
        name: `${concreteEntityAdapter.upperFirstPlural}Connection`,
        fields: {
            totalCount: "Int!",
            pageInfo: "PageInfo!",
            edges: rootEdge.NonNull.List.NonNull,
        },
        directives: graphqlDirectivesToCompose(propagatedDirectives),
    });

    // since sort is not created when there is nothing to sort, we check for its existence
    let sortArg: InputTypeComposer<any> | undefined;
    if (composer.has(`${concreteEntityAdapter.name}Sort`)) {
        sortArg = composer.getITC(`${concreteEntityAdapter.name}Sort`);
    }

    return {
        type: rootConnection.NonNull,
        resolve,
        args: {
            first: "Int",
            after: "String",
            where: `${concreteEntityAdapter.name}Where`,
            ...(sortArg ? { sort: sortArg.List } : {}),
            ...(concreteEntityAdapter.annotations.fulltext
                ? {
                      fulltext: {
                          type: `${concreteEntityAdapter.name}Fulltext`,
                          description:
                              "Query a full-text index. Allows for the aggregation of results, but does not return the query score. Use the root full-text query fields if you require the score.",
                      },
                  }
                : {}),
        },
    };
}
