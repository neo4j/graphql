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
    EnumTypeDefinitionNode,
    FieldDefinitionNode,
    InterfaceTypeDefinitionNode,
    InterfaceTypeExtensionNode,
    ObjectTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { Kind } from "graphql";
import { parseValueNode } from "../../../../schema-model/parser/parse-value-node";
import { DocumentValidationError } from "../utils/document-validation-error";
import {
    getInheritedTypeNames,
    hydrateInterfaceWithImplementedTypesMap,
} from "../utils/interface-to-implementing-types";
import type { ObjectOrInterfaceWithExtensions } from "../utils/path-parser";
import { getInnerTypeName, getPrettyName } from "../utils/utils";

export function verifyRelationshipArgumentValue(
    objectTypeToRelationshipsPerRelationshipTypeMap: Map<string, Map<string, [string, string, string][]>>,
    interfaceToImplementationsMap: Map<string, Set<string>>,
    extra?: {
        enums: EnumTypeDefinitionNode[];
        interfaces: (InterfaceTypeDefinitionNode | InterfaceTypeExtensionNode)[];
        unions: UnionTypeDefinitionNode[];
        objects: ObjectTypeDefinitionNode[];
    }
) {
    return function ({
        directiveNode,
        traversedDef,
        parentDef,
    }: {
        directiveNode: DirectiveNode;
        traversedDef: ObjectOrInterfaceWithExtensions | FieldDefinitionNode;
        parentDef?: ObjectOrInterfaceWithExtensions;
    }) {
        if (traversedDef.kind !== Kind.FIELD_DEFINITION) {
            // delegate
            return;
        }
        if (!parentDef) {
            console.error("No parent definition");
            return;
        }
        const typeArg = directiveNode.arguments?.find((a) => a.name.value === "type");
        const directionArg = directiveNode.arguments?.find((a) => a.name.value === "direction");
        const propertiesArg = directiveNode.arguments?.find((a) => a.name.value === "properties");
        if (!typeArg && !directionArg) {
            // delegate to DirectiveArgumentOfCorrectType rule
            return;
        }

        if (typeArg && directionArg) {
            const fieldType = getPrettyName(traversedDef.type);
            const typeValue = parseValueNode(typeArg.value);
            const directionValue = parseValueNode(directionArg.value);
            const currentRelationship: [string, string, string] = [traversedDef.name.value, directionValue, fieldType];
            verifyRelationshipFields(
                parentDef,
                currentRelationship,
                typeValue,
                objectTypeToRelationshipsPerRelationshipTypeMap,
                interfaceToImplementationsMap
            );
        }

        if (propertiesArg) {
            const propertiesValue = parseValueNode(propertiesArg.value);
            if (!extra) {
                throw new Error("Missing data: Enums, Interfaces, Unions.");
            }
            const relationshipPropertiesInterface = extra.objects.filter(
                (i) =>
                    i.name.value.toLowerCase() === propertiesValue.toLowerCase() &&
                    i.kind === Kind.OBJECT_TYPE_DEFINITION
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

function getUpdatedRelationshipFieldsForCurrentType(
    relationshipFieldsForCurrentType: Map<string, [string, string, string][]> | undefined,
    currentRelationship: [string, string, string],
    typeValue: any
) {
    const updatedRelationshipFieldsForCurrentType =
        relationshipFieldsForCurrentType || new Map<string, [string, string, string][]>();
    const updatedRelationshipsWithSameRelationshipType = (
        relationshipFieldsForCurrentType?.get(typeValue) || []
    ).concat([currentRelationship]);
    updatedRelationshipFieldsForCurrentType.set(typeValue, updatedRelationshipsWithSameRelationshipType);
    return updatedRelationshipFieldsForCurrentType;
}

function checkRelationshipFieldsForDuplicates(
    relationshipFieldsForDependentType: Map<string, [string, string, string][]> | undefined,
    currentRelationship: [string, string, string],
    typeValue: any
) {
    if (!relationshipFieldsForDependentType) {
        return;
    }
    const relationshipsWithSameRelationshipType = relationshipFieldsForDependentType.get(typeValue);
    relationshipsWithSameRelationshipType?.forEach(([fieldName, existingDirection, existingFieldType]) => {
        if (
            fieldName !== currentRelationship[0] &&
            existingDirection === currentRelationship[1] &&
            existingFieldType === currentRelationship[2]
        ) {
            throw new DocumentValidationError(
                `@relationship invalid. Multiple fields of the same type cannot have a relationship with the same direction and type combination.`,
                []
            );
        }
    });
}

function verifyRelationshipFields(
    parentDef: ObjectOrInterfaceWithExtensions,
    currentRelationship: [string, string, string],
    typeValue: any,
    objectTypeToRelationshipsPerRelationshipTypeMap: Map<string, Map<string, [string, string, string][]>>,
    interfaceToImplementationsMap: Map<string, Set<string>>
) {
    const relationshipFieldsForCurrentType = objectTypeToRelationshipsPerRelationshipTypeMap.get(parentDef.name.value);
    checkRelationshipFieldsForDuplicates(relationshipFieldsForCurrentType, currentRelationship, typeValue);
    objectTypeToRelationshipsPerRelationshipTypeMap.set(
        parentDef.name.value,
        getUpdatedRelationshipFieldsForCurrentType(relationshipFieldsForCurrentType, currentRelationship, typeValue)
    );

    const inheritedTypeNames = getInheritedTypeNames(parentDef, interfaceToImplementationsMap);
    inheritedTypeNames.forEach((typeName) => {
        const inheritedRelationshipFields = objectTypeToRelationshipsPerRelationshipTypeMap.get(typeName);
        checkRelationshipFieldsForDuplicates(inheritedRelationshipFields, currentRelationship, typeValue);
    });

    hydrateInterfaceWithImplementedTypesMap(parentDef, interfaceToImplementationsMap);
}

export function verifyRelationshipFieldType({
    traversedDef,
}: {
    traversedDef: ObjectOrInterfaceWithExtensions | FieldDefinitionNode;
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
