/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ASTVisitor, FieldDefinitionNode } from "graphql";
import { relayIdDirective } from "../../../../graphql/directives";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { fieldIsInNodeType } from "../utils/location-helpers/is-in-node-type";
import { getPathToNode } from "../utils/path-parser";

export function validateRelayIdDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }

    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            if (!fieldDefinitionNode.directives?.find((directive) => directive.name.value === relayIdDirective.name)) {
                return;
            }
            const isValidLocation = fieldIsInNodeType({ path, ancestors, typeMapWithExtensions });

            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${relayIdDirective.name}" must be in a type with "@node"`,
                        []
                    );
                }
            });
            const pathToNode = getPathToNode(path, ancestors);

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode[0], `@${relayIdDirective.name}`],
                        errorMsg,
                    })
                );
            }
        },
    };
}
