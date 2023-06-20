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
