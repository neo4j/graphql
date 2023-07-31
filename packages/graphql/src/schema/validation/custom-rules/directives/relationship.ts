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
    DirectiveNode,
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
    EnumTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { Kind } from "graphql";
import parseValueNode from "../../../../schema-model/parser/parse-value-node";
import { getInnerTypeName, getPrettyName } from "../utils/utils";
import { DocumentValidationError } from "../utils/document-validation-error";

export function verifyRelationshipArgumentValue(
    objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap: Map<
        string,
        Map<string, [string, string, string][]>
    >,
    relationshipTypeToDirectionAndFieldTypeMap: Map<string, [string, string][]>,
    interfaceToImplementationsMap: Map<string, Set<string>>,
    extra?: {
        enums: EnumTypeDefinitionNode[];
        interfaces: InterfaceTypeDefinitionNode[];
        unions: UnionTypeDefinitionNode[];
    }
) {
    return function ({
        directiveNode,
        traversedDef,
        parentDef,
    }: {
        directiveNode: DirectiveNode;
        traversedDef: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode;
        parentDef?: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
    }) {
        if (traversedDef.kind !== Kind.FIELD_DEFINITION) {
            // delegate
            return;
        }
        if (!parentDef) {
            throw new DocumentValidationError("bubu", []);
        }
        const typeArg = directiveNode.arguments?.find((a) => a.name.value === "type");
        const directionArg = directiveNode.arguments?.find((a) => a.name.value === "direction");
        const propertiesArg = directiveNode.arguments?.find((a) => a.name.value === "properties");
        if (!typeArg && !directionArg) {
            // delegate to DirectiveArgumentOfCorrectType rule
            return;
        }

        // TODO: scope to a type & its implemented interfaces
        // {fieldType: [type, direction]}
        // { typename: {fieldType, fieldName, type, direction} }
        // {Site: {HAS_POST: [posts, OUT, Post!] }}
        // {SomeSite: {HAS_POST: [[posts, OUT, Post!], [archivedPosts, OUT, Post!]] }}

        // TODO: refactor

        if (typeArg && directionArg) {
            const fieldType = getPrettyName(traversedDef.type);
            const typeValue = parseValueNode(typeArg.value);
            const directionValue = parseValueNode(directionArg.value);

            const relationshipFieldsForCurrentType =
                objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap.get(parentDef.name.value);

            const currentlyVisitedRelationship: [string, string, string] = [
                traversedDef.name.value,
                directionValue,
                fieldType,
            ];
            if (relationshipFieldsForCurrentType) {
                const visitedRelationshipsWithSameType = relationshipFieldsForCurrentType.get(typeValue);
                if (visitedRelationshipsWithSameType) {
                    visitedRelationshipsWithSameType.forEach(([fieldName, existingDirection, existingFieldType]) => {
                        if (
                            existingDirection === currentlyVisitedRelationship[1] &&
                            existingFieldType === currentlyVisitedRelationship[2]
                        ) {
                            throw new DocumentValidationError(
                                `@relationship invalid. Multiple fields of the same type cannot have a relationship with the same direction and type combination.`,
                                []
                            );
                        }
                    });
                }
                const updatedRelationships = (visitedRelationshipsWithSameType || []).concat([
                    currentlyVisitedRelationship,
                ]);
                relationshipFieldsForCurrentType.set(typeValue, updatedRelationships);
            }
            objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap.set(
                parentDef.name.value,
                relationshipFieldsForCurrentType ||
                    new Map<string, [string, string, string][]>([[typeValue, [currentlyVisitedRelationship]]])
            );

            if (parentDef.kind === Kind.INTERFACE_TYPE_DEFINITION) {
                const dependents = interfaceToImplementationsMap.get(parentDef.name.value);
                if (dependents) {
                    dependents.forEach((dependentType) => {
                        const relationshipFieldsForDependentType =
                            objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap.get(dependentType);
                        if (relationshipFieldsForDependentType) {
                            const ofSametype = relationshipFieldsForDependentType.get(typeValue);
                            if (ofSametype) {
                                ofSametype.forEach(([fieldName, existingDirection, existingFieldType]) => {
                                    if (
                                        fieldName !== currentlyVisitedRelationship[0] &&
                                        existingDirection === currentlyVisitedRelationship[1] &&
                                        existingFieldType === currentlyVisitedRelationship[2]
                                    ) {
                                        throw new DocumentValidationError(
                                            `@relationship invalid. Multiple fields of the same type cannot have a relationship with the same direction and type combination.`,
                                            []
                                        );
                                    }
                                });
                            }
                        }
                    });
                }
            }

            if (parentDef.kind === Kind.OBJECT_TYPE_DEFINITION) {
                parentDef.interfaces?.forEach((i) => {
                    const relationshipFieldsForImplementedInterface =
                        objectTypeToFieldNameDirectionAndFieldTypePerRelationshipTypeMap.get(i.name.value);
                    if (relationshipFieldsForImplementedInterface) {
                        const ofSametype = relationshipFieldsForImplementedInterface.get(typeValue);
                        if (ofSametype) {
                            ofSametype.forEach(([fieldName, existingDirection, existingFieldType]) => {
                                if (
                                    fieldName !== currentlyVisitedRelationship[0] &&
                                    existingDirection === currentlyVisitedRelationship[1] &&
                                    existingFieldType === currentlyVisitedRelationship[2]
                                ) {
                                    throw new DocumentValidationError(
                                        `@relationship invalid. Multiple fields of the same type cannot have a relationship with the same direction and type combination.`,
                                        []
                                    );
                                }
                            });
                        }
                    }

                    const exists = interfaceToImplementationsMap.get(i.name.value);
                    if (exists) {
                        interfaceToImplementationsMap.set(i.name.value, exists.add(parentDef.name.value));
                    } else {
                        const x = new Set<string>();
                        x.add(parentDef.name.value);
                        interfaceToImplementationsMap.set(i.name.value, x);
                    }
                });
            }
        }

        if (propertiesArg) {
            const propertiesValue = parseValueNode(propertiesArg.value);
            if (!extra) {
                throw new Error("Missing data: Enums, Interfaces, Unions.");
            }
            const relationshipPropertiesInterface = extra.interfaces.filter(
                (i) => i.name.value.toLowerCase() === propertiesValue.toLowerCase()
            );
            if (relationshipPropertiesInterface.length > 1) {
                throw new DocumentValidationError(
                    `@relationship.properties invalid. Cannot have more than 1 interface represent the relationship properties.`,
                    ["properties"]
                );
            }
            if (!relationshipPropertiesInterface.length) {
                throw new DocumentValidationError(
                    `@relationship.properties invalid. Cannot find interface to represent the relationship properties: ${propertiesValue}.`,
                    ["properties"]
                );
            }
            const isRelationshipPropertiesInterfaceAnnotated = relationshipPropertiesInterface[0]?.directives?.some(
                (d) => d.name.value === "relationshipProperties"
            );

            if (!isRelationshipPropertiesInterfaceAnnotated) {
                throw new DocumentValidationError(
                    `@relationship.properties invalid. Properties interface ${propertiesValue} must use directive \`@relationshipProperties\`.`,
                    ["properties"]
                );
            }
        }
    };
}

export function verifyRelationshipFieldType({
    traversedDef,
}: {
    traversedDef: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode;
}) {
    if (traversedDef.kind !== Kind.FIELD_DEFINITION) {
        // delegate
        return;
    }
    const msg = `Invalid field type: List type relationship fields must be non-nullable and have non-nullable entries, please change type to [${getInnerTypeName(
        traversedDef.type
    )}!]!`;
    if (traversedDef.type.kind === Kind.NON_NULL_TYPE) {
        if (traversedDef.type.type.kind === Kind.LIST_TYPE) {
            if (traversedDef.type.type.type.kind !== Kind.NON_NULL_TYPE) {
                throw new DocumentValidationError(msg, []);
            }
        }
    } else if (traversedDef.type.kind === Kind.LIST_TYPE) {
        throw new DocumentValidationError(msg, []);
    }
}
