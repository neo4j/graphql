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

import { on } from "events";
import { GraphQLResolveInfo } from "graphql";
import Node from "../../../classes/Node";
import { SubscriptionsEvent } from "../../../subscriptions/subscriptions-event";
import { Neo4jGraphQLSubscriptionsPlugin } from "../../../types";
import { filterAsyncIterator } from "./filter-async-iterator";

export type SubscriptionContext = {
    plugin: Neo4jGraphQLSubscriptionsPlugin;
};

export function subscriptionResolve(payload, args, context, info) {
    return JSON.stringify(payload);
}

export function createSubscription(node: Node) {
    return (
        _root: any,
        _args: any,
        context: SubscriptionContext,
        _info: GraphQLResolveInfo
    ): AsyncIterator<[SubscriptionsEvent]> => {
        const iterable: AsyncIterableIterator<[SubscriptionsEvent]> = on(context.plugin.events, "create");

        return filterAsyncIterator<[SubscriptionsEvent]>(iterable, (data) => {
            // TODO: where
            return data[0].typename === node.name;
        });
    };
}
