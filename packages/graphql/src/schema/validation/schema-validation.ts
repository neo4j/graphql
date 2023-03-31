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

import type { DocumentNode, DefinitionNode, GraphQLDirective, GraphQLNamedType, GraphQLError } from "graphql";
import { visit, visitInParallel, specifiedDirectives, GraphQLSchema } from "graphql";
import { getStaticAuthorizationDefinitions } from "../../graphql/directives/type-dependant-directives/authorization";
import { authorizationDefinitionsEnricher, authorizationUsageEnricher } from "./enrichers/authorization";
import { EnricherContext } from "./EnricherContext";
import type { Enricher } from "./types";
import { specifiedSDLRules } from "graphql/validation/specifiedRules";
import type { SDLValidationRule } from "graphql/validation/ValidationContext";
import { SDLValidationContext } from "graphql/validation/ValidationContext";
import type { Maybe } from "graphql/jsutils/Maybe";

function getAdditionalDefinitions(): DefinitionNode[] {
    return getStaticAuthorizationDefinitions();
}
function enrichDocument(
    enrichers: Enricher[],
    additionalDefinitions: DefinitionNode[],
    document: DocumentNode
): DocumentNode {
    return {
        ...document,
        definitions: enrichers
            .reduce(
                (definitions, enricher) => definitions.reduce(enricher, [] as DefinitionNode[]),
                document.definitions
            )
            .concat(...additionalDefinitions),
    };
}

function makeValidationDocument(userDocument: DocumentNode, augmentedDocument: DocumentNode): DocumentNode {
    const enricherContext = new EnricherContext(userDocument, augmentedDocument);
    const enrichers: Enricher[] = [];
    enrichers.push(authorizationDefinitionsEnricher(enricherContext)); // Add Authorization directive definitions, for instance UserAuthorization
    enrichers.push(authorizationUsageEnricher(enricherContext)); // Apply the previously generated directive definitions to the authorized types
    const additionalDefinitions = getAdditionalDefinitions();
    return enrichDocument(enrichers, additionalDefinitions, augmentedDocument);
}

export function validateUserDefinition(
    userDocument: DocumentNode,
    augmentedDocument: DocumentNode,
    additionalDirectives: Array<GraphQLDirective> = [],
    additionalTypes: Array<GraphQLNamedType> = [],
    rules: readonly SDLValidationRule[] = specifiedSDLRules
): void {
    const validationDocument = makeValidationDocument(userDocument, augmentedDocument);
    const schemaToExtend = new GraphQLSchema({
        directives: [...specifiedDirectives, ...additionalDirectives],
        types: [...additionalTypes],
    });

    const errors = validateSDL(validationDocument, rules, schemaToExtend);
    if (errors.length) {
        throw new Error(errors.join("\n"));
    }
}

function validateSDL(
    documentAST: DocumentNode,
    rules: ReadonlyArray<SDLValidationRule>,
    schemaToExtend?: Maybe<GraphQLSchema>
): ReadonlyArray<GraphQLError> {
    const errors: Array<GraphQLError> = [];
    const context = new SDLValidationContext(documentAST, schemaToExtend, (error) => {
        errors.push(error);
    });
    const visitors = rules.map((rule) => rule(context));
    visit(documentAST, visitInParallel(visitors));
    return errors;
}
