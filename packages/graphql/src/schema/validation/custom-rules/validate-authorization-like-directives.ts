/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
