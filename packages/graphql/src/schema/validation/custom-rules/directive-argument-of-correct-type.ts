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
    GraphQLArgument,
    ArgumentNode,
    ASTNode,
    ObjectTypeDefinitionNode,
    FieldDefinitionNode,
} from "graphql";
import { GraphQLError, coerceInputValue, valueFromASTUntyped, buildASTSchema } from "graphql";

import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { VALIDATION_ERROR_CODES } from "../utils/validation-error-codes";

export function DirectiveArgumentOfCorrectType(context: SDLValidationContext): ASTVisitor {
    const schema = buildASTSchema(context.getDocument(), { assumeValid: true, assumeValidSDL: true });

    return {
        Directive(directiveNode: DirectiveNode, _key, _parent, path, ancenstors) {
            const genericDirectiveName = ["authorization", "authentication"].find((applicableDirectiveName) =>
                directiveNode.name.value.toLowerCase().includes(applicableDirectiveName)
            );
            // Validate only Authorization/Authentication usage
            if (!genericDirectiveName) {
                return;
            }
            const directiveDefinition = schema.getDirective(directiveNode.name.value);
            if (!directiveDefinition) {
                // Do not report, delegate this report to KnownDirectivesRule
                return;
            }
            const pathToHere = [...getPathToDirectiveNode(path, ancenstors), `@${genericDirectiveName}`];

            directiveNode.arguments?.forEach((argument) => {
                const argumentDefinition = findArgumentDefinitionNodeByName(
                    directiveDefinition.args,
                    argument.name.value
                );
                if (!argumentDefinition) {
                    return;
                }
                const { isValid, errorMsg, errorPath } = assertArgumentType(argument, argumentDefinition);
                if (!isValid) {
                    const errorOpts = {
                        nodes: [argument, directiveNode],
                        extensions: {
                            exception: { code: VALIDATION_ERROR_CODES[genericDirectiveName.toUpperCase()] },
                        },
                        path: [...pathToHere, argument.name.value, ...errorPath],
                        source: undefined,
                        positions: undefined,
                        originalError: undefined,
                    };

                    // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                    context.reportError(
                        new GraphQLError(
                            `Invalid argument: ${argument.name.value}, error: ${errorMsg}`,
                            errorOpts.nodes,
                            errorOpts.source,
                            errorOpts.positions,
                            errorOpts.path,
                            errorOpts.originalError,
                            errorOpts.extensions
                        )
                    );
                }
            });
        },
    };
}

function findArgumentDefinitionNodeByName(args: readonly GraphQLArgument[], name: string): GraphQLArgument | undefined {
    return args.find((arg) => arg.name === name);
}

function getPathToDirectiveNode(
    path: readonly (number | string)[],
    ancenstors: readonly (ASTNode | readonly ASTNode[])[]
): Array<string> {
    const documentASTNodes = ancenstors[1];
    if (!documentASTNodes || (Array.isArray(documentASTNodes) && !documentASTNodes.length)) {
        return [];
    }
    const [, definitionIdx] = path;
    const traversedDefinition = documentASTNodes[definitionIdx as number];
    const pathToHere: string[] = [traversedDefinition?.name?.value];
    const getNextDefinition = parsePath(path, traversedDefinition);
    for (const definition of getNextDefinition()) {
        pathToHere.push(definition.name.value);
    }
    return pathToHere;
}

function parsePath(
    path: readonly (number | string)[],
    traversedDefinition: ObjectTypeDefinitionNode | FieldDefinitionNode
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

function assertArgumentType(argumentNode: ArgumentNode, inputValueDefinition: GraphQLArgument): AssertionResponse {
    const argType = inputValueDefinition.type;
    const argValue = valueFromASTUntyped(argumentNode.value);

    let isValid = true;
    let errorMsg, errorPath;

    const onError = (_path: ReadonlyArray<string | number>, _invalidValue: unknown, error: Error) => {
        isValid = false;
        errorMsg = error.message;
        errorPath = _path;
    };

    coerceInputValue(argValue, argType, onError);

    return { isValid, errorMsg, errorPath };
}
