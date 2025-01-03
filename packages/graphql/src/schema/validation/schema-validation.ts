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
    GraphQLInputObjectType,
    GraphQLNamedType,
    ObjectTypeDefinitionNode,
} from "graphql";
import { GraphQLSchema, specifiedDirectives, visit } from "graphql";
import { specifiedSDLRules } from "graphql/validation/specifiedRules";
import { createAuthenticationDirectiveDefinition } from "../../graphql/directives/type-dependant-directives/authentication";
import { getStaticAuthorizationDefinitions } from "../../graphql/directives/type-dependant-directives/get-static-auth-definitions";
import {
    BigIntListFilters,
    BigIntScalarFilters,
} from "../../graphql/input-objects/generic-operators/BigIntScalarFilters";
import {
    BooleanListFilters,
    BooleanScalarFilters,
} from "../../graphql/input-objects/generic-operators/BooleanScalarFilters";
import {
    CartesianPointFilters,
    CartesianPointListFilters,
} from "../../graphql/input-objects/generic-operators/CartesianPointFilters";
import { DateListFilters, DateScalarFilters } from "../../graphql/input-objects/generic-operators/DateScalarFilters";
import { DateTimeScalarFilters } from "../../graphql/input-objects/generic-operators/DateTimeScalarFilters";
import { DurationScalarFilters } from "../../graphql/input-objects/generic-operators/DurationScalarFilters";
import { FloatListFilters, FloatScalarFilters } from "../../graphql/input-objects/generic-operators/FloatScalarFilters";
import { getIDScalarFilters, IDListFilters } from "../../graphql/input-objects/generic-operators/IDScalarFilters";
import { IntListFilters, IntScalarFilters } from "../../graphql/input-objects/generic-operators/IntScalarFilters";
import { LocalTimeScalarFilters } from "../../graphql/input-objects/generic-operators/LocalTimeScalarFilters";
import { PointFilters, PointListFilters } from "../../graphql/input-objects/generic-operators/PointFilters";
import {
    getStringScalarFilters,
    StringListFilters,
} from "../../graphql/input-objects/generic-operators/StringScalarFilters";
import { TimeScalarFilters } from "../../graphql/input-objects/generic-operators/TimeScalarFilters";
import type { Neo4jFeaturesSettings } from "../../types";
import { EnricherContext } from "./EnricherContext";
import { makeReplaceWildcardVisitor } from "./custom-rules/replace-wildcard-value";
import { ValidateAuthorizationLikeDirectives } from "./custom-rules/validate-authorization-like-directives";
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
    jwt,
    features,
}: {
    userDocument: DocumentNode;
    augmentedDocument: DocumentNode;
    additionalDirectives?: Array<GraphQLDirective>;
    additionalTypes?: Array<GraphQLNamedType>;
    jwt?: ObjectTypeDefinitionNode;
    features?: Neo4jFeaturesSettings;
}): void {
    const rules = [...specifiedSDLRules, ValidateAuthorizationLikeDirectives];
    let validationDocument = makeValidationDocument(userDocument, augmentedDocument, jwt);
    const genericFiltersName: GraphQLInputObjectType[] = [
        BooleanScalarFilters,
        BooleanListFilters,
        getIDScalarFilters(features),
        IDListFilters,
        getStringScalarFilters(features),
        StringListFilters,
        FloatScalarFilters,
        FloatListFilters,
        IntScalarFilters,
        IntListFilters,
        BigIntScalarFilters,
        BigIntListFilters,
        TimeScalarFilters,
        DateTimeScalarFilters,
        DateScalarFilters,
        DateListFilters,
        DurationScalarFilters,
        LocalTimeScalarFilters,
        PointFilters,
        PointListFilters,
        CartesianPointFilters,
        CartesianPointListFilters,
    ];
    const schemaToExtend = new GraphQLSchema({
        directives: [...specifiedDirectives, ...additionalDirectives],
        types: [...genericFiltersName, ...additionalTypes],
    });

    const replaceWildcardValue = makeReplaceWildcardVisitor({ jwt, schema: schemaToExtend });

    validationDocument = removeDuplicateTypes(validationDocument, schemaToExtend.getTypeMap());
    validationDocument = visit(validationDocument, replaceWildcardValue());

    const errors = validateSDL(validationDocument, rules, schemaToExtend);
    if (errors.length) {
        throw errors;
    }
}

function removeDuplicateTypes(doc: DocumentNode, extraTypes: Record<string, GraphQLNamedType>): DocumentNode {
    return {
        ...doc,
        // Remove duplicate types generated by genericFiltersName
        definitions: doc.definitions.filter((def) => {
            if (def["name"] !== undefined) {
                if (extraTypes[(def as any).name.value]) {
                    return false;
                }
            }
            return true;
        }),
    };
}
