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

import type { ASTVisitor, DirectiveNode, ASTNode } from "graphql";
import { Kind, isTypeDefinitionNode, isTypeExtensionNode } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { invalidCombinations } from "../../utils/invalid-directive-combinations";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { getPathToNode } from "../utils/path-parser";

export function DirectiveCombinationValid(context: SDLValidationContext): ASTVisitor {
    return {
        enter(node: ASTNode, _key, _parent, path, ancestors) {
            if (!("directives" in node) || !node.directives) {
                return;
            }
            const [pathToNode, traversedDef] = getPathToNode(path, ancestors);
            const currentNodeErrorPath =
                isTypeDefinitionNode(node) || isTypeExtensionNode(node) ? [...pathToNode, node.name.value] : pathToNode;

            if (node.directives.length < 2) {
                // no directive combination to check
                return;
            }

            const { isValid, errorMsg, errorPath } = assertValid(() =>
                assertValidDirectives(node.directives as DirectiveNode[])
            );
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
