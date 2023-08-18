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

import type { SubscriptionsEvent } from "../../../../types";
import type Node from "../../../../classes/Node";
import type { ObjectFields } from "../../../get-obj-field-meta";
import { filterByAuthorizationRules } from "./filters/filter-by-authorization-rules";
import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import { multipleConditionsAggregationMap } from "./utils/multiple-conditions-aggregation-map";
import { populateWhereParams } from "./utils/populate-where-params";
import type { Neo4jGraphQLComposedSubscriptionsContext } from "../../composition/wrap-subscription";

export function subscriptionAuthorization({
    event,
    node,
    entity,
    nodes,
    relationshipFields,
    context,
}: {
    event: SubscriptionsEvent;
    node: Node;
    entity: ConcreteEntity;
    nodes?: Node[];
    relationshipFields?: Map<string, ObjectFields>;
    context: Neo4jGraphQLComposedSubscriptionsContext;
}): boolean {
    const subscriptionsAuthorization = entity.annotations.subscriptionsAuthorization;

    const matchedRules = (subscriptionsAuthorization?.filter || []).filter((rule) =>
        rule.events.some((e) => e.toLowerCase() === event.event)
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
            node,
            where,
            event,
            nodes,
            relationshipFields,
            context,
        });
    });

    return multipleConditionsAggregationMap.OR(results);
}
