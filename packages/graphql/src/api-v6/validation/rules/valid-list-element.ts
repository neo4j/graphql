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

import type { ASTVisitor, FieldDefinitionNode } from "graphql";
import { Kind } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { relationshipDirective } from "../../../graphql/directives";
import {
    assertValid,
    createGraphQLError,
    DocumentValidationError,
} from "../../../schema/validation/custom-rules/utils/document-validation-error";
import { getPathToNode } from "../../../schema/validation/custom-rules/utils/path-parser";
import { getInnerTypeName } from "../../../schema/validation/custom-rules/utils/utils";
import type { TypePath } from "./types";
import { findTypePathInTypePaths } from "./utils/find-type-path-in-type-paths";
import { getTypePath } from "./utils/get-type-path";
import { typeNodeToString } from "./utils/type-node-to-string";

export function ValidListField(context: SDLValidationContext): ASTVisitor {
    return {
        FieldDefinition(fieldDefinitionNode: FieldDefinitionNode, _key, _parent, path, ancestors) {
            const { type, directives } = fieldDefinitionNode;
            if (directives && directives.some((directive) => directive.name.value === relationshipDirective.name)) {
                return; // Skip relationship fields as they are validated separately with a more specific message
            }
            const { isValid, errorMsg, errorPath } = assertValid(() => {
                const typePath = getTypePath(type);
                if (typePath.includes(Kind.LIST_TYPE)) {
                    const wrappedType = getInnerTypeName(type);
                    const validTypePaths: TypePath[] = [
                        [Kind.LIST_TYPE, Kind.NON_NULL_TYPE, wrappedType],
                        [Kind.NON_NULL_TYPE, Kind.LIST_TYPE, Kind.NON_NULL_TYPE, wrappedType],
                    ];
                    if (!findTypePathInTypePaths(typePath, validTypePaths)) {
                        const typeStr = typeNodeToString(type);
                        throw new DocumentValidationError(
                            `List of non-null elements are not supported. Found: ${typeStr}`,
                            []
                        );
                    }
                }
            });
            const [pathToNode] = getPathToNode(path, ancestors);
            if (!isValid) {
                context.reportError(
                    createGraphQLError({
                        nodes: [fieldDefinitionNode],
                        path: [...pathToNode, ...errorPath],
                        errorMsg,
                    })
                );
            }
        },
    };
}
