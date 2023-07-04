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

import type { ASTVisitor, DirectiveNode, GraphQLArgument, ArgumentNode } from "graphql";
import { GraphQLError, coerceInputValue, valueFromASTUntyped, buildASTSchema } from "graphql";

import type { SDLValidationContext } from "graphql/validation/ValidationContext";

export function DirectiveArgumentOfCorrectType(context: SDLValidationContext): ASTVisitor {
    const schema = buildASTSchema(context.getDocument(), { assumeValid: true, assumeValidSDL: true });

    return {
        Directive(directiveNode: DirectiveNode) {
            // Validate only Authorization usage
            console.log("hello", directiveNode.name.value);
            if (!directiveNode.name.value.includes("Authorization") && !directiveNode.name.value.includes("fulltext")) {
                return;
            }
            console.log("continue with", directiveNode.name.value);

            const directiveDefinitionFromDocument = schema.getDirective(directiveNode.name.value);
            // console.log("def", directiveDefinitionFromDocument);
            const directiveDefinitionFromSchema = context.getSchema()?.getDirective(directiveNode.name.value);
            // console.log("def2", directiveDefinitionFromSchema);

            const directiveDefinition = directiveDefinitionFromDocument || directiveDefinitionFromSchema;

            if (!directiveDefinition) {
                // Do not report, delegate this report to KnownDirectivesRule
                return;
            }

            directiveNode.arguments?.forEach((argument) => {
                const argumentDefinition = findArgumentDefinitionNodeByName(
                    directiveDefinition.args,
                    argument.name.value
                );
                console.log("arg", argumentDefinition);
                if (!argumentDefinition) {
                    return;
                }
                const { isValid, errorMsg } = assertArgumentType(argument, argumentDefinition);
                if (!isValid) {
                    context.reportError(
                        new GraphQLError(`Invalid argument: ${argument.name.value}, error: ${errorMsg}`)
                    );
                }
            });
        },
    };
}

function findArgumentDefinitionNodeByName(args: readonly GraphQLArgument[], name: string): GraphQLArgument | undefined {
    return args.find((arg) => arg.name === name);
}

type AssertionResponse = {
    isValid: boolean;
    errorMsg?: string;
};

function assertArgumentType(argumentNode: ArgumentNode, inputValueDefinition: GraphQLArgument): AssertionResponse {
    const argType = inputValueDefinition.type;
    const argValue = valueFromASTUntyped(argumentNode.value);

    let isValid = true;
    let errorMsg;

    const onError = (_path: ReadonlyArray<string | number>, _invalidValue: unknown, error: Error) => {
        isValid = false;
        errorMsg = error.message;
    };

    coerceInputValue(argValue, argType, onError);

    return { isValid, errorMsg };
}
