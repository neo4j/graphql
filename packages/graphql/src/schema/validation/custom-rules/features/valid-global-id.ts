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

import type { ASTVisitor, DirectiveNode, ObjectTypeDefinitionNode, InterfaceTypeDefinitionNode } from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { getPathToNode } from "../utils/path-parser";

export function ValidGlobalID(context: SDLValidationContext): ASTVisitor {
    const typeNameToGlobalId = new Map<string, boolean>();
    const interfaceToImplementingTypes = new Map<string, string[]>();
    const typeNameToAliasedFields = new Map<string, Set<string>>();
    const addToAliasedFieldsMap = function (typeName: string, fieldName?: string) {
        const x = typeNameToAliasedFields.get(typeName) || new Set<string>();
        fieldName && x.add(fieldName);
        typeNameToAliasedFields.set(typeName, x);
    };
    const getAliasedFieldsFromMap = function (typeName: string) {
        return typeNameToAliasedFields.get(typeName);
    };
    return {
        Directive(directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
            const [pathToNode, traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
            if (!traversedDef) {
                console.error("No last definition traversed");
                return;
            }
            if (!parentOfTraversedDef) {
                console.error("No parent of last definition traversed");
                return;
            }

            if (directiveNode.name.value === "alias") {
                addToAliasedFieldsMap(parentOfTraversedDef.name.value, traversedDef.name.value);
            }

            if (directiveNode.name.value !== "id") {
                return;
            }
            const isGlobalID = directiveNode.arguments?.find(
                (a) => a.name.value === "global" && a.value.kind === Kind.BOOLEAN && a.value.value === true
            );
            if (!isGlobalID) {
                return;
            }

            const { isValid, errorMsg, errorPath } = assertValid(
                assertValidGlobalID.bind(null, {
                    directiveNode,
                    typeDef: parentOfTraversedDef,
                    typeNameToGlobalId,
                    interfaceToImplementingTypes,
                })
            );
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [directiveNode, traversedDef],
                        path: [...pathToNode, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },

        ObjectTypeDefinition: {
            enter(objectType: ObjectTypeDefinitionNode) {
                objectType.interfaces?.forEach((i) => {
                    const implementedTypes = interfaceToImplementingTypes.get(i.name.value) || [];
                    interfaceToImplementingTypes.set(i.name.value, implementedTypes.concat(objectType.name.value));
                });
            },
            leave(objectType: ObjectTypeDefinitionNode) {
                addToAliasedFieldsMap(objectType.name.value);

                const fieldNamedID = getUnaliasedFieldNamedID(objectType);
                if (!fieldNamedID || !hasGlobalIDField(objectType, typeNameToGlobalId, interfaceToImplementingTypes)) {
                    return;
                }

                const inheritedAliasedFields = (
                    getInheritedTypeNames(objectType, interfaceToImplementingTypes) || []
                ).map(getAliasedFieldsFromMap);

                const { isValid, errorMsg, errorPath } = assertValid(
                    assertGlobalIDDoesNotClash.bind(null, inheritedAliasedFields)
                );
                if (!isValid) {
                    context.reportError(
                        createGraphQLError({
                            nodes: [objectType, fieldNamedID],
                            path: [objectType.name.value, ...errorPath],
                            errorMsg,
                        })
                    );
                }
            },
        },

        InterfaceTypeDefinition: {
            leave(interfaceType: InterfaceTypeDefinitionNode) {
                addToAliasedFieldsMap(interfaceType.name.value);
                const fieldNamedID = getUnaliasedFieldNamedID(interfaceType);
                if (
                    !fieldNamedID ||
                    !hasGlobalIDField(interfaceType, typeNameToGlobalId, interfaceToImplementingTypes)
                ) {
                    return;
                }

                const inheritedAliasedFields = (
                    getInheritedTypeNames(interfaceType, interfaceToImplementingTypes) || []
                ).map(getAliasedFieldsFromMap);

                const { isValid, errorMsg, errorPath } = assertValid(
                    assertGlobalIDDoesNotClash.bind(null, inheritedAliasedFields)
                );
                if (!isValid) {
                    context.reportError(
                        createGraphQLError({
                            nodes: [interfaceType],
                            path: [interfaceType.name.value, ...errorPath],
                            errorMsg,
                        })
                    );
                }
            },
        },
    };
}

function getUnaliasedFieldNamedID(mainType: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode) {
    const fieldNamedID = mainType.fields?.find((x) => x.name.value === "id");
    if (!fieldNamedID) {
        return;
    }
    const isFieldAliased = !!fieldNamedID.directives?.find((x) => x.name.value === "alias");
    if (!isFieldAliased) {
        return fieldNamedID;
    }
    return;
}

function getInheritedTypeNames(
    mainType: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    interfaceToImplementingTypes: Map<string, string[]>
): string[] | undefined {
    if (mainType.kind === Kind.INTERFACE_TYPE_DEFINITION) {
        return interfaceToImplementingTypes.get(mainType.name.value);
    }
    if (mainType.kind === Kind.OBJECT_TYPE_DEFINITION) {
        return mainType.interfaces?.map((i) => i.name.value);
    }
}

function hasGlobalIDField(
    mainType: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    typeNameToGlobalId: Map<string, boolean>,
    interfaceToImplementingTypes: Map<string, string[]>
): boolean {
    if (typeNameToGlobalId.get(mainType.name.value)) {
        return true;
    }
    return !!getInheritedTypeNames(mainType, interfaceToImplementingTypes)?.find(
        (typeName) => typeNameToGlobalId.get(typeName) === true
    );
}

function assertGlobalIDDoesNotClash(aliasedFieldsFromInheritedTypes: (Set<string> | undefined)[]) {
    let shouldDeferCheck: boolean | undefined = false;
    let hasAlias: boolean | undefined = false;
    for (const aliasedFields of aliasedFieldsFromInheritedTypes) {
        if (!aliasedFields) {
            shouldDeferCheck = true;
        } else {
            if (aliasedFields.has("id")) {
                hasAlias = true;
                return;
            }
        }
    }
    if (hasAlias === false && shouldDeferCheck === false) {
        throw new DocumentValidationError(
            'Invalid global id field: Types decorated with an `@id` directive with the global argument set to `true` cannot have a field named "id". Either remove it, or if you need access to this property, consider using the "@alias" directive to access it via another field.',
            ["id"]
        );
    }
}

function assertValidGlobalID({
    directiveNode,
    typeDef,
    typeNameToGlobalId,
    interfaceToImplementingTypes,
}: {
    directiveNode: DirectiveNode;
    typeDef: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode;
    typeNameToGlobalId: Map<string, boolean>;
    interfaceToImplementingTypes: Map<string, string[]>;
}) {
    if (hasGlobalIDField(typeDef, typeNameToGlobalId, interfaceToImplementingTypes)) {
        throw new DocumentValidationError(
            "Invalid directive usage: Only one field may be decorated with an '@id' directive with the global argument set to `true`.",
            ["@id", "global"]
        );
    } else {
        typeNameToGlobalId.set(typeDef.name.value, true);
    }

    const isNotUnique = directiveNode.arguments?.find(
        (a) => a.name.value === "unique" && a.value.kind === Kind.BOOLEAN && a.value.value === false
    );
    if (isNotUnique) {
        throw new DocumentValidationError(
            `Invalid global id field: Fields decorated with the "@id" directive must be unique in the database. Please remove it, or consider making the field unique.`,
            ["@id", "unique"]
        );
    }
}
