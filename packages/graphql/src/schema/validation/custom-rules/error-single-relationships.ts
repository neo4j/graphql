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

import type { ASTVisitor, FieldDefinitionNode, ListTypeNode, NonNullTypeNode } from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { relationshipDirective } from "../../../graphql/directives";
import { createGraphQLError } from "./utils/document-validation-error";

export function ErrorIfSingleRelationships(context: SDLValidationContext): ASTVisitor {
    return {
        FieldDefinition(field: FieldDefinitionNode) {
            let isRelationship = false;
            for (const directive of field.directives ?? []) {
                if (directive.name.value === relationshipDirective.name) {
                    isRelationship = true;
                }
            }

            const isList = Boolean(getListTypeNode(field));
            if (isRelationship && !isList) {
                context.reportError(
                    createGraphQLError({
                        errorMsg: `Using @relationship directive on a non-list property "${field.name.value}" is not supported.`,
                    })
                );
            }
        },
    };
}

function getListTypeNode(definition: FieldDefinitionNode | ListTypeNode | NonNullTypeNode): ListTypeNode | undefined {
    if (definition.type.kind === Kind.NON_NULL_TYPE) {
        return getListTypeNode(definition.type);
    }

    if (definition.type.kind === Kind.LIST_TYPE) {
        return definition.type;
    }

    return;
}
