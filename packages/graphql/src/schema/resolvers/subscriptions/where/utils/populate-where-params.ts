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

import Cypher from "@neo4j/cypher-builder";
import dotProp from "dot-prop";
import type { SubscriptionContext } from "../../types";
import type { SubscriptionsAuthorizationWhere } from "../../../../../schema-model/annotation/SubscriptionsAuthorizationAnnotation";
import type { GraphQLWhereArg } from "../../../../../types";

export function populateWhereParams({
    where,
    context,
}: {
    where: SubscriptionsAuthorizationWhere | GraphQLWhereArg;
    context: SubscriptionContext;
}): SubscriptionsAuthorizationWhere {
    const parsed: SubscriptionsAuthorizationWhere = {};

    Object.entries(where).forEach(([k, v]) => {
        if (Array.isArray(v)) {
            parsed[k] = v.map((w) => populateWhereParams({ where: w, context }));
        } else if (v === null) {
            parsed[k] = v;
        } else if (typeof v === "object") {
            parsed[k] = populateWhereParams({ where: v, context });
        } else if (typeof v === "string") {
            // sub
            if (v.startsWith("$jwt")) {
                const path = v.substring(5);

                const value = dotProp.get(context.jwt, path);

                // const mappedPath = context.authorization.claims?.get(path);

                // const jwtProperty = context.authorization.jwtParam.property(...(mappedPath || path).split("."));

                // // coalesce jwt parameter values to be an empty string which can be evaluated in a boolean expression
                // // comparing against null will always produce null, which results in errors in apoc.util.validatePredicate
                // const coalesce = Cypher.coalesce(jwtProperty, new Cypher.Literal(""));

                parsed[k] = value;
            } else if (v.startsWith("$context")) {
                const path = v.substring(9);
                const contextValueParameter = dotProp.get(context, path);
                parsed[k] = contextValueParameter || "";
            } else {
                parsed[k] = v;
            }
        } else {
            parsed[k] = v;
        }
    });

    return parsed;
}
