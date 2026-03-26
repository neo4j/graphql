/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Kind } from "graphql";
import { createAuthorizationDefinitions } from "../../../graphql/directives/type-dependant-directives/authorization";
import type { EnricherContext } from "../EnricherContext";
import type { Enricher } from "../types";
import { definitionsEnricher } from "./directive/definitions";
import { directiveEnricher } from "./directive/directive";

// currentDirectiveDirective is of type ConstDirectiveNode, has to be any to support GraphQL 15
function getAuthorizationDirective(currentDirectiveDirective: any, typeName: string) {
    return {
        ...currentDirectiveDirective,
        name: {
            kind: Kind.NAME,
            value: `${typeName}Authorization`,
        },
    };
}

// Enriches the directive definition itself
export function authorizationDefinitionsEnricher(enricherContext: EnricherContext): Enricher {
    return definitionsEnricher(enricherContext, "authorization", createAuthorizationDefinitions);
}

// Enriches the applied directives on objects, interfaces and fields
export function authorizationDirectiveEnricher(enricherContext: EnricherContext): Enricher {
    return directiveEnricher(enricherContext, "authorization", getAuthorizationDirective);
}
