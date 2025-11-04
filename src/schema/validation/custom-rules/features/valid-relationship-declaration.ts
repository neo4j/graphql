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
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    ObjectTypeExtensionNode,
} from "graphql";
import { visit, Kind } from "graphql";
import type { ASTValidationContext, SDLValidationContext } from "graphql/validation/ValidationContext";
import type { ObjectOrInterfaceDefinitionNode } from "../../enrichers/directive/utils";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import {
    getInheritedTypeNames,
    hydrateInterfaceWithImplementedTypesMap,
} from "../utils/interface-to-implementing-types";
import type { ObjectOrInterfaceWithExtensions } from "../utils/path-parser";
import { getPathToNode } from "../utils/path-parser";

export function ValidRelationshipDeclaration(context: SDLValidationContext): ASTVisitor {
    const typeNameToRelationshipFields = new Map<string, Set<string>>();
    const addToRelationshipFieldsMap = (typeName: string, relationshipFieldName: string) => {
        const prevRelationshipFields = typeNameToRelationshipFields.get(typeName) || new Set<string>();
        typeNameToRelationshipFields.set(typeName, prevRelationshipFields.add(relationshipFieldName));
    };
    const interfaceToImplementationsMap = new Map<string, Set<string>>();

    const gatherRelationshipsAndDeclarations = makeDeclareRelationshipDirectiveVisitorFn(
        addToRelationshipFieldsMap,
        context
    );
    const validateInterfaceOrObject = {
        leave(node: InterfaceTypeDefinitionNode | ObjectTypeDefinitionNode, _key, _parent, path, ancestors) {
            // parse extensions as well
            visitExtensionsOf({
                node,
                context,
                interfaceToImplementationsMap,
                onDirectiveVisitor: gatherRelationshipsAndDeclarations,
            });

            if (node.kind === Kind.OBJECT_TYPE_DEFINITION) {
                hydrateInterfaceWithImplementedTypesMap(node, interfaceToImplementationsMap);
            }

            if (node.kind === Kind.INTERFACE_TYPE_DEFINITION) {
                // skip validation if no relationship declaration
                // on this definition or any of its extensions
                if (!typeNameToRelationshipFields.has(node.name.value)) {
                    return;
                }
            }

            // validate declarations are satisfied, only if declarations exist
            const { isValid, errorMsg, errorPath } = assertValid(() =>
                assertRelationshipDeclaration({
                    parentDef: node,
                    interfaceToImplementationsMap,
                    typeNameToRelationshipFields,
                })
            );
            const [pathToNode] = getPathToNode(path, ancestors);
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [node],
                        path: [...pathToNode, node.name.value, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };

    return {
        Directive: gatherRelationshipsAndDeclarations,
        InterfaceTypeDefinition: validateInterfaceOrObject,
        ObjectTypeDefinition: validateInterfaceOrObject,
    };
}

function makeDeclareRelationshipDirectiveVisitorFn(
    addToRelationshipFieldsMap: (typeName: string, relationshipFieldName: string) => void,
    context: SDLValidationContext
) {
    return function (directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
        const [pathToNode, traversedDef, parentDef] = getPathToNode(path, ancestors);
        if (!parentDef) {
            console.error("No parent definition traversed");
            return;
        }
        if (!traversedDef) {
            console.error("No last definition traversed");
            return;
        }
        const isDirectiveOnInterfaceField = (
            [Kind.INTERFACE_TYPE_DEFINITION, Kind.INTERFACE_TYPE_EXTENSION] as string[]
        ).includes(parentDef.kind);

        // TODO: 2nd part of the if-check can be deleted once relationship directive is officially not supported on interfaces
        if (directiveNode.name.value === "relationship" && !isDirectiveOnInterfaceField) {
            addToRelationshipFieldsMap(parentDef.name.value, traversedDef.name.value);
            return;
        }
        if (directiveNode.name.value === "declareRelationship") {
            if (!isDirectiveOnInterfaceField) {
                context.reportError(
                    createGraphQLError({
                        nodes: [parentDef],
                        path: [...pathToNode],
                        errorMsg: `\`@declareRelationship\` is only available on Interface fields. Use \`@relationship\` if in an Object type.`,
                    })
                );
            }
            addToRelationshipFieldsMap(parentDef.name.value, traversedDef.name.value);
            return;
        }
    };
}

function visitExtensionsOf({
    node,
    context,
    interfaceToImplementationsMap,
    onDirectiveVisitor,
}: {
    node: ObjectOrInterfaceDefinitionNode;
    context: ASTValidationContext;
    interfaceToImplementationsMap: Map<string, Set<string>>;
    onDirectiveVisitor: (directiveNode: DirectiveNode, ...args: unknown[]) => unknown;
}) {
    const ExtensionDefinitionsVisitor: ASTVisitor = {
        // hydrate for extensions that only define interface implementations
        ObjectTypeDefinition(node: ObjectTypeDefinitionNode) {
            hydrateInterfaceWithImplementedTypesMap(node, interfaceToImplementationsMap);
        },
        ObjectTypeExtension(node: ObjectTypeExtensionNode) {
            hydrateInterfaceWithImplementedTypesMap(node, interfaceToImplementationsMap);
        },
        // check any new relationship declaration/definition on extensions
        Directive: onDirectiveVisitor,
    };

    const extensions = context
        .getDocument()
        .definitions.filter(
            (definition) =>
                (definition.kind === Kind.INTERFACE_TYPE_EXTENSION || definition.kind === Kind.OBJECT_TYPE_EXTENSION) &&
                definition.name.value === node.name.value
        );
    extensions.forEach((ext) => visit(ext, ExtensionDefinitionsVisitor));
}

function assertRelationshipDeclaration(args: {
    parentDef: ObjectOrInterfaceWithExtensions;
    interfaceToImplementationsMap: Map<string, Set<string>>;
    typeNameToRelationshipFields: Map<string, Set<string>>;
}) {
    for (const { declaredRelationshipFields, actualRelationshipFields } of getRelationships(args)) {
        // all declared relationships must be real relationships
        // not all "actual" relationships have to be declared
        declaredRelationshipFields?.forEach((f) => {
            if (!actualRelationshipFields?.has(f)) {
                throw new DocumentValidationError(
                    `Field was declared as a relationship but the \`@relationship\` directive is missing from the implementation.`,
                    [f]
                );
            }
        });
    }
}
function getRelationships({
    parentDef,
    typeNameToRelationshipFields,
    interfaceToImplementationsMap,
}: {
    parentDef: ObjectOrInterfaceWithExtensions;
    interfaceToImplementationsMap: Map<string, Set<string>>;
    typeNameToRelationshipFields: Map<string, Set<string>>;
}): {
    declaredRelationshipFields: Set<string> | undefined;
    actualRelationshipFields: Set<string> | undefined;
}[] {
    const inheritedTypeNames = getInheritedTypeNames(parentDef, interfaceToImplementationsMap);
    const isDirectiveOnInterfaceField = (
        [Kind.INTERFACE_TYPE_DEFINITION, Kind.INTERFACE_TYPE_EXTENSION] as string[]
    ).includes(parentDef.kind);
    return inheritedTypeNames.map((typeName) => {
        if (isDirectiveOnInterfaceField) {
            return {
                declaredRelationshipFields: typeNameToRelationshipFields.get(parentDef.name.value),
                actualRelationshipFields: typeNameToRelationshipFields.get(typeName),
            };
        }
        return {
            declaredRelationshipFields: typeNameToRelationshipFields.get(typeName),
            actualRelationshipFields: typeNameToRelationshipFields.get(parentDef.name.value),
        };
    });
}
