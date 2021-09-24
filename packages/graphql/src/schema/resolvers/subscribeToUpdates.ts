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

import { withFilter } from "graphql-subscriptions";
import { Node } from "../../classes";
import translateRead from "../../translate/translate-read";
import { Context } from "../../types";
import execute from "../../utils/execute";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";

export default function subscribeToUpdatesResolver({ node }: { node: Node }) {
    return {
        // type: `Update${node.getPlural({ camelCase: false })}MutationResponse!`,
        type: `${ node.name }!`,
        kind: 'subscription',
        args: {
            where: `${node.name}Where`,
        },
        description: `Subscribe to updates from ${ node.name }`,
        resolve: (payload) => payload,
        subscribe: withFilter(
            (root, args, context, info) => context.pubsub.asyncIterator(`node.${ node.name }.updated`),
            async (payload, args, context: Context, info) => {
                if (!payload || !payload.id) { return false; }

                context.resolveTree = getNeo4jResolveTree(info);
                context.neoSchema.authenticateContext(context);
                context.resolveTree.args = context.resolveTree.args || {};
                context.resolveTree.args.where = context.resolveTree.args.where || {};
                // eslint-disable-next-line @typescript-eslint/dot-notation
                context.resolveTree.args.where['__id'] = payload.id;

                const [cypher, params] = translateRead({ context, node });
    
                const executeResult = await execute({
                    cypher,
                    params,
                    defaultAccessMode: "READ",
                    context,
                });

    
                const [ record ] = executeResult.records;
                if (record?.this) {
                    Object.assign(payload, record.this);
                }

                return Boolean(record?.this);
            }
        )
    };
}
