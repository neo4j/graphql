/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Kind } from "graphql";
import { createSubscriptionsAuthorizationDefinitions } from "../../../graphql/directives/type-dependant-directives/subscriptions-authorization";
import type { EnricherContext } from "../EnricherContext";
import type { Enricher } from "../types";
import { definitionsEnricher } from "./directive/definitions";
import { directiveEnricher } from "./directive/directive";

// currentDirectiveDirective is of type ConstDirectiveNode, has to be any to support GraphQL 15
function getSubscriptionsAuthorizationDirective(currentDirectiveDirective: any, typeName: string) {
    return {
        ...currentDirectiveDirective,
        name: {
            kind: Kind.NAME,
            value: `${typeName}SubscriptionsAuthorization`,
        },
    };
}

// Enriches the directive definition itself
export function subscriptionsAuthorizationDefinitionsEnricher(enricherContext: EnricherContext): Enricher {
    return definitionsEnricher(
        enricherContext,
        "subscriptionsAuthorization",
        createSubscriptionsAuthorizationDefinitions
    );
}

// Enriches the applied directives on objects, interfaces and fields
export function subscriptionsAuthorizationDirectiveEnricher(enricherContext: EnricherContext): Enricher {
    return directiveEnricher(enricherContext, "subscriptionsAuthorization", getSubscriptionsAuthorizationDirective);
}
