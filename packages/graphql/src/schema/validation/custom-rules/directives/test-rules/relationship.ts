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

import type { ASTVisitor, FieldDefinitionNode } from "graphql";
import { declareRelationshipDirective, relationshipDirective } from "../../../../../graphql/directives";
import type { Neo4jValidationContext } from "../../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../../utils/document-validation-error";
import { getPathToNode } from "../../utils/path-parser";
import { fieldIsInInterfaceType, fieldIsInNodeType } from "./check-if-location-is-valid";

export function validateRelationshipDirective(context: Neo4jValidationContext): ASTVisitor {
    const extensionsTypeMap = context.extensionsTypeMap;
    if (!extensionsTypeMap) {
        throw new Error("No extensionsTypeMap found in the context");
    }
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            if (
                !fieldDefinitionNode.directives?.length ||
                !fieldDefinitionNode.directives.find((directive) => directive.name.value === relationshipDirective.name)
            ) {
                return;
            }
            const isValidLocation = fieldIsInNodeType({ path, ancestors, extensionsTypeMap });
            const [pathToHere, _traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    if (fieldIsInInterfaceType({ path, ancestors, extensionsTypeMap })) {
                        // throw more specific error for interface types as in the past it was possible to have relationships on interfaces
                        throw new DocumentValidationError(
                            `Invalid directive usage: Directive @${relationshipDirective.name} is not supported on fields of interface types (${parentOfTraversedDef?.name.value}). Since version 5.0.0, interface fields can only have @${declareRelationshipDirective.name}. Please add the @relationship directive to the fields in all types which implement it.`,
                            []
                        );
                    }
                    throw new DocumentValidationError(
                        `Directive "${relationshipDirective.name}" requires to be used within the "@node" directive`,
                        []
                    );
                }
            });

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToHere, `@${relationshipDirective.name}`],
                        errorMsg,
                    })
                );
            }
        },
    };
}
