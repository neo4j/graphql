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

import type { SubscriptionsAuthorizationFilterEvent } from "../../../../schema-model/annotation/SubscriptionsAuthorizationAnnotation";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { SubscriptionsEvent } from "../../../../types";
import type { Neo4jGraphQLComposedSubscriptionsContext } from "../../composition/wrap-subscription";
import type { SubscriptionEventType } from "../types";
import { filterByAuthorizationRules } from "./filters/filter-by-authorization-rules";
import { multipleConditionsAggregationMap } from "./utils/multiple-conditions-aggregation-map";
import { populateWhereParams } from "./utils/populate-where-params";

export function subscriptionAuthorization({
    event,
    entity,
    context,
}: {
    event: SubscriptionsEvent;
    entity: ConcreteEntityAdapter;
    context: Neo4jGraphQLComposedSubscriptionsContext;
}): boolean {
    const subscriptionsAuthorization = entity.annotations.subscriptionsAuthorization;

    const matchedRules = (subscriptionsAuthorization?.filter || []).filter((rule) =>
        rule.events.some((e) => authorizationEventMatchesEvent(e, event.event))
    );

    if (!matchedRules.length) {
        return true;
    }

    const results = matchedRules.map((rule) => {
        if (rule.requireAuthentication && !context.authorization.jwt) {
            return false;
        }

        const where = populateWhereParams({ where: rule.where, context });

        return filterByAuthorizationRules({
            entityAdapter: entity,
            where,
            event,
            context,
        });
    });

    return multipleConditionsAggregationMap.OR(results);
}

function authorizationEventMatchesEvent(
    authorizationEvent: SubscriptionsAuthorizationFilterEvent,
    event: SubscriptionEventType
): boolean {
    switch (authorizationEvent) {
        case "CREATED":
            return event === "create";
        case "UPDATED":
            return event === "update";
        case "DELETED":
            return event === "delete";
    }
}
