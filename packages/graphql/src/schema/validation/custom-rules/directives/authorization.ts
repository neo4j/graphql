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
import { authenticationDirectiveScaffold } from "../../../../graphql/directives/type-dependant-directives/authentication";
import { authorizationDirectiveScaffold } from "../../../../graphql/directives/type-dependant-directives/authorization";
import { asArray } from "../../../../utils/utils";
import type { Neo4jValidationContext } from "../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../utils/document-validation-error";
import { fieldIsInNodeType } from "../utils/location-helpers/is-in-node-type";
import { fieldIsInRootType } from "../utils/location-helpers/is-in-root-type";
import { typeIsANodeType } from "../utils/location-helpers/is-node-type";
import { getPathToNode } from "../utils/path-parser";

export function validateAuthorizationDirective(context: Neo4jValidationContext): ASTVisitor {
    const typeMapWithExtensions = context.typeMapWithExtensions;
    if (!typeMapWithExtensions) {
        throw new Error("No typeMapWithExtensions found in the context");
    }
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const authorizationDirective = fieldDefinitionNode.directives?.find(
                (directive) => directive.name.value === authorizationDirectiveScaffold.name
            );

            if (!authorizationDirective) {
                return;
            }

            const isValidLocation = fieldIsInNodeType({ path, ancestors, typeMapWithExtensions });

            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    // add specific error message for Root types usage
                    if (fieldIsInRootType({ path, ancestors, typeMapWithExtensions })) {
                        throw new DocumentValidationError(
                            `Directive @${authorizationDirectiveScaffold.name} is not supported on fields of the Query type. Did you mean to use @${authenticationDirectiveScaffold.name}?`,
                            []
                        );
                    }

                    throw new DocumentValidationError(
                        `Directive "@${authorizationDirectiveScaffold.name}" must be in a type with "@node"`,
                        []
                    );
                }
                if (authorizationDirective.arguments?.length === 0) {
                    throw new DocumentValidationError(
                        `@${authorizationDirectiveScaffold.name} requires at least one of ${[...authorizationDirectiveScaffold.args.map((arg) => arg.name)].join(", ")} arguments`,
                        []
                    );
                }
            });
            const pathToNode = getPathToNode(path, ancestors);

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode[0], `@${authorizationDirectiveScaffold.name}`],
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
            const authorizationDirective = allDirectives.find(
                (directive) => directive.name.value === authorizationDirectiveScaffold.name
            );
            if (!authorizationDirective) {
                return;
            }
            const isValidLocation = typeIsANodeType({ objectTypeDefinitionNode, typeMapWithExtensions });
            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "@${authorizationDirectiveScaffold.name}" must be in a type with "@node"`,
                        []
                    );
                }
                if (authorizationDirective.arguments?.length === 0) {
                    throw new DocumentValidationError(
                        `@${authorizationDirectiveScaffold.name} requires at least one of ${authorizationDirectiveScaffold.args.join(", ")} arguments`,
                        []
                    );
                }
            });
            const pathToNode = getPathToNode(path, ancestors);
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectTypeDefinitionNode],
                        path: [...pathToNode[0], `@${authorizationDirectiveScaffold.name}`],
                        errorMsg,
                    })
                );
            }
        },
    };
}
