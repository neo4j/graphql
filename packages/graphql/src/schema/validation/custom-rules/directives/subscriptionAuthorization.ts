/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { ASTVisitor, FieldDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { subscriptionsAuthorizationDirectiveScaffold } from "../../../../graphql/directives/type-dependant-directives/subscriptions-authorization";
import { asArray } from "../../../../utils/utils";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { fieldIsInNodeType } from "../utils/location-helpers/is-in-node-type";
import { typeIsANodeType } from "../utils/location-helpers/is-node-type";
import { getPathToNode } from "../utils/path-parser";

export function validateSubscriptionAuthorizationDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const appliedSubscriptionDirective = fieldDefinitionNode.directives?.find(
                (directive) => directive.name.value === subscriptionsAuthorizationDirectiveScaffold.name
            );

            if (!appliedSubscriptionDirective) {
                return;
            }

            const isValidLocation = fieldIsInNodeType({ path, ancestors, typeMapWithExtensions });

            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${subscriptionsAuthorizationDirectiveScaffold.name}" must be in a type with "@node"`,
                        []
                    );
                }
            });
            const pathToNode = getPathToNode(path, ancestors);

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode[0], `@${subscriptionsAuthorizationDirectiveScaffold.name}`],
                        errorMsg,
                    })
                );
            }
        },
        ObjectTypeDefinition(objectTypeDefinitionNode: ObjectTypeDefinitionNode, _key, _parent, path, ancestors) {
            const { directives } = objectTypeDefinitionNode;
            const objectTypeExtensionNodes = typeMapWithExtensions[objectTypeDefinitionNode.name.value]?.extensions;
            const extensionsDirectives = asArray(objectTypeExtensionNodes).flatMap((extensionNode) => {
                return extensionNode.directives ?? [];
            });
            const allDirectives = [...(directives ?? []), ...extensionsDirectives];
            const appliedSubscriptionDirective = allDirectives.find(
                (directive) => directive.name.value === subscriptionsAuthorizationDirectiveScaffold.name
            );
            if (!appliedSubscriptionDirective) {
                return;
            }
            const isValidLocation = typeIsANodeType({ objectTypeDefinitionNode, typeMapWithExtensions });
            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${subscriptionsAuthorizationDirectiveScaffold.name}" must be in a type with "@node"`,
                        []
                    );
                }
            });
            const pathToNode = getPathToNode(path, ancestors);
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectTypeDefinitionNode],
                        path: [...pathToNode[0], `@${subscriptionsAuthorizationDirectiveScaffold.name}`],
                        errorMsg,
                    })
                );
            }
        },
    };
}
