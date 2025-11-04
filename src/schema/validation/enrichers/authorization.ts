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
