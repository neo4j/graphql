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

import type { ASTVisitor, DirectiveNode } from "graphql";
import { extendSchema } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { VALIDATION_ERROR_CODES } from "../utils/validation-error-codes";
import { createGraphQLError } from "./utils/document-validation-error";
import { getPathToNode } from "./utils/path-parser";
import { assertArgumentType, findArgumentDefinitionNodeByName } from "./utils/utils";

/**
 * ValidateAuthorizationLikeDirectives validates the directives subscriptionsAuthorization, authorization, authentication
 **/
export function ValidateAuthorizationLikeDirectives(context: SDLValidationContext): ASTVisitor {
    const validationSchema = context.getSchema();
    if (!validationSchema) {
        throw new Error("Validation error: schema is not available");
    }
    const schema = extendSchema(validationSchema, context.getDocument(), { assumeValid: true, assumeValidSDL: true });

    return {
        Directive(directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
            const authorizationLikeDirective = ["subscriptionsAuthorization", "authorization", "authentication"].find(
                (authLikeDirective) => {
                    // find authorizationLike directive generated for validation purposes such a MovieAuthorization
                    // see packages/graphql/src/graphql/directives/type-dependant-directives/authorization.ts as example
                    return directiveNode.name.value.toLowerCase().includes(authLikeDirective.toLowerCase());
                }
            );
            if (!authorizationLikeDirective) {
                return;
            }

            const directiveDefinition = schema.getDirective(directiveNode.name.value);

            if (!directiveDefinition) {
                // Do not report, delegate this report to KnownDirectivesRule
                return;
            }

            const pathToHere = [...getPathToNode(path, ancestors)[0], `@${authorizationLikeDirective}`];
            for (const argument of directiveNode.arguments ?? []) {
                const argumentDefinition = findArgumentDefinitionNodeByName(
                    directiveDefinition.args,
                    argument.name.value
                );
                if (!argumentDefinition) {
                    return; // If argument name is not found, delegate to KnownArgumentNamesRule
                }
                const { isValid, errorMsg, errorPath } = assertArgumentType(argument, argumentDefinition);
                if (!isValid) {
                    context.reportError(
                        createGraphQLError({
                            nodes: [argument, directiveNode],
                            path: [...pathToHere, argument.name.value, ...errorPath],
                            errorMsg: `Invalid argument: ${argument.name.value}, error: ${errorMsg}`,
                            extensions: {
                                exception: { code: VALIDATION_ERROR_CODES[authorizationLikeDirective.toUpperCase()] },
                            },
                        })
                    );
                }
            }
        },
    };
}
