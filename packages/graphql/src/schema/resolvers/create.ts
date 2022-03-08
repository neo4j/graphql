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
import { execute } from "../../utils";
import { translateCreate } from "../../translate";
import { Node } from "../../classes";
import { Context } from "../../types";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";
import { EventMeta, RawEventMeta } from "../../subscriptions/event-meta";
import { serializeNeo4jValue } from "../../utils/neo4j-serializers";

export default function createResolver({ node }: { node: Node }) {
    async function resolve(_root: any, args: any, _context: unknown, info: GraphQLResolveInfo) {
        const context = _context as Context;
        context.resolveTree = getNeo4jResolveTree(info, { args });
        const [cypher, params] = translateCreate({ context, node });

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

        const subscriptionsPlugin = context.plugins?.subscriptions;
        if (subscriptionsPlugin) {
            const metaData: RawEventMeta[] = executeResult.records[0]?.meta || [];
            for (const meta of metaData) {
                const serializedMeta = serializeEventMeta(meta);
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                subscriptionsPlugin.publish(serializedMeta);
            }
        }

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

function serializeProperties(properties: Record<string, any> | undefined): Record<string, any> | undefined {
    if (!properties) {
        return undefined;
    }

    return Object.entries(properties).reduce((serializedProps, [k, v]) => {
        serializedProps[k] = serializeNeo4jValue(v);
        return serializedProps;
    }, {} as Record<string, any>);
}

function serializeEventMeta(event: RawEventMeta): EventMeta {
    return {
        id: serializeNeo4jValue(event.id),
        timestamp: serializeNeo4jValue(event.timestamp),
        event: event.event,
        properties: {
            old: serializeProperties(event.properties.old),
            new: serializeProperties(event.properties.new),
        },
    } as EventMeta;
}
