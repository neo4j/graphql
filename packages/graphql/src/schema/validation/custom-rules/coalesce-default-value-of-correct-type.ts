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

import {
    Kind,
    coerceInputValue,
    GraphQLObjectType,
    GraphQLInterfaceType,
    valueFromASTUntyped,
    print,
    isInputType,
} from "graphql";
import type {
    ASTNode,
    ASTVisitor,
    DirectiveNode,
    GraphQLSchema,
    InterfaceTypeDefinitionNode,
    InterfaceTypeExtensionNode,
    ObjectTypeDefinitionNode,
    ObjectTypeExtensionNode,
} from "graphql";
import type { ASTValidationContext } from "graphql/validation/ValidationContext";
import { createGraphQLError } from "./utils/document-validation-error";
import { getPathToNode } from "./utils/path-parser";
import { isTemporal, isTemporalType } from "../../../constants";

export function coalesceDefaultValueOfCorrectTypeRule(schema: GraphQLSchema) {
    return function (context: ASTValidationContext): ASTVisitor {
        return {
            Directive(
                directiveNode: DirectiveNode,
                _key,
                _parent,
                path,
                ancestors: ReadonlyArray<ASTNode | ReadonlyArray<ASTNode>>
            ) {
                const directiveName = directiveNode.name.value;

                if (!["coalesce", "default"].includes(directiveName)) {
                    return;
                }

                const value = directiveNode.arguments?.find((argument) => argument.name.value === "value");

                if (!value) {
                    return;
                }

                const typeNode = ancestors.slice(-3, -2)[0];
                const fieldNode = ancestors.slice(-1)[0];

                if (!isAncestorAstNode(fieldNode) || fieldNode.kind !== Kind.FIELD_DEFINITION) {
                    return;
                }

                if (
                    !isAncestorAstNode(typeNode) ||
                    ![
                        Kind.INTERFACE_TYPE_DEFINITION,
                        Kind.OBJECT_TYPE_DEFINITION,
                        Kind.INTERFACE_TYPE_EXTENSION,
                        Kind.OBJECT_TYPE_EXTENSION,
                    ].includes(typeNode.kind)
                ) {
                    return;
                }

                const type = schema.getType(
                    (
                        typeNode as
                            | InterfaceTypeDefinitionNode
                            | ObjectTypeDefinitionNode
                            | InterfaceTypeExtensionNode
                            | ObjectTypeExtensionNode
                    ).name.value
                );

                if (!(type instanceof GraphQLObjectType || type instanceof GraphQLInterfaceType)) {
                    return;
                }

                const field = Object.values(type.getFields()).find((f) => f.name === fieldNode.name.value);

                if (!field) {
                    return;
                }

                const [pathToNode, traversedDef] = getPathToNode(path, ancestors);
                const pathToHere = [...pathToNode, `@${directiveName}`];

                if (!traversedDef) {
                    console.error("No last definition traversed");
                    return;
                }

                const inputType = field.type;

                if (!isInputType(inputType) || (directiveName === "coalesce" && isTemporalType(inputType))) {
                    context.reportError(
                        createGraphQLError({
                            nodes: [directiveNode, traversedDef],
                            path: pathToHere,
                            errorMsg: `Directive "@${directiveName}" is not supported on fields of type "${inputType.toString()}".`,
                        })
                    );
                    return;
                }

                const inputValue = valueFromASTUntyped(value.value);

                // try to coerce the argument value given the definition type, and report the error if this fails
                coerceInputValue(inputValue, inputType, () => {
                    context.reportError(
                        createGraphQLError({
                            nodes: [directiveNode, traversedDef],
                            path: [...pathToHere, "value"],
                            errorMsg: `Expected argument "value" on directive "@${directiveName}" to have type "${inputType.toString()}", found ${print(
                                value.value
                            )}.`,
                        })
                    );
                });
            },
        };
    };
}

function isAncestorAstNode(ancestor: ASTNode | readonly ASTNode[] | undefined): ancestor is ASTNode {
    if (!ancestor || Array.isArray(ancestor)) {
        return false;
    }

    return true;
}
