/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DirectiveNode } from "graphql";
import { subscriptionDirective } from "../../../graphql/directives";
import type { SubscriptionEvent } from "../../../graphql/directives/subscription";
import { SubscriptionAnnotation } from "../../annotation/SubscriptionAnnotation";
import { parseArguments } from "../parse-arguments";

export function parseSubscriptionAnnotation(directive: DirectiveNode): SubscriptionAnnotation {
    const { events } = parseArguments<{ events: SubscriptionEvent[] }>(subscriptionDirective, directive);

    return new SubscriptionAnnotation({
        events: new Set<SubscriptionEvent>(events),
    });
}
