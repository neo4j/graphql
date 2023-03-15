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

import type { DocumentNode, DefinitionNode, GraphQLDirective, GraphQLNamedType } from "graphql";
import { specifiedDirectives, GraphQLSchema } from "graphql";
import { validateSDL } from "graphql/validation/validate";
import { getStaticAuthorizationDefinitions } from "../../graphql/directives/dynamic-directives/authorization";
import { authorizationDefinitionsEnricher, authorizationUsageEnricher } from "./enrichers/authorization";
import { EnricherContext } from "./EnricherContext";
import type { Enricher } from "./enrichers/types";

function staticEnrichment(): DefinitionNode[] {
    return getStaticAuthorizationDefinitions();
}
function enrichDocument(enrichers: Enricher[], document: DocumentNode): DocumentNode {
    return {
        ...document,
        definitions: enrichers
            .reduce(
                (definitions, enricher) => definitions.reduce(enricher, [] as DefinitionNode[]),
                document.definitions
            )
            .concat(staticEnrichment()),
    };
}

export function makeValidationDocument(userDocument: DocumentNode, augmentedDocument: DocumentNode): DocumentNode {
    const enricherContext = new EnricherContext(userDocument, augmentedDocument);
    const enrichers: Enricher[] = [];
    enrichers.push(authorizationDefinitionsEnricher(enricherContext)); // Add Authorization directive definitions, for instance UserAuthorization
    enrichers.push(authorizationUsageEnricher(enricherContext)); // Apply the previously generated directive definitions to the authorized types
    return enrichDocument(enrichers, augmentedDocument);
}

export function validateUserDefinition(
    userDocument: DocumentNode,
    augmentedDocument: DocumentNode,
    additionalDirectives: Array<GraphQLDirective> = [],
    additionalTypes: Array<GraphQLNamedType> = []
): void {
    const validationDocument = makeValidationDocument(userDocument, augmentedDocument);
    const schemaToExtend = new GraphQLSchema({
        directives: [...specifiedDirectives, ...additionalDirectives],
        types: [...additionalTypes],
    });

    const errors = validateSDL(validationDocument, schemaToExtend);
    if (errors.length) {
        throw new Error(errors.join("\n"));
    }
}
