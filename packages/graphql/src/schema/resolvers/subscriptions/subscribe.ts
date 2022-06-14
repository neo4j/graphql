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
import ContextParser from "../../../utils/context-parser";
import { Neo4jGraphQLError } from "../../../classes";
import Node from "../../../classes/Node";
import { AuthRule, SubscriptionsEvent } from "../../../types";
import { filterAsyncIterator } from "./filter-async-iterator";
import { SubscriptionAuth } from "./subscription-auth";
import { SubscriptionContext } from "./types";
import { updateDiffFilter } from "./update-diff-filter";
import { subscriptionWhere } from "./where";

export function subscriptionResolve(payload: [SubscriptionsEvent]): SubscriptionsEvent {
    if (!payload) {
        throw new Neo4jGraphQLError("Payload is undefined. Can't call subscriptions resolver directly.");
    }
    return payload[0];
}

type SubscriptionArgs = {
    where?: Record<string, any>;
};

export function generateSubscribeMethod(node: Node, type: "create" | "update" | "delete") {
    return (_root: any, args: SubscriptionArgs, context: SubscriptionContext): AsyncIterator<[SubscriptionsEvent]> => {
        let authWhere = {};
        if (node.auth) {
            const authRules = node.auth.getRules(["SUBSCRIBE"]);
            for (const rule of authRules) {
                if (!SubscriptionAuth.validateAuthenticationRule(rule, context)) {
                    throw new Error("Error, request not authenticated");
                }
                if (!SubscriptionAuth.validateRolesRule(rule, context)) {
                    throw new Error("Error, request not authorized");
                }
            }

            authWhere = getAuthWhereParameters(authRules, context);
        }

        const iterable: AsyncIterableIterator<[SubscriptionsEvent]> = on(context.plugin.events, type);

        return filterAsyncIterator<[SubscriptionsEvent]>(iterable, (data) => {
            const isSubscribedType = data[0].typename === node.name;

            const whereParams = { ...args.where, ...authWhere };
            const matchWhereFilter = subscriptionWhere(whereParams, data[0]);
            const matchUpdateDiffFilter = updateDiffFilter(data[0]);

            return isSubscribedType && matchWhereFilter && matchUpdateDiffFilter;
        });
    };
}

function getAuthWhereParameters(authRules: AuthRule[], context: SubscriptionContext): Record<string, any> {
    return authRules.reduce((acc, rule) => {
        if (!rule.where || typeof rule.where !== "object") return acc;
        const properties = ContextParser.replaceProperties(rule.where, context, "jwt");
        return { ...properties, ...acc };
    }, {});
}
