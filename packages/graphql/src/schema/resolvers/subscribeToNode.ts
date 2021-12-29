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

import Debug from "debug";
import { GraphQLResolveInfo } from "graphql";
import { withFilter } from "graphql-subscriptions";
import { isInt } from "neo4j-driver";
import { Node } from "../../classes";
import { DEBUG_SUBSCRIBE } from "../../constants";
import translateRead from "../../translate/translate-read";
import { Context, MutationSubscriptionResult, SubscriptionFilter } from "../../types";
import execute, { ExecuteResult } from "../../utils/execute";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";
import { resolveNodeFieldFromSubscriptionResponseAndAddInternalID, preProcessFilters, resolveSubscriptionResult, writeSubscriptionResultToCache } from "./resolveSubscriptionResult";

const debug = Debug(DEBUG_SUBSCRIBE);

export default function subscribeToNodeResolver({ node }: { node: Node }) {

    async function loadObjects(
        context: Context,
        bookmark?: string,
    ) {
        // Ensure context.resolveTree.args.where is set.
        context.resolveTree.args = context.resolveTree.args || {};
        context.resolveTree.args.where = context.resolveTree.args.where || {};

        // eslint-disable-next-line @typescript-eslint/dot-notation
        delete context.resolveTree.args.where['_id'];
        const [cypher, params] = translateRead({ context, node });

        let bookmarks: string[] | undefined;
        if (bookmark) {
            bookmarks = [ bookmark ];
        }

        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
            bookmarks,
        });

        context.subCache = context.subCache || {};
        for (const record of executeResult.records) {
            // eslint-disable-next-line no-underscore-dangle,no-continue
            if (!record?.this?._id || !isInt(record?.this?._id)) { continue; }
            // eslint-disable-next-line no-underscore-dangle
            const recordId = record?.this?._id.toNumber();
            context.subCache[recordId] = record?.this;
        }

        return context.subCache;
    }

    return {
        // type: `Update${node.getPlural({ camelCase: false })}MutationResponse!`,
        type: `${ node.name }SubscriptionResponse!`,
        kind: 'subscription',
        args: {
            filter: 'SubscriptionFilter',
            where: `${node.name}Where`,
        },
        description: `Subscribe to updates from ${ node.name }`,
        resolve: (payload) => payload,
        subscribe: withFilter(
            (root, args: { filter: SubscriptionFilter }, context: Context, info: GraphQLResolveInfo) => {
                if (!context.pubsub) {
                    throw new Error(`Pubsub not provided. Did you call neoSchema.onSubscriptionConnect(context) ` +
                    `in your onConnect method when creating the subscription server?`);
                }

                context.resolveTree = getNeo4jResolveTree(info);
                context.resolveTree = context.resolveTree || {};
                context.resolveTree.args = context.resolveTree.args || {};
                context.resolveTree.args.where = context.resolveTree.args.where || {};

                context.resolveTree = resolveNodeFieldFromSubscriptionResponseAndAddInternalID(node, context.resolveTree);

                const types = preProcessFilters(args.filter);

                if (types.includes('Deleted')) {
                    // Load objects now to retrieve them after they have been deleted
                    // figure out if we need to do a load of objects
                    loadObjects(context).then().catch(() => {});
                }

                const iterators = types.map((ev) => `${ node.name }.${ ev }`);

                return context.pubsub.asyncIterator(iterators);
            },
            async (payload: MutationSubscriptionResult, args: { filter: SubscriptionFilter }, context: Context) => {
                if (!context?.resolveTree) { return false; }
                if (!resolveSubscriptionResult(node, payload, args, context.subCache)) {
                    return false;
                }
                // Ensure context.resolveTree.args.where is set.
                context.resolveTree.args = context.resolveTree.args || {};
                context.resolveTree.args.where = context.resolveTree.args.where || {};

                // eslint-disable-next-line @typescript-eslint/dot-notation
                context.resolveTree.args.where['_id'] = payload.id;
                let cypher: string;
                let params = {};
                try {
                    [cypher, params] = translateRead({ context, node });
                } catch (err) {
                    debug(`Failed to translate read for ${ payload.name }.${ payload.type }: %s`, err);
                    throw err;
                }

                let bookmarks: string[] | undefined;
                if (payload.bookmark) {
                    bookmarks = [ payload.bookmark ];
                }

                let executeResult: ExecuteResult;
                try {
                    executeResult = await execute({
                        cypher,
                        params,
                        defaultAccessMode: "READ",
                        context,
                        bookmarks,
                    });
                } catch (err) {
                    debug(`Failed to execute read for ${ payload.name }.${ payload.type }: %s`, err);
                    throw err;
                }

                const [ record ] = executeResult.records;
                const self = record?.this;

                if (self) {
                    context.subCache = writeSubscriptionResultToCache(node, payload, self, context.subCache);
                }

                if ('properties' in payload) {
                    // eslint-disable-next-line no-param-reassign
                    payload.propsUpdated = Object.keys(payload.properties);
                }

                return Boolean(self);
            }
        )
    };
}
