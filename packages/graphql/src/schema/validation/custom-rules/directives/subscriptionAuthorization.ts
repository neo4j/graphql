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

import type { ASTVisitor, FieldDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { subscriptionsAuthorizationDirectiveScaffold } from "../../../../graphql/directives/type-dependant-directives/subscriptions-authorization";
import { asArray } from "../../../../utils/utils";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { getPathToNode } from "../utils/path-parser";
import { fieldIsInNodeType, typeIsANodeType } from "./check-if-location-is-valid";

export function validateSubscriptionAuthorizationDirective(context: Neo4jValidationContext): ASTVisitor {
    const extensionsTypeMap = context.extensionsTypeMap;
    if (!extensionsTypeMap) {
        throw new Error("No extensionsTypeMap found in the context");
    }
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const appliedSubscriptionDirective = fieldDefinitionNode.directives?.find(
                (directive) => directive.name.value === subscriptionsAuthorizationDirectiveScaffold.name
            );

            if (!appliedSubscriptionDirective) {
                return;
            }

            const isValidLocation = fieldIsInNodeType({ path, ancestors, extensionsTypeMap });

            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${subscriptionsAuthorizationDirectiveScaffold.name}" requires to be used within the "@node" directive`,
                        []
                    );
                }
            });
            const pathToHere = getPathToNode(path, ancestors);

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToHere[0], `@${subscriptionsAuthorizationDirectiveScaffold.name}`],
                        errorMsg,
                    })
                );
            }
        },
        ObjectTypeDefinition(objectTypeDefinitionNode: ObjectTypeDefinitionNode, _key, _parent, path, ancestors) {
            const { directives } = objectTypeDefinitionNode;
            const objectTypeExtensionNodes = extensionsTypeMap[objectTypeDefinitionNode.name.value]?.extensions;
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
            const isValidLocation = typeIsANodeType({ objectTypeDefinitionNode, extensionsTypeMap });
            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${subscriptionsAuthorizationDirectiveScaffold.name}" requires to be used within the "@node" directive`,
                        []
                    );
                }
            });
            const pathToHere = getPathToNode(path, ancestors);
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectTypeDefinitionNode],
                        path: [...pathToHere[0], `@${subscriptionsAuthorizationDirectiveScaffold.name}`],
                        errorMsg,
                    })
                );
            }
        },
    };
}
