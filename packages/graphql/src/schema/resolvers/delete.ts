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

import { GraphQLResolveInfo } from "graphql";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";
import { execute } from "../../utils";
import { translateDelete } from "../../translate";
import { Context } from "../../types";
import { Node } from "../../classes";
import { EventMeta, RawEventMeta } from "../../subscriptions/event-meta";
import { serializeNeo4jValue } from "../../utils/neo4j-serializers";

export default function deleteResolver({ node }: { node: Node }) {
    async function resolve(_root: any, args: any, _context: unknown, info: GraphQLResolveInfo) {
        const context = _context as Context;
        context.resolveTree = getNeo4jResolveTree(info, { args });
        const [cypher, params] = translateDelete({ context, node });
        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "WRITE",
            context,
        });

        const subscriptionsPlugin = context.plugins?.subscriptions;
        if (subscriptionsPlugin) {
            const metaData: RawEventMeta[] = executeResult.records[0]?.meta || [];
            for (const meta of metaData) {
                const serializedMeta = serializeEventMeta(meta);
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                subscriptionsPlugin.publish(serializedMeta);
            }
        }

        return { bookmark: executeResult.bookmark, ...executeResult.statistics };
    }

    return {
        type: `DeleteInfo!`,
        resolve,
        args: {
            where: `${node.name}Where`,
            ...(node.relationFields.length
                ? {
                      delete: `${node.name}DeleteInput`,
                  }
                : {}),
        },
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
