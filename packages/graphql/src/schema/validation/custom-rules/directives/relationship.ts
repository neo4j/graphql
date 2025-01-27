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

import type { ASTVisitor, FieldDefinitionNode, ObjectTypeDefinitionNode, ObjectTypeExtensionNode } from "graphql";
import {
    declareRelationshipDirective,
    relationshipDirective,
    relationshipPropertiesDirective,
} from "../../../../graphql/directives";
import { parseValueNode } from "../../../../schema-model/parser/parse-value-node";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { getPathToNode } from "../utils/path-parser";
import { getInnerTypeName } from "../utils/utils";
import { fieldIsInInterfaceType, fieldIsInNodeType } from "./check-if-location-is-valid";

export function validateRelationshipDirective(context: Neo4jValidationContext): ASTVisitor {
    const extensionsTypeMap = context.extensionsTypeMap;
    if (!extensionsTypeMap) {
        throw new Error("No extensionsTypeMap found in the context");
    }
    return {
        // At the object level we need to check that the relationship directive is not applied to multiple fields of the same type
        ObjectTypeDefinition(objectTypeDefinitionNode: ObjectTypeDefinitionNode, _key, _parent, _path, _ancestors) {
            const fieldTypes = new Map<string, string>();
            const extensionsFields = (
                (extensionsTypeMap[objectTypeDefinitionNode.name.value]?.extensions ?? []) as ObjectTypeExtensionNode[]
            ).flatMap((extension) => extension.fields ?? []);

            [...(objectTypeDefinitionNode.fields ?? []), ...extensionsFields].forEach((field) => {
                const appliedRelationship = field.directives?.find(
                    (directive) => directive.name.value === relationshipDirective.name
                );
                if (!appliedRelationship) {
                    return;
                }
                const fieldType = getInnerTypeName(field.type);
                const relationshipDirectionArgument = appliedRelationship.arguments?.find(
                    (a) => a.name.value === "direction"
                );
                const relationshipTypeArgument = appliedRelationship.arguments?.find((a) => a.name.value === "type");
                if (!relationshipDirectionArgument || !relationshipTypeArgument) {
                    // delegate to DirectiveArgumentOfCorrectType rule
                    return;
                }
                const directionArgAsString = parseValueNode(relationshipDirectionArgument.value);
                const relationshipTypeArgumentAsString = parseValueNode(relationshipTypeArgument.value);
                // create a map key of field type + relationship type + relationship direction to check for uniqueness
                const validUniqueRelationshipKey = `${fieldType}-${relationshipTypeArgumentAsString}-${directionArgAsString}`;

                if (fieldTypes.has(validUniqueRelationshipKey)) {
                    context.reportError(
                        createGraphQLError({
                            nodes: [field],
                            path: [
                                objectTypeDefinitionNode.name.value,
                                field.name.value,
                                `@${relationshipDirective.name}`,
                            ],
                            errorMsg: `@${relationshipDirective.name} invalid. Multiple fields of the same type cannot have a relationship with the same direction and type combination.`,
                        })
                    );
                } else {
                    fieldTypes.set(validUniqueRelationshipKey, field.name.value);
                }
            });
        },
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const appliedRelationship = fieldDefinitionNode.directives?.find(
                (directive) => directive.name.value === relationshipDirective.name
            );
            if (!appliedRelationship) {
                return;
            }
            const isValidLocation = fieldIsInNodeType({ path, ancestors, extensionsTypeMap });
            const [pathToHere, _traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
            const typeArg = appliedRelationship.arguments?.find((a) => a.name.value === "type");
            const directionArg = appliedRelationship.arguments?.find((a) => a.name.value === "direction");
            const propertiesArg = appliedRelationship.arguments?.find((a) => a.name.value === "properties");
            if (!typeArg || !directionArg) {
                // delegate to DirectiveArgumentOfCorrectType rule
                return;
            }

            const { isValid, errorMsg, errorPath } = assertValid(() => {
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
                if (propertiesArg) {
                    // find the relationshipProperties type, if type does not exist, throw error
                    const propertiesArgAsString = parseValueNode(propertiesArg.value);
                    const propertiesType = extensionsTypeMap[propertiesArgAsString]?.definition;
                    if (!propertiesType) {
                        throw new DocumentValidationError(
                            `@${relationshipDirective.name}.properties invalid. Cannot find type to represent the relationship properties: ${propertiesArgAsString}.`,
                            ["properties"]
                        );
                    }
                    if (
                        !propertiesType.directives?.find(
                            (directive) => directive.name.value === relationshipPropertiesDirective.name
                        )
                    ) {
                        throw new DocumentValidationError(
                            `@${relationshipDirective.name}.properties invalid. Properties type ${propertiesArgAsString} must use directive \`@${relationshipPropertiesDirective.name}\`.`,
                            ["properties"]
                        );
                    }
                }
            });

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToHere, `@${relationshipDirective.name}`, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}
