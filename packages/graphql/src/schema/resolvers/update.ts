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

import { FieldNode, GraphQLResolveInfo } from "graphql";
import { SchemaComposer, upperFirst } from "graphql-compose";
import { execute } from "../../utils";
import { translateUpdate } from "../../translate";
import { Node } from "../../classes";
import { Context } from "../../types";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";

export default function updateResolver({ node, schemaComposer }: { node: Node; schemaComposer: SchemaComposer }) {
    async function resolve(_root: any, _args: any, _context: unknown, info: GraphQLResolveInfo) {
        const context = _context as Context;
        context.resolveTree = getNeo4jResolveTree(info);
        const [cypher, params] = translateUpdate({ context, node });
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

        return {
            info: {
                bookmark: executeResult.bookmark,
                ...executeResult.statistics,
            },
            ...(nodeProjection ? { [nodeKey]: executeResult.records.map((x) => x.this) } : {}),
        };
    }
    const relationFields: Record<string, string> = node.relationFields.length
        ? {
              connect: `${node.name}ConnectInput`,
              disconnect: `${node.name}DisconnectInput`,
              create: `${node.name}RelationInput`,
              delete: `${node.name}DeleteInput`,
          }
        : {};

    if (schemaComposer.has(`${node.name}ConnectOrCreateInput`)) {
        relationFields.connectOrCreate = `${node.name}ConnectOrCreateInput`;
    }
    return {
        type: `Update${upperFirst(node.plural)}MutationResponse!`,
        resolve,
        args: {
            where: `${node.name}Where`,
            update: `${node.name}UpdateInput`,
            ...relationFields,
        },
    };
}
