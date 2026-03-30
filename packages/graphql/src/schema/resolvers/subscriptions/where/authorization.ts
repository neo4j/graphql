/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
