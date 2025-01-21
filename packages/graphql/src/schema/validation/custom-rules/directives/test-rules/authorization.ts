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
import { authorizationDirectiveScaffold } from "../../../../../graphql/directives/type-dependant-directives/authorization";
import { asArray } from "../../../../../utils/utils";
import type { Neo4jValidationContext } from "../../../Neo4jValidationContext";
import { assertValid, createGraphQLError, DocumentValidationError } from "../../utils/document-validation-error";
import { getPathToNode } from "../../utils/path-parser";
import { fieldIsInNodeType, typeIsANodeType } from "./check-if-location-is-valid";

export function validateAuthorizationDirective(context: Neo4jValidationContext): ASTVisitor {
    const extensionsTypeMap = context.extensionsTypeMap;
    if (!extensionsTypeMap) {
        throw new Error("No extensionsTypeMap found in the context");
    }
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const authorizationDirective = fieldDefinitionNode.directives?.find(
                (directive) => directive.name.value === authorizationDirectiveScaffold.name
            );

            if (!authorizationDirective) {
                return;
            }

            const isValidLocation = fieldIsInNodeType({ path, ancestors, extensionsTypeMap });

            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    // TODO:
                    // this was: Invalid directive usage: Directive @authorization is not supported on fields of the Query type. Did you mean to use @authentication?
                    // when the field was on a Query type, perahps a more specific error message would be better
                    throw new DocumentValidationError(
                        `Directive "${authorizationDirectiveScaffold.name}" requires to be used within the "@node" directive`,
                        []
                    );
                }
                if (authorizationDirective.arguments?.length === 0) {
                    throw new DocumentValidationError(
                        `@authorization requires at least one of ${[...authorizationDirectiveScaffold.args.map((arg) => arg.name)].join(", ")} arguments`,
                        []
                    );
                }
            });
            const pathToHere = getPathToNode(path, ancestors);

            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToHere[0], `@${authorizationDirectiveScaffold.name}`],
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
            const authorizationDirective = allDirectives.find(
                (directive) => directive.name.value === authorizationDirectiveScaffold.name
            );
            if (!authorizationDirective) {
                return;
            }
            const isValidLocation = typeIsANodeType({ objectTypeDefinitionNode, extensionsTypeMap });
            const { isValid, errorMsg } = assertValid(() => {
                if (!isValidLocation) {
                    throw new DocumentValidationError(
                        `Directive "${authorizationDirectiveScaffold.name}" requires to be used within the "@node" directive`,
                        []
                    );
                }
                if (authorizationDirective.arguments?.length === 0) {
                    throw new DocumentValidationError(
                        `@authorization requires at least one of ${authorizationDirectiveScaffold.args.join(", ")} arguments`,
                        []
                    );
                }
            });
            const pathToHere = getPathToNode(path, ancestors);
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [objectTypeDefinitionNode],
                        path: [...pathToHere[0], `@${authorizationDirectiveScaffold.name}`],
                        errorMsg,
                    })
                );
            }
        },
    };
}
