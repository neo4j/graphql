/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import dotProp from "dot-prop";
import type { SubscriptionsAuthorizationWhere } from "../../../../../schema-model/annotation/SubscriptionsAuthorizationAnnotation";
import type { GraphQLWhereArg } from "../../../../../types";
import type { Neo4jGraphQLComposedSubscriptionsContext } from "../../../composition/wrap-subscription";

export function populateWhereParams({
    where,
    context,
}: {
    where: SubscriptionsAuthorizationWhere | GraphQLWhereArg;
    context: Neo4jGraphQLComposedSubscriptionsContext;
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
            if (v.startsWith("$jwt")) {
                const path = v.substring(5);

                const mappedPath = context.authorization.claims?.get(path);

                const value = dotProp.get(context.authorization.jwt, mappedPath || path);

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
