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

import type {
    DefinitionNode,
    DocumentNode,
    GraphQLDirective,
    GraphQLNamedType,
    ObjectTypeDefinitionNode,
} from "graphql";
import { GraphQLSchema, specifiedDirectives, visit } from "graphql";
import type { SDLValidationRule } from "graphql/validation/ValidationContext";
import { specifiedSDLRules } from "graphql/validation/specifiedRules";
import { createAuthenticationDirectiveDefinition } from "../../graphql/directives/type-dependant-directives/authentication";
import { getStaticAuthorizationDefinitions } from "../../graphql/directives/type-dependant-directives/get-static-auth-definitions";
import { EnricherContext } from "./EnricherContext";
import { DirectiveArgumentOfCorrectType } from "./custom-rules/directive-argument-of-correct-type";
import { makeReplaceWildcardVisitor } from "./custom-rules/replace-wildcard-value";
import { authenticationDirectiveEnricher } from "./enrichers/authentication";
import { authorizationDefinitionsEnricher, authorizationDirectiveEnricher } from "./enrichers/authorization";
import {
    subscriptionsAuthorizationDefinitionsEnricher,
    subscriptionsAuthorizationDirectiveEnricher,
} from "./enrichers/subscriptions-authorization";
import type { Enricher } from "./types";
import { validateSDL } from "./validate-sdl";

function getAdditionalDefinitions(userDocument: DocumentNode, jwt?: ObjectTypeDefinitionNode): DefinitionNode[] {
    return [...getStaticAuthorizationDefinitions(userDocument, jwt), createAuthenticationDirectiveDefinition()];
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

function makeValidationDocument(
    userDocument: DocumentNode,
    augmentedDocument: DocumentNode,
    jwt?: ObjectTypeDefinitionNode
): DocumentNode {
    const enricherContext = new EnricherContext(userDocument, augmentedDocument);
    const enrichers: Enricher[] = [];
    enrichers.push(authorizationDefinitionsEnricher(enricherContext)); // Add Authorization directive definitions, for instance UserAuthorization
    enrichers.push(authorizationDirectiveEnricher(enricherContext)); // Apply the previously generated directive definitions to the authorized types
    enrichers.push(subscriptionsAuthorizationDefinitionsEnricher(enricherContext)); // Add SubscriptionsAuthorization directive definitions, for instance UserSubscriptionsAuthorization
    enrichers.push(subscriptionsAuthorizationDirectiveEnricher(enricherContext)); // Apply the previously generated directive definitions to the authorized types
    enrichers.push(authenticationDirectiveEnricher(enricherContext)); // Apply the previously generated directive definitions to the authenticated types
    const additionalDefinitions = getAdditionalDefinitions(userDocument, jwt);
    return enrichDocument(enrichers, additionalDefinitions, augmentedDocument);
}

export function validateUserDefinition({
    userDocument,
    augmentedDocument,
    additionalDirectives = [],
    additionalTypes = [],
    rules,
    jwt,
}: {
    userDocument: DocumentNode;
    augmentedDocument: DocumentNode;
    additionalDirectives?: Array<GraphQLDirective>;
    additionalTypes?: Array<GraphQLNamedType>;
    rules?: readonly SDLValidationRule[];
    jwt?: ObjectTypeDefinitionNode;
}): void {
    rules = rules ? rules : [...specifiedSDLRules, DirectiveArgumentOfCorrectType()];
    let validationDocument = makeValidationDocument(userDocument, augmentedDocument, jwt);

    const schemaToExtend = new GraphQLSchema({
        directives: [...specifiedDirectives, ...additionalDirectives],
        types: [...additionalTypes],
    });

    const replaceWildcardValue = makeReplaceWildcardVisitor({ jwt, schema: schemaToExtend });
    validationDocument = visit(validationDocument, replaceWildcardValue());

    const errors = validateSDL(validationDocument, rules, schemaToExtend);
    if (errors.length) {
        throw errors;
    }
}
