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
import { withFilter } from "graphql-subscriptions";
import { Node } from "../../classes";
import translateRead from "../../translate/translate-read";
import { Context } from "../../types";
import execute from "../../utils/execute";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";
import { isUpdatedMutationEvent, MutationEvent } from "../../utils/publish-mutate-meta";

export default function subscribeToNodeResolver({ node }: { node: Node }) {
    return {
        // type: `Update${node.getPlural({ camelCase: false })}MutationResponse!`,
        type: `${ node.name }SubscriptionResponse!`,
        kind: 'subscription',
        args: {
            where: `${node.name}Where`,
            types: `[NodeUpdatedType!]`,
        },
        description: `Subscribe to updates from ${ node.name }`,
        resolve: (payload) => { return { ...payload }; },
        subscribe: withFilter(
            (root, args, context, info: GraphQLResolveInfo) => {
    
                context.resolveTree = getNeo4jResolveTree(info);
                context.neoSchema.authenticateContext(context);
                context.resolveTree.args = context.resolveTree.args || {};
                context.resolveTree.args.where = context.resolveTree.args.where || {};

                // Rewrite resolve tree to read tile
                context.resolveTree.fieldsByTypeName = {
                    ...context.resolveTree.fieldsByTypeName
                        [`${ node.name }SubscriptionResponse`]
                        [node.name.toLowerCase()]
                        .fieldsByTypeName,
                };

                const types: string[] = args.types || [ 'Updated', 'Created' ];
                const iterators = types.map((ev) => `${ node.name }.${ ev }`);
                return context.pubsub.asyncIterator(iterators);
            },
            async (payload: MutationEvent, args, context: Context) => {
                if (!payload || !payload.id) { return false; }

                if (args?.types && !args.types.includes(payload.type)) {
                    return false;
                }
                if (!context?.resolveTree) { return false; }
                
                // Ensure context.resolveTree.args.where is set.
                context.resolveTree.args = context.resolveTree.args || {};
                context.resolveTree.args.where = context.resolveTree.args.where || {};

                // eslint-disable-next-line @typescript-eslint/dot-notation
                context.resolveTree.args.where['_id'] = payload.id;
                const [cypher, params] = translateRead({ context, node });

                let bookmarks: string[] | undefined;
                if (payload.bookmark) {
                    bookmarks = [ payload.bookmark ];
                }
    
                const executeResult = await execute({
                    cypher,
                    params,
                    defaultAccessMode: "READ",
                    context,
                    bookmarks,
                });

                const [ record ] = executeResult.records;

                if (isUpdatedMutationEvent(payload)) {
                    // eslint-disable-next-line no-param-reassign
                    (payload as any).fieldsUpdated = Object.keys(payload.properties);
                }

                if (record?.this) {
                    // eslint-disable-next-line no-param-reassign
                    payload[node.name.toLowerCase()] = record.this;
                }

                return Boolean(record?.this);
            }
        )
    };
}
