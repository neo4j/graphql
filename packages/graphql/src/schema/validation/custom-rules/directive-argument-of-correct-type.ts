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
    GraphQLDirective,
    GraphQLSchema,
} from "graphql";
import { coerceInputValue, valueFromASTUntyped, buildASTSchema } from "graphql";
import type { Maybe } from "graphql/jsutils/Maybe";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { VALIDATION_ERROR_CODES } from "../utils/validation-error-codes";
import type { AssertionResponse } from "./utils/document-validation-error";
import { createGraphQLError } from "./utils/document-validation-error";
import { getPathToNode } from "./utils/path-parser";

export function DirectiveArgumentOfCorrectType(includeAuthorizationDirectives: boolean = true) {
    return function (context: SDLValidationContext): ASTVisitor {
        // TODO: find a way to scope this schema instead of creating the whole document
        // should only contain dynamic directives and their associated types (typeWhere + jwt payload)
        let schema: GraphQLSchema | undefined;
        const getSchemaFromDocument = (): GraphQLSchema => {
            if (!schema) {
                schema = buildASTSchema(context.getDocument(), { assumeValid: true, assumeValidSDL: true });
            }
            return schema;
        };

        return {
            Directive(directiveNode: DirectiveNode, _key, _parent, path, ancenstors) {
                const oneOfAuthorizationDirectives =
                    includeAuthorizationDirectives &&
                    ["subscriptionsAuthorization", "authorization", "authentication"].reduce<string | undefined>(
                        (genericDirective, oneOfAuthorizationDirectives) => {
                            if (
                                !genericDirective &&
                                directiveNode.name.value
                                    .toLowerCase()
                                    .includes(oneOfAuthorizationDirectives.toLowerCase())
                            ) {
                                genericDirective = oneOfAuthorizationDirectives;
                            }
                            return genericDirective;
                        },
                        undefined
                    );
                const otherDirectives = ["fulltext", "relationship", "node", "customResolver", "cypher"].find(
                    (applicableDirectiveName) =>
                        directiveNode.name.value.toLowerCase() === applicableDirectiveName.toLowerCase()
                );

                if (!oneOfAuthorizationDirectives && !otherDirectives) {
                    return;
                }

                let directiveName: string;
                let directiveDefinition: Maybe<GraphQLDirective>;
                if (oneOfAuthorizationDirectives) {
                    directiveDefinition = getSchemaFromDocument().getDirective(directiveNode.name.value);
                    directiveName = oneOfAuthorizationDirectives;
                } else {
                    directiveDefinition = context.getSchema()?.getDirective(directiveNode.name.value);
                    directiveName = directiveNode.name.value;
                }

                if (!directiveDefinition) {
                    // Do not report, delegate this report to KnownDirectivesRule
                    return;
                }
                const pathToHere = [...getPathToNode(path, ancenstors)[0], `@${directiveName}`];
                for (const argument of directiveNode.arguments || []) {
                    const argumentDefinition = findArgumentDefinitionNodeByName(
                        directiveDefinition.args,
                        argument.name.value
                    );
                    if (!argumentDefinition) {
                        return;
                    }
                    const { isValid, errorMsg, errorPath } = assertArgumentType(argument, argumentDefinition);
                    if (!isValid) {
                        context.reportError(
                            createGraphQLError({
                                nodes: [argument, directiveNode],
                                path: [...pathToHere, argument.name.value, ...errorPath],
                                errorMsg: `Invalid argument: ${argument.name.value}, error: ${errorMsg}`,
                                extensions: {
                                    exception: { code: VALIDATION_ERROR_CODES[directiveName.toUpperCase()] },
                                },
                            })
                        );
                    }
                }
            },
        };
    };
}

function findArgumentDefinitionNodeByName(args: readonly GraphQLArgument[], name: string): GraphQLArgument | undefined {
    return args.find((arg) => arg.name === name);
}

function assertArgumentType(argumentNode: ArgumentNode, inputValueDefinition: GraphQLArgument): AssertionResponse {
    const argType = inputValueDefinition.type;
    const argValue = valueFromASTUntyped(argumentNode.value);

    let isValid = true;
    let errorMsg = "";
    let errorPath: readonly (string | number)[] = [];

    coerceInputValue(argValue, argType, (path, _invalidValue, error) => {
        isValid = false;
        errorMsg = error.message;
        errorPath = path;
    });

    return { isValid, errorMsg, errorPath };
}
