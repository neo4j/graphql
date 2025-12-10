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

import type { ASTNode, ASTVisitor, FieldDefinitionNode } from "graphql";
import { cypherDirective } from "../../../../graphql/directives";
import type { Neo4jValidationContext, TypeMapWithExtensions } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { fieldIsInNodeType } from "../utils/location-helpers/is-in-node-type";
import { fieldIsInRelationshipPropertiesType } from "../utils/location-helpers/is-in-relationship-properties-type";
import { fieldIsInRootType } from "../utils/location-helpers/is-in-root-type";
import { fieldIsInSubscriptionType } from "../utils/location-helpers/is-in-subscription-type";
import { getPathToNode } from "../utils/path-parser";

export function validateCypherDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            if (
                !fieldDefinitionNode.directives?.length ||
                !fieldDefinitionNode.directives.find((directive) => directive.name.value === cypherDirective.name)
            ) {
                return;
            }

            const isValidLocation = isCypherLocationValid({ path, ancestors, typeMapWithExtensions });

            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${cypherDirective.name}" must be in a type with "@node" or on root types: Query, and Mutation`,
                        []
                    );
                }
            });
            const pathToNode = getPathToNode(path, ancestors);

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode[0], `@${cypherDirective.name}`],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function isCypherLocationValid(directiveLocationData: {
    path: readonly (string | number)[];
    ancestors: readonly (ASTNode | readonly ASTNode[])[];
    typeMapWithExtensions: TypeMapWithExtensions;
}): boolean {
    if (fieldIsInSubscriptionType(directiveLocationData)) {
        return false;
    }

    return (
        fieldIsInNodeType(directiveLocationData) ||
        fieldIsInRootType(directiveLocationData) ||
        fieldIsInRelationshipPropertiesType(directiveLocationData)
    );
}
