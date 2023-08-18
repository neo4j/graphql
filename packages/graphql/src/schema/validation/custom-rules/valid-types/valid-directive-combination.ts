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
    ASTVisitor,
    DirectiveNode,
    ASTNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    EnumTypeDefinitionNode,
    EnumTypeExtensionNode,
    EnumValueDefinitionNode,
    FieldDefinitionNode,
    FieldNode,
    FragmentDefinitionNode,
    FragmentSpreadNode,
    InlineFragmentNode,
    InputObjectTypeDefinitionNode,
    InputObjectTypeExtensionNode,
    InputValueDefinitionNode,
    InterfaceTypeExtensionNode,
    ObjectTypeExtensionNode,
    OperationDefinitionNode,
    ScalarTypeDefinitionNode,
    ScalarTypeExtensionNode,
    SchemaDefinitionNode,
    SchemaExtensionNode,
    UnionTypeDefinitionNode,
    UnionTypeExtensionNode,
    VariableDefinitionNode,
} from "graphql";
import { Kind, isTypeDefinitionNode, isTypeExtensionNode } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { invalidCombinations } from "../../utils/invalid-directive-combinations";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import {
    getInheritedTypeNames,
    hydrateInterfaceWithImplementedTypesMap,
} from "../utils/interface-to-implementing-types";
import { getPathToNode } from "../utils/path-parser";

type ASTNodeWithDirectives =
    | OperationDefinitionNode
    | VariableDefinitionNode
    | FieldNode
    | FragmentSpreadNode
    | InlineFragmentNode
    | FragmentDefinitionNode
    | SchemaDefinitionNode
    | ScalarTypeDefinitionNode
    | ObjectTypeDefinitionNode
    | FieldDefinitionNode
    | InputValueDefinitionNode
    | InterfaceTypeDefinitionNode
    | UnionTypeDefinitionNode
    | EnumTypeDefinitionNode
    | EnumValueDefinitionNode
    | InputObjectTypeDefinitionNode
    | SchemaExtensionNode
    | ScalarTypeExtensionNode
    | ObjectTypeExtensionNode
    | InterfaceTypeExtensionNode
    | UnionTypeExtensionNode
    | EnumTypeExtensionNode
    | InputObjectTypeExtensionNode;
export function DirectiveCombinationValid(context: SDLValidationContext): ASTVisitor {
    const interfaceToImplementingTypes = new Map<string, Set<string>>();
    const typeToDirectivesPerFieldMap = new Map<string, Map<string, readonly DirectiveNode[]>>();
    const typeToDirectivesMap = new Map<string, readonly DirectiveNode[]>();
    const hydrateWithDirectives = function (
        node: ASTNodeWithDirectives,
        parentOfTraversedDef: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | undefined
    ) {
        if (node.kind === Kind.OBJECT_TYPE_DEFINITION || node.kind === Kind.INTERFACE_TYPE_DEFINITION) {
            typeToDirectivesMap.set(node.name.value, node.directives || []);
        }
        if (node.kind === Kind.FIELD_DEFINITION) {
            if (!parentOfTraversedDef) {
                return;
            }
            const seenFields =
                typeToDirectivesPerFieldMap.get(parentOfTraversedDef.name.value) ||
                new Map<string, readonly DirectiveNode[]>();
            seenFields.set(node.name.value, node.directives || []);
            typeToDirectivesPerFieldMap.set(parentOfTraversedDef.name.value, seenFields);
        }
    };
    const getDirectives = function (
        node: ASTNodeWithDirectives,
        parentOfTraversedDef: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | undefined
    ): DirectiveNode[] {
        const directivesToCheck: DirectiveNode[] = [...(node.directives || [])];
        if (node.kind === Kind.OBJECT_TYPE_DEFINITION || node.kind === Kind.INTERFACE_TYPE_DEFINITION) {
            return getInheritedTypeNames(node, interfaceToImplementingTypes).reduce((acc, i) => {
                const inheritedDirectives = typeToDirectivesMap.get(i) || [];
                return acc.concat(inheritedDirectives);
            }, directivesToCheck);
        }
        if (node.kind === Kind.FIELD_DEFINITION) {
            if (!parentOfTraversedDef) {
                return [];
            }
            return getInheritedTypeNames(parentOfTraversedDef, interfaceToImplementingTypes).reduce((acc, i) => {
                const inheritedDirectives = typeToDirectivesPerFieldMap.get(i)?.get(node.name.value) || [];
                return acc.concat(inheritedDirectives);
            }, directivesToCheck);
        }
        return directivesToCheck;
    };

    return {
        enter(node: ASTNode, _key, _parent, path, ancestors) {
            if (!("directives" in node) || !node.directives) {
                return;
            }
            const [pathToNode, traversedDef, parentOfTraversedDef] = getPathToNode(path, ancestors);
            const currentNodeErrorPath =
                isTypeDefinitionNode(node) || isTypeExtensionNode(node) ? [...pathToNode, node.name.value] : pathToNode;

            hydrateInterfaceWithImplementedTypesMap(node, interfaceToImplementingTypes);
            hydrateWithDirectives(node, parentOfTraversedDef);
            const directivesToCheck = getDirectives(node, parentOfTraversedDef);

            const { isValid, errorMsg, errorPath } = assertValid(() => assertValidDirectives(directivesToCheck));
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [traversedDef || node],
                        path: [...currentNodeErrorPath, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function assertValidDirectives(directives: DirectiveNode[]) {
    directives.forEach((directive) => {
        if (invalidCombinations[directive.name.value]) {
            directives.forEach((d) => {
                if (invalidCombinations[directive.name.value]?.includes(d.name.value)) {
                    throw new DocumentValidationError(
                        `Invalid directive usage: Directive @${directive.name.value} cannot be used in combination with @${d.name.value}`,
                        []
                    );
                }
            });
        }
    });
}

export function SchemaOrTypeDirectives(context: SDLValidationContext): ASTVisitor {
    const schemaLevelConfiguration = new Map<string, boolean>([
        ["query", false],
        ["mutation", false],
        ["subscription", false],
    ]);
    const typeLevelConfiguration = new Map<string, boolean>([
        ["query", false],
        ["mutation", false],
        ["subscription", false],
    ]);
    return {
        enter(node: ASTNode) {
            if (!("directives" in node) || !node.directives) {
                return;
            }

            const isSchemaLevel = node.kind === Kind.SCHEMA_DEFINITION || node.kind === Kind.SCHEMA_EXTENSION;
            const isTypeLevel = isTypeDefinitionNode(node) || isTypeExtensionNode(node);
            if (!isSchemaLevel && !isTypeLevel) {
                // only check combination of schema-level and type-level
                return;
            }

            const { isValid, errorMsg } = assertValid(() =>
                assertSchemaOrType({
                    directives: node.directives as DirectiveNode[],
                    schemaLevelConfiguration,
                    typeLevelConfiguration,
                    isSchemaLevel,
                    isTypeLevel,
                })
            );
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [node],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function assertSchemaOrType({
    directives,
    schemaLevelConfiguration,
    typeLevelConfiguration,
    isSchemaLevel,
    isTypeLevel,
}: {
    directives: readonly DirectiveNode[];
    schemaLevelConfiguration: Map<string, boolean>;
    typeLevelConfiguration: Map<string, boolean>;
    isSchemaLevel: boolean;
    isTypeLevel: boolean;
}) {
    directives.forEach((directive) => {
        if (schemaLevelConfiguration.has(directive.name.value)) {
            // only applicable ones: query, mutation, subscription
            if (isSchemaLevel) {
                if (typeLevelConfiguration.get(directive.name.value)) {
                    throw new DocumentValidationError(
                        `Invalid directive usage: Directive @${directive.name.value} can only be used in one location: either schema or type.`,
                        []
                    );
                }
                schemaLevelConfiguration.set(directive.name.value, true);
            }
            if (isTypeLevel) {
                if (schemaLevelConfiguration.get(directive.name.value)) {
                    throw new DocumentValidationError(
                        `Invalid directive usage: Directive @${directive.name.value} can only be used in one location: either schema or type.`,
                        []
                    );
                }
                typeLevelConfiguration.set(directive.name.value, true);
            }
        }
    });
}
