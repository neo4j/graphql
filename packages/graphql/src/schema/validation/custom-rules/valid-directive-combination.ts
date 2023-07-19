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
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
    InterfaceTypeDefinitionNode,
} from "graphql";
import { Kind, GraphQLError, isTypeDefinitionNode, isTypeExtensionNode } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { isValidCombination, schemaOrTypeNotBoth } from "../utils/directive-combinations";

export function DirectiveCombinationValid() {
    return function (context: SDLValidationContext): ASTVisitor {
        return {
            enter(node: ASTNode, _key, _parent, path, ancestors) {
                if (!("directives" in node) || !node.directives) {
                    return;
                }
                const [temp, traversedDef] = getPathToDirectiveNode(path, ancestors);
                const currentNodeErrorPath =
                    isTypeDefinitionNode(node) || isTypeExtensionNode(node) ? [...temp, node.name.value] : temp;

                const { isValid, errorMsg, errorPath } = assertValidDirectives(node.directives);
                if (!isValid) {
                    const errorOpts = {
                        nodes: [traversedDef || node],
                        // extensions: {
                        //     exception: { code: VALIDATION_ERROR_CODES[genericDirectiveName.toUpperCase()] },
                        // },
                        path: errorPath || currentNodeErrorPath,
                        source: undefined,
                        positions: undefined,
                        originalError: undefined,
                    };

                    // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                    context.reportError(
                        new GraphQLError(
                            errorMsg || "Error",
                            errorOpts.nodes,
                            errorOpts.source,
                            errorOpts.positions,
                            errorOpts.path,
                            errorOpts.originalError
                            // errorOpts.extensions
                        )
                    );
                }
            },
        };
    };
}

export function SchemaOrTypeDirectives() {
    return function (context: SDLValidationContext): ASTVisitor {
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

                const { isValid, errorMsg } = assertSchemaOrType(
                    node.directives,
                    schemaLevelConfiguration,
                    typeLevelConfiguration,
                    isSchemaLevel,
                    isTypeLevel
                );
                if (!isValid) {
                    const errorOpts = {
                        nodes: [node],
                        // extensions: {
                        //     exception: { code: VALIDATION_ERROR_CODES[genericDirectiveName.toUpperCase()] },
                        // },
                        path: undefined,
                        source: undefined,
                        positions: undefined,
                        originalError: undefined,
                    };

                    // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                    context.reportError(
                        new GraphQLError(
                            errorMsg || "Error",
                            errorOpts.nodes,
                            errorOpts.source,
                            errorOpts.positions,
                            errorOpts.path,
                            errorOpts.originalError
                            // errorOpts.extensions
                        )
                    );
                }
            },
        };
    };
}

function getPathToDirectiveNode(
    path: readonly (number | string)[],
    ancenstors: readonly (ASTNode | readonly ASTNode[])[]
): [
    Array<string>,
    ObjectTypeDefinitionNode | FieldDefinitionNode | InterfaceTypeDefinitionNode | undefined,
    ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | undefined
] {
    const documentASTNodes = ancenstors[1];
    if (!documentASTNodes || (Array.isArray(documentASTNodes) && !documentASTNodes.length)) {
        return [[], undefined, undefined];
    }
    const [, definitionIdx] = path;
    const traversedDefinition = documentASTNodes[definitionIdx as number];
    const pathToHere: (ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode)[] = [
        traversedDefinition,
    ];
    let lastSeenDefinition: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode =
        traversedDefinition;
    const getNextDefinition = parsePath(path, traversedDefinition);
    for (const definition of getNextDefinition()) {
        lastSeenDefinition = definition;
        pathToHere.push(definition);
    }
    const parentOfLastSeenDefinition = pathToHere.slice(-2)[0] as
        | ObjectTypeDefinitionNode
        | InterfaceTypeDefinitionNode;
    return [pathToHere.map((n) => n.name?.value || "Schema"), lastSeenDefinition, parentOfLastSeenDefinition];
}

function parsePath(
    path: readonly (number | string)[],
    traversedDefinition: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode | FieldDefinitionNode
) {
    return function* getNextDefinition(idx = 2) {
        while (path[idx] && path[idx] !== "directives") {
            // continue parsing for annotated fields
            const key = path[idx] as string;
            const idxAtKey = path[idx + 1] as number;
            traversedDefinition = traversedDefinition[key][idxAtKey];
            yield traversedDefinition;
            idx += 2;
        }
    };
}

type AssertionResponse = {
    isValid: boolean;
    errorMsg?: string;
    errorPath: ReadonlyArray<string | number>;
};

function assertValidDirectives(directives: readonly DirectiveNode[]): AssertionResponse {
    let isValid = true;
    let errorMsg, errorPath;

    const onError = (error: Error) => {
        isValid = false;
        errorMsg = error.message;
    };

    try {
        isValidCombination(directives);
    } catch (err) {
        onError(err as Error);
    }

    return { isValid, errorMsg, errorPath };
}
function assertSchemaOrType(
    directives: readonly DirectiveNode[],
    schemaLevelConfiguration: Map<string, boolean>,
    typeLevelConfiguration: Map<string, boolean>,
    isSchemaLevel: boolean,
    isTypeLevel: boolean
): AssertionResponse {
    let isValid = true;
    let errorMsg, errorPath;

    const onError = (error: Error) => {
        isValid = false;
        errorMsg = error.message;
    };

    try {
        directives.forEach((directive) => {
            if (schemaLevelConfiguration.has(directive.name.value)) {
                // only applicable ones: query, mutation, subscription
                if (isSchemaLevel) {
                    if (typeLevelConfiguration.get(directive.name.value)) {
                        throw new Error(
                            `Invalid directive usage: Directive @${directive.name.value} can only be used in one location: either schema or type.`
                        );
                    }
                    schemaLevelConfiguration.set(directive.name.value, true);
                }
                if (isTypeLevel) {
                    if (schemaLevelConfiguration.get(directive.name.value)) {
                        throw new Error(
                            `Invalid directive usage: Directive @${directive.name.value} can only be used in one location: either schema or type.`
                        );
                    }
                    typeLevelConfiguration.set(directive.name.value, true);
                }
            }
        });
    } catch (err) {
        onError(err as Error);
    }

    return { isValid, errorMsg, errorPath };
}
