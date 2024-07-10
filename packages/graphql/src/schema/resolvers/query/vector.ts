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

import type { GraphQLFieldResolver, GraphQLResolveInfo, SelectionSetNode } from "graphql";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { translateRead } from "../../../translate";
import type { VectorContext } from "../../../types";
import { execute } from "../../../utils";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import { isNeoInt } from "../../../utils/utils";
import { createConnectionWithEdgeProperties } from "../../pagination";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";
import { emptyConnection } from "./empty-connection";

export function vectorResolver({
    vectorContext,
    entityAdapter,
}: {
    vectorContext: VectorContext;
    entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter;
}): GraphQLFieldResolver<any, any, any> {
    return async function resolve(
        _root: any,
        args: any,
        context: Neo4jGraphQLComposedContext,
        info: GraphQLResolveInfo
    ) {
        context.vector = vectorContext;

        const resolveTree = getNeo4jResolveTree(info, { args });
        resolveTree.args.options = {
            sort: resolveTree.args.sort,
            limit: resolveTree.args.limit,
            offset: resolveTree.args.offset,
        };

        const { cypher, params } = translateRead({
            context: { ...context, resolveTree },
            entityAdapter,
            varName: "this",
        });
        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
            info,
        });

        if (!executeResult.records[0]) {
            return { [entityAdapter.operations.rootTypeFieldNames.connection]: emptyConnection };
        }

        const record = executeResult.records[0].this;
        const totalCount = isNeoInt(record.totalCount) ? record.totalCount.toNumber() : record.totalCount;
        const connection = createConnectionWithEdgeProperties({
            selectionSet: resolveTree as unknown as SelectionSetNode,
            source: { edges: record.edges },
            args: { first: args.first, after: args.after },
            totalCount,
        });

        return {
            [entityAdapter.operations.rootTypeFieldNames.connection]: {
                totalCount,
                edges: connection.edges,
                pageInfo: connection.pageInfo,
            },
        };
    };
}
