/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ASTVisitor, DirectiveNode } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import {
    customResolverDirective,
    cypherDirective,
    fulltextDirective,
    nodeDirective,
    relationshipDirective,
} from "../../../graphql/directives";
import { VALIDATION_ERROR_CODES } from "../utils/validation-error-codes";
import { createGraphQLError } from "./utils/document-validation-error";
import { getPathToNode } from "./utils/path-parser";
import { assertArgumentType, findArgumentDefinitionNodeByName } from "./utils/utils";

export function ValidateNeo4jDirectiveArgumentsValue(context: SDLValidationContext): ASTVisitor {
    const schema = context.getSchema();
    if (!schema) {
        throw new Error("Validation error: schema is not available");
    }

    return {
        Directive(directiveNode: DirectiveNode, _key, _parent, path, ancestors) {
            const neo4jDirectiveToValidate = [
                fulltextDirective.name,
                relationshipDirective.name,
                nodeDirective.name,
                customResolverDirective.name,
                cypherDirective.name,
            ].find(
                (applicableDirectiveName) =>
                    directiveNode.name.value.toLowerCase() === applicableDirectiveName.toLowerCase()
            );

            if (!neo4jDirectiveToValidate) {
                return;
            }

            const directiveDefinition = schema.getDirective(directiveNode.name.value);
            const directiveName = directiveNode.name.value;

            if (!directiveDefinition) {
                // Do not report, delegate this report to KnownDirectivesRule
                return;
            }
            const pathToHere = [...getPathToNode(path, ancestors)[0], `@${directiveName}`];
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
                                exception: { code: VALIDATION_ERROR_CODES[directiveName.toUpperCase()] },
                            },
                        })
                    );
                }
            }
        },
    };
}
