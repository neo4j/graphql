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

import type { FieldNode, GraphQLResolveInfo } from "graphql";
import { execute } from "../../../utils";
import { translateCreate } from "../../../translate";
import type { Node } from "../../../classes";
import type { Context } from "../../../types";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import { publishEventsToPlugin } from "../../subscriptions/publish-events-to-plugin";

export function createResolver({ node }: { node: Node }) {
    async function resolve(_root: any, args: any, _context: unknown, info: GraphQLResolveInfo) {
        const context = _context as Context;
        context.resolveTree = getNeo4jResolveTree(info, { args });
        const { cypher, params } = await translateCreate({ context, node });

        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "WRITE",
            context,
        });

        const nodeProjection = info.fieldNodes[0].selectionSet?.selections.find(
            (selection) => selection.kind === "Field" && selection.name.value === node.plural
        ) as FieldNode;
        const nodeKey = nodeProjection?.alias ? nodeProjection.alias.value : nodeProjection?.name?.value;

        publishEventsToPlugin(executeResult, context.plugins?.subscriptions, context.schemaModel);

        return {
            info: {
                bookmark: executeResult.bookmark,
                ...executeResult.statistics,
            },
            ...(nodeProjection ? { [nodeKey]: executeResult.records[0]?.data || [] } : {}),
        };
    }

    return {
        type: `${node.mutationResponseTypeNames.create}!`,
        resolve,
        args: { input: `[${node.name}CreateInput!]!` },
    };
}
