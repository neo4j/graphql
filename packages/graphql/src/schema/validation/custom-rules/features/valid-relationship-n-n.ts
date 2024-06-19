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

import type { ASTVisitor, FieldDefinitionNode, TypeNode } from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { relationshipDirective } from "../../../../graphql/directives";
import { DocumentValidationError, assertValid, createGraphQLError } from "../utils/document-validation-error";
import { getPathToNode } from "../utils/path-parser";

export function ValidRelationshipNtoN(context: SDLValidationContext): ASTVisitor {
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const { type, directives } = fieldDefinitionNode;
            if (!directives) {
                return;
            }
            const relationshipDirectiveNode = directives.find(
                (directive) => directive.name.value === relationshipDirective.name
            );
            if (!relationshipDirectiveNode) {
                return;
            }

            const { isValid, errorMsg, errorPath } = assertValid(() => {
                if (!isListType(type)) {
                    throw new DocumentValidationError(`@relationship can only be used on List target`, []);
                }
            });
            const [pathToNode] = getPathToNode(path, ancestors);
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode, fieldDefinitionNode.name.value, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}

function isListType(type: TypeNode): boolean {
    if (type.kind === Kind.NON_NULL_TYPE) {
        return type.type.kind === Kind.LIST_TYPE;
    }
    return type.kind === Kind.LIST_TYPE;
}
