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
import { MutationMetaType } from "../../classes/WithProjector";
import translateRead from "../../translate/translate-read";
import { Context } from "../../types";
import execute from "../../utils/execute";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";
import { MutationEvent } from "../../utils/publish-mutate-meta";

export interface MutationSubscriptionResult extends MutationEvent {
    fieldsUpdated: string[];
    [ key: string ]: any;
}
export interface SubscriptionFilter {
    propsUpdated?: string[];

    type?: MutationMetaType;
    type_NOT?: MutationMetaType;
    type_IN?: MutationMetaType[];
    type_NOT_IN?: MutationMetaType[];
    type_UNDEFINED?: MutationMetaType[];

    id?: number;
    id_NOT?: number;
    id_IN?: number[];
    id_NOT_IN?: number[];
    id_UNDEFINED?: number[];

    toID?: number;
    toID_NOT?: number;
    toID_IN?: number[];
    toID_NOT_IN?: number[];
    toID_UNDEFINED?: number[];

    relationshipID?: number;
    relationshipID_NOT?: number;
    relationshipID_IN?: number[];
    relationshipID_NOT_IN?: number[];
    relationshipID_UNDEFINED?: number[];

    toName?: string;
    toName_NOT?: string;
    toName_IN?: string[];
    toName_NOT_IN?: string[];
    toName_UNDEFINED?: string[];

    relationshipName?: string;
    relationshipName_NOT?: string;
    relationshipName_IN?: string[];
    relationshipName_NOT_IN?: string[];
    relationshipName_UNDEFINED?: string[];

    handle?: string;
    handle_NOT?: string;
    handle_IN?: string[];
    handle_NOT_IN?: string[];
    handle_UNDEFINED?: string[];
}

export default function subscribeToNodeResolver({ node }: { node: Node }) {

    async function loadObjects(
        context,
        cache = {},
        bookmark?: string,
        id?: number,
    ) {
        // Ensure context.resolveTree.args.where is set.
        context.resolveTree.args = context.resolveTree.args || {};
        context.resolveTree.args.where = context.resolveTree.args.where || {};

        // eslint-disable-next-line @typescript-eslint/dot-notation
        context.resolveTree.args.where['_id'] = undefined;
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

        // eslint-disable-next-line no-underscore-dangle
        context.__loadedObjects = context.__loadedObjects || {};
        for (const record of executeResult.records) {
            console.log(record);
            const recordId = 'IDK';
            // eslint-disable-next-line no-underscore-dangle
            context.__loadedObjects[recordId] = record.get('this');
        }

        return executeResult;
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
            (root, args: { filter: SubscriptionFilter }, context, info: GraphQLResolveInfo) => {
    
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
                } else if (args?.filter?.type_UNDEFINED) {
                    // This is essentially pointless (no results would be returned)
                    // but it's here for consistency
                    types = [];
                } else {
                    types = [ 'Updated', 'Created' ];
                }

                if (types.includes('Deleted')) {
                    // Load objects to retrieve them after they have been deleted
                    loadObjects(context)
                    .then((res) => {

                    }).catch((err) => {
                        // todo: debug
                    });
                }

                const iterators = types.map((ev) => `${ node.name }.${ ev }`);
                return context.pubsub.asyncIterator(iterators);
            },
            async (payload: MutationSubscriptionResult, args: { filter: SubscriptionFilter }, context: Context) => {
                if (!payload || !payload.id) { return false; }
                if (!context?.resolveTree) { return false; }

                if (args?.filter) {
                    for (const filterName of [
                        // 'type', // This is already filtered above.
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

                if (record?.this) {
                    // eslint-disable-next-line no-param-reassign
                    payload[node.name.toLowerCase()] = record.this;
                }

                return Boolean(record?.this);
            }
        )
    };
}
