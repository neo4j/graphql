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

import type { SubscriptionsAuthorizationWhere } from "../../../../../schema-model/annotation/SubscriptionsAuthorizationAnnotation";
import type { ConcreteEntityAdapter } from "../../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { filterByValues } from "../../../../../translate/authorization/utils/filter-by-values";
import type { SubscriptionsEvent } from "../../../../../types";
import type { Neo4jGraphQLComposedSubscriptionsContext } from "../../../composition/wrap-subscription";
import type { RecordType, RelationshipType } from "../../types";
import { multipleConditionsAggregationMap } from "../utils/multiple-conditions-aggregation-map";
import { filterByProperties } from "./filter-by-properties";

export function filterByAuthorizationRules({
    entityAdapter,
    where,
    event,
    context,
}: {
    entityAdapter: ConcreteEntityAdapter;
    where:
        | SubscriptionsAuthorizationWhere
        | Record<
              string,
              RecordType | Record<string, RecordType | RelationshipType> | Array<Record<string, RecordType>>
          >;
    event: SubscriptionsEvent;
    context: Neo4jGraphQLComposedSubscriptionsContext;
}): boolean {
    const results = Object.entries(where).map(([wherePropertyKey, wherePropertyValue]) => {
        if (Object.keys(multipleConditionsAggregationMap).includes(wherePropertyKey)) {
            const comparisonResultsAggregationFn = multipleConditionsAggregationMap[wherePropertyKey];
            let comparisonResults;
            if (wherePropertyKey === "NOT") {
                comparisonResults = filterByAuthorizationRules({
                    entityAdapter,
                    where: wherePropertyValue as Record<string, RecordType>,
                    event,
                    context,
                });
            } else {
                comparisonResults = (wherePropertyValue as Array<Record<string, RecordType>>).map((whereCl) => {
                    return filterByAuthorizationRules({
                        entityAdapter,
                        where: whereCl,
                        event,
                        context,
                    });
                });
            }

            if (!comparisonResultsAggregationFn(comparisonResults)) {
                return false;
            }
        }

        if (wherePropertyKey === "node") {
            switch (event.event) {
                case "create":
                    return filterByProperties({
                        attributes: entityAdapter.attributes,
                        whereProperties: wherePropertyValue,
                        receivedProperties: event.properties.new,
                    });
                case "update":
                case "delete":
                    return filterByProperties({
                        attributes: entityAdapter.attributes,
                        whereProperties: wherePropertyValue,
                        receivedProperties: event.properties.old,
                    });
            }
        }

        if (wherePropertyKey === "jwt") {
            const { jwt, claims } = context.authorization;
            if (!jwt) {
                throw new Error("JWT Token must be present.");
            }
            return filterByValues(wherePropertyValue, jwt, claims);
        }

        return true;
    });

    return multipleConditionsAggregationMap.AND(results);
}
