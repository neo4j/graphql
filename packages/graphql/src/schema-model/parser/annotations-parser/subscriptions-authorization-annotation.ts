/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { parseArgumentsFromUnknownDirective } from "../parse-arguments";

import type { SubscriptionsAuthorizationFilterRuleConstructor } from "../../annotation/SubscriptionsAuthorizationAnnotation";
import {
    SubscriptionsAuthorizationAnnotation,
    SubscriptionsAuthorizationFilterRule,
} from "../../annotation/SubscriptionsAuthorizationAnnotation";

export function parseSubscriptionsAuthorizationAnnotation(
    directive: DirectiveNode
): SubscriptionsAuthorizationAnnotation {
    const { filter } = parseArgumentsFromUnknownDirective(directive) as {
        filter?: Record<string, any>[];
    };

    const filterRules = filter?.map(
        (rule) => new SubscriptionsAuthorizationFilterRule(rule as SubscriptionsAuthorizationFilterRuleConstructor)
    );

    return new SubscriptionsAuthorizationAnnotation({
        filter: filterRules,
    });
}
