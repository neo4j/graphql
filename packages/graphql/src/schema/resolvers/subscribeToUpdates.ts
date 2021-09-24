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
import { PubSub, withFilter } from "graphql-subscriptions";
import { Node } from "../../classes";
import { Context } from "../../types";

export default function subscribeToUpdatesResolver({ node }: { node: Node }) {
    async function resolve(_root: any, _args: any, _context: unknown, info: GraphQLResolveInfo) {
        console.log(_context);
        const context = _context as Context;

        const responseField = info.fieldNodes[0].selectionSet?.selections.find(
            (selection) => selection.kind === "Field" && selection.name.value === node.getPlural({ camelCase: true })
        ) as FieldNode; // Field exist by construction and must be selected as it is the only field.

        const responseKey = responseField.alias ? responseField.alias.value : responseField.name.value;

        const updated = {};

        return updated;

        // return {
            // info: {
                // bookmark: executeResult.bookmark,
                // ...executeResult.statistics,
            // },
            // [ responseKey ]: [],
            // [responseKey]: executeResult.records.map((x) => x.this),
        // };
    }

    const ps = new PubSub();
    // const iterator = ps.asyncIterator

    return {
        // type: `Update${node.getPlural({ camelCase: false })}MutationResponse!`,
        type: `${ node.name }!`,
        kind: 'subscription',
        args: {
            where: `${node.name}Where`,
        },
        description: "Subscribe to messageAdded",
        resolve,
        subscribe: () => ps.asyncIterator('test'),
        
        
        // {
        //     subscribe: withFilter(
        //         () => ps.asyncIterator("messageAdded"),
        //         (payload, variables) =>
        //             payload.channelId === variables.channelId
        //         ),
        // },
        // resolve,
        // // subscribe: (root, args, context) => context.pubsub.asyncIterator('updatePost'),
        // subscribe: (root, args, context) => {
        //     console.log(root, args, context);
        //     return ps.asyncIterator('TEST');
        // },
    };
}
