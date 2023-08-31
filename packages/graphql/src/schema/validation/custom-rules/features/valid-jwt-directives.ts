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
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { GRAPHQL_BUILTIN_SCALAR_TYPES } from "../../../../constants";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import {
    getInheritedTypeNames,
    hydrateInterfaceWithImplementedTypesMap,
} from "../utils/interface-to-implementing-types";
import type { ObjectOrInterfaceWithExtensions } from "../utils/path-parser";
import { getPathToNode } from "../utils/path-parser";
import { getInnerTypeName } from "../utils/utils";

// TODO: finish this
export function ValidJwtDirectives(context: SDLValidationContext): ASTVisitor {
    const interfaceToImplementingTypes = new Map<string, Set<string>>();
    const typeToDirectivesMap = new Map<string, Set<string>>();
    const typeToMappedClaimsField = new Map<string, Set<string>>();
    const hydrateTypeToDirectivesMap = function (traversedDef: ObjectTypeDefinitionNode | ObjectTypeExtensionNode) {
        const prev = typeToDirectivesMap.get(traversedDef.name.value) || new Set<string>();
        for (const directive of traversedDef.directives || []) {
            prev.add(directive.name.value);
        }
        typeToDirectivesMap.set(traversedDef.name.value, prev);
    };
    const hydrateTypeToMappedClaimsField = function (
        traversedDef: ObjectOrInterfaceWithExtensions,
        field: FieldDefinitionNode
    ) {
        const oldOnes = typeToMappedClaimsField.get(traversedDef.name.value) || new Set<string>();
        typeToMappedClaimsField.set(traversedDef.name.value, oldOnes.add(field.name.value));
    };
    const doOnObject = {
        enter: (node: ObjectTypeDefinitionNode | ObjectTypeExtensionNode) => {
            hydrateInterfaceWithImplementedTypesMap(node, interfaceToImplementingTypes);
            hydrateTypeToDirectivesMap(node);
            const isJwtType = typeToDirectivesMap.get(node.name.value)?.has("jwt");
            if (!isJwtType) {
                return;
            }
            const { isValid, errorMsg } = assertValid(() => assertJwtDirective(node, typeToDirectivesMap));
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [node],
                        path: [node.name.value, "@jwt"],
                        errorMsg,
                    })
                );
            }
        },
    };
    return {
        ObjectTypeDefinition: doOnObject,
        ObjectTypeExtension: doOnObject,
        FieldDefinition(node: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const [pathToNode, traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
            if (!traversedDef) {
                console.error("No last definition traversed");
                return;
            }
            if (!parentOfTraversedDef) {
                console.error("No parent of last definition traversed");
                return;
            }

            const isMappedClaim =
                node.directives?.some((directive) => directive.name.value === "jwtClaim") ||
                typeToMappedClaimsField.get(parentOfTraversedDef.name.value)?.has(node.name.value);
            if (!isMappedClaim) {
                return;
            }
            hydrateTypeToMappedClaimsField(parentOfTraversedDef, node);

            const { isValid, errorMsg } = assertValid(() =>
                assertJwtClaimDirective(parentOfTraversedDef, typeToDirectivesMap, interfaceToImplementingTypes)
            );

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [node],
                        path: [...pathToNode, "@jwtClaim"],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function assertJwtDirective(
    objectType: ObjectTypeDefinitionNode | ObjectTypeExtensionNode,
    typeToDirectivesMap: Map<string, Set<string>>
) {
    let seenJwtType = false;
    for (const directiveNames of typeToDirectivesMap.values()) {
        if (directiveNames.has("jwt")) {
            if (seenJwtType === false) {
                seenJwtType = true;
            } else {
                throw new DocumentValidationError(
                    `Invalid directive usage: Directive @jwt can only be used once in the Type Definitions.`,
                    []
                );
            }
        }
    }

    const directiveNames = typeToDirectivesMap.get(objectType.name.value);
    if (directiveNames && directiveNames.size > 1) {
        throw new DocumentValidationError(
            `Invalid directive usage: Directive @jwt cannot be used in combination with other directives.`,
            []
        );
    }
    const incompatibleFieldsStatus = objectType.fields?.some(
        (field) => !GRAPHQL_BUILTIN_SCALAR_TYPES.includes(getInnerTypeName(field.type))
    );
    if (incompatibleFieldsStatus === true) {
        throw new DocumentValidationError(
            `Invalid directive usage: Fields of a @jwt type can only be Scalars or Lists of Scalars.`,
            []
        );
    }
}

function assertJwtClaimDirective(
    fieldType: ObjectOrInterfaceWithExtensions,
    typeToDirectivesMap: Map<string, Set<string>>,
    interfaceToImplementingTypes: Map<string, Set<string>>
) {
    let isClaim = typeToDirectivesMap.get(fieldType.name.value)?.has("jwt") || false;
    if (isClaim) {
        return;
    }

    const typeNames = getInheritedTypeNames(fieldType, interfaceToImplementingTypes);

    for (const typename of typeNames) {
        isClaim = typeToDirectivesMap.get(typename)?.has("jwt") || false;
        if (isClaim === true) {
            return;
        }
    }

    if (!isClaim) {
        throw new DocumentValidationError(
            `Invalid directive usage: Directive @jwtClaim can only be used in \\"@jwt\\" types.`,
            []
        );
    }
}
