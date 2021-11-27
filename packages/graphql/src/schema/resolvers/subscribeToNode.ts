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
import { isInt } from "neo4j-driver";
import { Node } from "../../classes";
import translateRead from "../../translate/translate-read";
import { MutationMetaType, MutationSubscriptionResult, SubscriptionContext, SubscriptionFilter } from "../../types";
import execute from "../../utils/execute";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";


export default function subscribeToNodeResolver({ node }: { node: Node }) {

    async function loadObjects(
        context: SubscriptionContext,
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
        resolve: (payload) => { return { ...payload }; },
        subscribe: withFilter(
            (root, args: { filter: SubscriptionFilter }, context: SubscriptionContext, info: GraphQLResolveInfo) => {
    
                context.subCache = context.subCache || {};
                context.resolveTree = getNeo4jResolveTree(info);
                context.neoSchema.authenticateContext(context);
                context.resolveTree = context.resolveTree || {};
                context.resolveTree.args = context.resolveTree.args || {};
                context.resolveTree.args.where = context.resolveTree.args.where || {};

                const fields = context.resolveTree.fieldsByTypeName;
                const rtSubResponse = fields ? fields[`${ node.name }SubscriptionResponse`] : {};
                fields[`${ node.name }SubscriptionResponse`] = rtSubResponse;
                const rtPath = rtSubResponse ? rtSubResponse[node.name.toLowerCase()] : {} as any;
                rtPath.fieldsByTypeName = rtPath.fieldsByTypeName || {};
                rtSubResponse[node.name.toLowerCase()] = rtPath;
                const rtNode = rtPath.fieldsByTypeName[node.name] || {};
                rtPath.fieldsByTypeName[node.name] = rtNode;
                rtPath.args = context.resolveTree.args;

                // eslint-disable-next-line no-underscore-dangle
                rtNode._id = {
                    alias: '_id',
                    args: {},
                    fieldsByTypeName: {},
                    name: '_id',
                };

                context.resolveTree = rtPath as any;

                let types: MutationMetaType[] = [ 'Updated', 'Created', 'Deleted', 'Connected', 'Disconnected' ];
                // We can use the provided input in our asyncIterator because
                // it is validated by the graphql enum "NodeUpdatedType"
                if (args?.filter?.type) {
                    types = [ args.filter.type ];
                } else if (args?.filter?.type_IN) {
                    types = args.filter.type_IN;
                } else if (args?.filter?.type_NOT) {
                    types = types.filter((t) => args.filter.type_NOT !== t);
                } else if (args?.filter?.type_NOT_IN) {
                    types = types.filter((t) => !args.filter.type_NOT_IN?.includes(t));
                } else if (args?.filter?.type_UNDEFINED !== undefined) {
                    // This is essentially pointless (no results would be returned)
                    // but it's here for consistency
                    types = args?.filter?.type_UNDEFINED ? [] : types;
                } else {
                    types = [ 'Updated', 'Created' ];
                }


                if (types.includes('Deleted')) {
                    // Load objects to retrieve them after they have been deleted
                    // figure out if we need to do a load of objects
                    loadObjects(context).then().catch(() => {});
                }

                const iterators = types.map((ev) => `${ node.name }.${ ev }`);
                return context.pubsub.asyncIterator(iterators);
            },
            async (payload: MutationSubscriptionResult, args: { filter: SubscriptionFilter }, context: SubscriptionContext) => {
                if (!payload || !payload.id) { return false; }
                if (!context?.resolveTree) { return false; }

                if (args?.filter) {
                    for (const filterName of [
                        'type', // This is already filtered above.
                        'id',
                        'toID',
                        'relationshipID',
                        'toName',
                        'relationshipName',
                        'handle',
                    ]) {
                        const value = payload[filterName];
                        const filter = {
                            filter: args.filter[filterName],
                            not: args.filter[`${ filterName }_NOT`],
                            in: args.filter[`${filterName }_IN`],
                            not_in: args.filter[`${filterName }_NOT_IN`],
                            undefined: args.filter[`${filterName }_UNDEFINED`],
                        };

                        if (filter.filter !== undefined && filter.filter !== value) {
                            return false;
                        }

                        if (filter.not !== undefined && filter.not === value) {
                            return false;
                        }

                        if (filter.in !== undefined && !filter.in.includes(value)) {
                            return false;
                        }

                        if (filter.not_in !== undefined && filter.in.includes(value)) {
                            return false;
                        }

                        if ((filter.undefined === true && value) || filter.undefined === false && value === undefined) {
                            return false;
                        }
                    }
                }

                if ('properties' in payload) {
                    // eslint-disable-next-line no-param-reassign
                    payload.propsUpdated = Object.keys(payload.properties);
                }

                if (args?.filter?.propsUpdated) {
                    // require at least one of the defined properties to be updated.
                    if (!payload.propsUpdated) { return false; }
                    let found = false;
                    for (const prop of args?.filter?.propsUpdated) {
                        if (payload.propsUpdated.includes(prop)) {
                            found = true;
                            break;
                        }
                    }
                    if (!found) { return false; }
                }

                if (payload.type === 'Deleted') {
                    if (!context.subCache) { return false; }

                    const cached = context.subCache[payload.id];
                    if (!cached) { return false; }

                    // eslint-disable-next-line no-param-reassign
                    payload[node.name.toLowerCase()] = cached;
                    return true;
                }

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
                const self = record?.this;

                if (self) {
                    // eslint-disable-next-line no-param-reassign
                    payload[node.name.toLowerCase()] = record.this;

                    if ([ 'Updated', 'Created' ].includes(payload.type)) {
                        context.subCache = context.subCache || {};
                        context.subCache[payload.id] = self;
                    }
                }

                return Boolean(self);
            }
        )
    };
}
